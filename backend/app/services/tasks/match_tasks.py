import json
from datetime import datetime, timezone
from app.celery_app import celery_app
from app.firebase_admin_init import get_db
from app.services.matching_service import score_items, compute_text_embedding
from app.services.tasks.email_tasks import send_match_email


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def run_matching(self, found_item_id: str):
    """
    Celery task triggered after a found item is saved to Firebase RTDB.
    Compares the found item against all approved lost items in the same category.
    """
    try:
        fb = get_db()

        # 1. Load found item from Firebase RTDB
        found_ref = fb.reference(f"items/{found_item_id}")
        found_item = found_ref.get()
        if not found_item:
            print(f"Found item {found_item_id} not found in DB")
            return

        # 2. Compute text embedding if missing
        if not found_item.get("text_embedding"):
            text_to_embed = f"{found_item.get('category', '')} {found_item.get('brand', '')} {found_item.get('model', '')} {found_item.get('description', '')} {found_item.get('color', '')}"
            found_item["text_embedding"] = compute_text_embedding(text_to_embed)
            found_ref.update({"text_embedding": found_item["text_embedding"]})

        # 3. Load all items, filter for approved lost items with same category
        all_items = fb.reference("items").order_by_child("category").equal_to(found_item.get("category", "")).get() or {}

        for lost_id, lost_item in all_items.items():
            if lost_item.get("type") != "lost" or lost_item.get("status") != "approved":
                continue

            # 3a. Skip if match already exists
            existing = fb.reference("matches").order_by_child("lostItemId").equal_to(lost_id).get() or {}
            already_matched = any(
                m.get("foundItemId") == found_item_id for m in existing.values()
            )
            if already_matched:
                continue

            # 3b. Compute text embedding for lost item if missing
            if not lost_item.get("text_embedding"):
                text_to_embed = f"{lost_item.get('category', '')} {lost_item.get('brand', '')} {lost_item.get('model', '')} {lost_item.get('description', '')} {lost_item.get('color', '')}"
                lost_item["text_embedding"] = compute_text_embedding(text_to_embed)
                fb.reference(f"items/{lost_id}").update({"text_embedding": lost_item["text_embedding"]})

            # 3c. Build scoring dicts
            lost_scoring = {
                "category": lost_item.get("category"),
                "text_embedding": lost_item.get("text_embedding"),
                "image_hashes": lost_item.get("image_hashes", []),
                "location": {
                    "from_lat": lost_item.get("locationFromLat"),
                    "from_lng": lost_item.get("locationFromLng"),
                    "to_lat": lost_item.get("locationToLat"),
                    "to_lng": lost_item.get("locationToLng"),
                },
                "time": {
                    "lost_from": lost_item.get("timeFrom"),
                    "lost_until": lost_item.get("timeTo"),
                },
            }
            found_scoring = {
                "category": found_item.get("category"),
                "text_embedding": found_item.get("text_embedding"),
                "image_hashes": found_item.get("image_hashes", []),
                "location": {
                    "lat": found_item.get("locationFromLat"),
                    "lng": found_item.get("locationFromLng"),
                },
                "time": {
                    "found_at": found_item.get("timeFrom"),
                },
            }

            scores = score_items(lost_scoring, found_scoring)
            total_score = scores["total_score"]

            # 3d. Insert match record into Firebase RTDB
            match_data = {
                "lostItemId": lost_id,
                "foundItemId": found_item_id,
                "matchScore": round(total_score * 100, 1),
                "text_score": round(scores["text_score"], 4),
                "image_score": round(scores["image_score"], 4),
                "location_score": round(scores["location_score"], 4),
                "time_score": round(scores["time_score"], 4),
                "status": "pending",
                "createdAt": {".sv": "timestamp"},
            }
            match_ref = fb.reference("matches").push(match_data)
            match_id = match_ref.key

            # 3e. If total_score >= 0.95, notify the lost item owner
            if total_score >= 0.95:
                owner_id = lost_item.get("userId")
                notification_data = {
                    "userId": owner_id,
                    "type": "match_found",
                    "message": f"Good news! We found a potential match ({round(total_score*100)}%) for your lost {lost_item.get('category', 'item')}.",
                    "matchId": match_id,
                    "read": False,
                    "createdAt": {".sv": "timestamp"},
                }
                fb.reference("notifications").push(notification_data)

                # Send email to lost item owner
                owner_ref = fb.reference(f"users/{owner_id}").get()
                if owner_ref and owner_ref.get("email"):
                    send_match_email.delay(
                        owner_ref["email"],
                        {**lost_item, "id": lost_id},
                        {**found_item, "id": found_item_id},
                        scores,
                    )

        # 4. Mark found item as match-processed
        found_ref.update({"match_processed": True})
        print(f"Matching complete for found item {found_item_id}")

    except Exception as exc:
        print(f"Error in run_matching task: {exc}. Retrying...")
        raise self.retry(exc=exc)
