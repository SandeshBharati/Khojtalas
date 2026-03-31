from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, Depends
from typing import Dict, List
import json
from datetime import datetime

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Dict of user_id -> list of active WebSocket connections
        # (one user can have multiple tabs open)
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

# Authentication:
# - On WebSocket connect, read ?token= query param
# - Decode JWT, extract user_id
# - If invalid token -> close connection with code 4001

def decode_token(token: str) -> str:
    # Mock token decoding
    # In a real app, use jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    if not token:
        raise ValueError("No token provided")
    # For testing, assume token is the user_id
    return token

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str = Query(None)):
    try:
        # Authentication
        decoded_user_id = decode_token(token)
        if decoded_user_id != user_id:
            await websocket.close(code=4001)
            return
    except Exception as e:
        await websocket.close(code=4001)
        return

    await connection_manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(user_id, websocket)

# REST Endpoints

@router.get("/")
async def get_notifications(page: int = 1, size: int = 20, type: str = None):
    """
    GET /api/v1/notifications
    -> paginated list for current user
    -> query params: ?page=1&size=20&type=MATCH_FOUND
    """
    # Mock implementation
    return {"items": [], "total": 0, "page": page, "size": size}

@router.patch("/{id}/read")
async def mark_notification_read(id: int):
    """
    PATCH /api/v1/notifications/{id}/read
    -> mark single notification as read
    """
    # Mock implementation
    return {"status": "success"}

@router.patch("/read-all")
async def mark_all_notifications_read():
    """
    PATCH /api/v1/notifications/read-all
    -> mark all as read
    """
    # Mock implementation
    return {"status": "success"}
