"""
Celery application configuration.

Uses Redis as broker. Set CELERY_BROKER_URL (defaults to redis://localhost:6379/0).
"""

import os
from celery import Celery

broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
result_backend = os.getenv("CELERY_RESULT_BACKEND", broker_url)

celery_app = Celery(
    "khojtalas",
    broker=broker_url,
    backend=result_backend,
    include=["app.services.tasks.match_tasks", "app.services.tasks.email_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
