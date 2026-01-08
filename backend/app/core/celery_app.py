from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "app.core.celery_app",
    broker=settings.RABBITMQ_URL,
    backend="rpc://"
)

celery_app.autodiscover_tasks(["app.tasks"])