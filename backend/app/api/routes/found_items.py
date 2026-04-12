from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.firebase_admin_init import get_db
from app.services.tasks.match_tasks import run_matching

router = APIRouter()


@router.post("/")
async def create_found_item(item_data: Dict[str, Any]):
    """
    POST /api/v1/found-items
    Saves a found item to Firebase RTDB and triggers the matching pipeline.
    """
    try:
        fb = get_db()
        item_data["type"] = "found"
        item_data["status"] = "pending"

        new_ref = fb.reference("items").push(item_data)
        found_item_id = new_ref.key

        # Trigger Celery matching task (async, non-blocking)
        run_matching.delay(found_item_id)

        return {"id": found_item_id, "status": "created", "message": "Found item submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches/{match_id}")
async def get_match(match_id: str):
    """
    GET /api/v1/matches/{match_id}
    Returns match record with both items and scores.
    """
    try:
        fb = get_db()
        match_data = fb.reference(f"matches/{match_id}").get()
        if not match_data:
            raise HTTPException(status_code=404, detail="Match not found")

        lost_item = fb.reference(f"items/{match_data['lostItemId']}").get()
        found_item = fb.reference(f"items/{match_data['foundItemId']}").get()

        return {
            "id": match_id,
            "lost_item": {"id": match_data["lostItemId"], **(lost_item or {})},
            "found_item": {"id": match_data["foundItemId"], **(found_item or {})},
            "scores": {
                "text_score": match_data.get("text_score", 0),
                "image_score": match_data.get("image_score", 0),
                "location_score": match_data.get("location_score", 0),
                "time_score": match_data.get("time_score", 0),
                "total_score": match_data.get("matchScore", 0),
            },
            "status": match_data.get("status", "pending"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches/my-matches")
async def get_my_matches(user_id: str = ""):
    """
    GET /api/v1/matches/my-matches?user_id=xxx
    Returns all matches for the given user's lost items, sorted by score DESC.
    """
    try:
        fb = get_db()

        # Get all items by this user
        user_items = fb.reference("items").order_by_child("userId").equal_to(user_id).get() or {}
        lost_item_ids = {k for k, v in user_items.items() if v.get("type") == "lost"}

        if not lost_item_ids:
            return []

        # Get all matches
        all_matches = fb.reference("matches").get() or {}
        user_matches = []
        for mid, mdata in all_matches.items():
            if mdata.get("lostItemId") in lost_item_ids:
                user_matches.append({"id": mid, **mdata})

        user_matches.sort(key=lambda m: m.get("matchScore", 0), reverse=True)
        return user_matches
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/lost-items/{item_id}/resolve")
async def resolve_lost_item(item_id: str):
    """
    PATCH /api/v1/lost-items/{id}/resolve
    Sets status = resolved on the item.
    """
    try:
        fb = get_db()
        item_ref = fb.reference(f"items/{item_id}")
        item = item_ref.get()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        item_ref.update({"status": "resolved"})
        return {"status": "success", "message": "Item marked as resolved"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
