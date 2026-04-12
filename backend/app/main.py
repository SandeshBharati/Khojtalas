import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.firebase_admin_init import init_firebase
from app.api.routes.found_items import router as found_items_router
from app.api.routes.notifications import router as notifications_router

# Initialize Firebase Admin SDK on startup
init_firebase()

app = FastAPI(title='Khojtalas Backend', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:4000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(found_items_router, prefix='/api/v1/found-items', tags=['found-items'])
app.include_router(notifications_router, prefix='/api/v1/notifications', tags=['notifications'])


@app.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok'}
