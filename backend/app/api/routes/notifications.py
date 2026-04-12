from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from typing import Dict, List
from app.firebase_admin_init import get_db

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending to user {user_id}: {e}")

    async def broadcast(self, message: dict):
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to user {user_id}: {e}")


connection_manager = ConnectionManager()


def decode_token(token: str) -> str:
    """Decode a Firebase ID token or simple user_id token."""
    if not token:
        raise ValueError("No token provided")
    # In production, verify with firebase_admin.auth.verify_id_token(token)
    # For now, accept the token as-is (the user_id).
    return token


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str = Query(None)):
    try:
        decoded_user_id = decode_token(token)
        if decoded_user_id != user_id:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    await connection_manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(user_id, websocket)


# REST Endpoints


@router.get("/")
async def get_notifications(user_id: str = "", page: int = 1, size: int = 20, type: str = None):
    """
    GET /api/v1/notifications?user_id=xxx&page=1&size=20&type=match_found
    Returns paginated notifications for the given user.
    """
    try:
        fb = get_db()
        all_notifs = fb.reference("notifications").order_by_child("userId").equal_to(user_id).get() or {}

        items = []
        for nid, ndata in all_notifs.items():
            if type and ndata.get("type") != type:
                continue
            items.append({"id": nid, **ndata})

        # Sort by createdAt descending
        items.sort(key=lambda n: n.get("createdAt", 0), reverse=True)

        # Paginate
        total = len(items)
        start = (page - 1) * size
        end = start + size
        return {"items": items[start:end], "total": total, "page": page, "size": size}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """
    PATCH /api/v1/notifications/{id}/read
    Marks a single notification as read.
    """
    try:
        fb = get_db()
        fb.reference(f"notifications/{notification_id}").update({"read": True})
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/read-all")
async def mark_all_notifications_read(user_id: str = ""):
    """
    PATCH /api/v1/notifications/read-all?user_id=xxx
    Marks all notifications as read for the given user.
    """
    try:
        fb = get_db()
        notifs = fb.reference("notifications").order_by_child("userId").equal_to(user_id).get() or {}
        updates = {}
        for nid, ndata in notifs.items():
            if not ndata.get("read"):
                updates[f"notifications/{nid}/read"] = True
        if updates:
            fb.reference().update(updates)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
