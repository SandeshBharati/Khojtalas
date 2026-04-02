from fastapi import FastAPI

from app.api.routes.found_items import router as found_items_router
from app.api.routes.notifications import router as notifications_router

app = FastAPI(title='Khojtalas Backend', version='1.0.0')

app.include_router(found_items_router, prefix='/api/v1/found-items', tags=['found-items'])
app.include_router(notifications_router, prefix='/api/v1/notifications', tags=['notifications'])


@app.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok'}
