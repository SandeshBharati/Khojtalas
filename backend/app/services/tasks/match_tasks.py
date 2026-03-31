import json
from celery import shared_task
from app.services.matching_service import score_items, compute_text_embedding
from app.services.tasks.email_tasks import send_match_email
from app.api.routes.notifications import connection_manager
from datetime import datetime

# Mock DB imports (assume these exist in a real app)
# from app.db.session import SessionLocal
# from app.models.item import FoundItem, LostItem, ItemMatch, Notification

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def run_matching(self, found_item_id: int):
    """
    Celery task triggered by POST /api/v1/found-items (after DB save)
    """
    try:
        # 1. Load found item from DB
        # db = SessionLocal()
        # found_item = db.query(FoundItem).get(found_item_id)
        # if not found_item: return
        
        # 2. If found item has no text_embedding -> compute and save it
        # if not found_item.text_embedding:
        #     text_to_embed = f"{found_item.title} {found_item.description} {json.dumps(found_item.extra_fields)}"
        #     found_item.text_embedding = compute_text_embedding(text_to_embed)
        #     db.commit()
            
        # 3. Load all approved lost items with same category
        # approved_lost_items = db.query(LostItem).filter(
        #     LostItem.category == found_item.category,
        #     LostItem.status == 'APPROVED'
        # ).all()
        
        # 4. For each lost item:
        # for lost_item in approved_lost_items:
        #     a. Skip if match record already exists for this pair
        #     existing_match = db.query(ItemMatch).filter(
        #         ItemMatch.lost_item_id == lost_item.id,
        #         ItemMatch.found_item_id == found_item.id
        #     ).first()
        #     if existing_match: continue
            
        #     b. Compute scores (text, image, location, time)
        #     scores = score_items(lost_item.to_dict(), found_item.to_dict())
            
        #     c. Compute total_score
        #     total_score = scores['total_score']
            
        #     d. Insert ItemMatch record
        #     match_record = ItemMatch(
        #         lost_item_id=lost_item.id,
        #         found_item_id=found_item.id,
        #         text_score=scores['text_score'],
        #         image_score=scores['image_score'],
        #         location_score=scores['location_score'],
        #         time_score=scores['time_score'],
        #         total_score=total_score,
        #         notified=(total_score >= 0.95)
        #     )
        #     db.add(match_record)
        #     db.commit()
            
        #     e. If total_score >= 0.95:
        #     if total_score >= 0.95:
        #         - Create Notification record for lost item owner
        #         notification = Notification(
        #             user_id=lost_item.owner_id,
        #             type="MATCH_FOUND",
        #             message=f"Someone found an item matching your lost {lost_item.title} - {total_score*100:.1f}% match!",
        #             match_id=match_record.id
        #         )
        #         db.add(notification)
        #         db.commit()
                
        #         - Call send_match_email.delay(...)
        #         send_match_email.delay(
        #             lost_item.owner_email,
        #             lost_item.to_dict(),
        #             found_item.to_dict(),
        #             scores
        #         )
                
        #         - Send WebSocket event (see Part 3)
        #         ws_payload = {
        #             "type": "MATCH_FOUND",
        #             "match_id": match_record.id,
        #             "lost_item_id": lost_item.id,
        #             "found_item_id": found_item.id,
        #             "score": total_score,
        #             "score_pct": f"{total_score*100:.1f}%",
        #             "lost_item_title": lost_item.title,
        #             "found_item_thumbnail": found_item.photos[0] if found_item.photos else None,
        #             "message": notification.message,
        #             "timestamp": datetime.utcnow().isoformat() + "Z"
        #         }
        #         connection_manager.send_to_user(lost_item.owner_id, ws_payload)
                
        # 5. Mark found_item.match_processed = True
        # found_item.match_processed = True
        # db.commit()
        
        pass # Implementation details commented out to avoid missing dependency errors
        
    except Exception as exc:
        # If task fails -> retry up to 3 times with 60s delay
        # Log each retry attempt
        print(f"Error in run_matching task: {exc}. Retrying...")
        raise self.retry(exc=exc)
