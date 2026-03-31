from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.services.tasks.match_tasks import run_matching

router = APIRouter()

@router.post("/")
async def create_found_item(item_data: Dict[str, Any]):
    """
    POST /api/v1/found-items
    -> saves found item, triggers run_matching.delay(id)
    """
    try:
        # Mock DB save
        # db = SessionLocal()
        # found_item = FoundItem(**item_data)
        # db.add(found_item)
        # db.commit()
        # db.refresh(found_item)
        
        # Trigger Celery task (async, non-blocking)
        # run_matching.delay(found_item.id)
        
        # Mock response
        found_item_id = 15
        print(f"Triggering run_matching task for found_item_id: {found_item_id}")
        
        return {"id": found_item_id, "status": "created", "message": "Found item submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/matches/{match_id}")
async def get_match(match_id: int):
    """
    GET /api/v1/matches/{match_id}
    -> returns match with both items, scores
    -> restricted to lost item owner or admin
    """
    # Mock implementation
    return {
        "id": match_id,
        "lost_item": {"id": 7, "title": "iPhone 17 Pro Max"},
        "found_item": {"id": 15, "title": "Found iPhone 17 Pro Max"},
        "scores": {
            "text_score": 0.97,
            "image_score": 0.88,
            "location_score": 1.0,
            "time_score": 1.0,
            "total_score": 0.9565
        }
    }

@router.get("/matches/my-matches")
async def get_my_matches():
    """
    GET /api/v1/matches/my-matches
    -> all matches for current user's lost items
    -> sorted by total_score DESC
    """
    # Mock implementation
    return []

@router.patch("/lost-items/{id}/resolve")
async def resolve_lost_item(id: int):
    """
    PATCH /api/v1/lost-items/{id}/resolve
    -> set status = RESOLVED
    -> restricted to item owner only
    -> sends resolution emails to both parties
    """
    # Mock implementation
    return {"status": "success", "message": "Item marked as resolved"}
