import logging

from app.utils.celery_app import celery_app
from app.services.email_service import EmailService

log = logging.getLogger(__name__)

class EmailTasks:

    @staticmethod
    @celery_app.task
    def send_verify_email_task(email: str, username: str, url: str):
        EmailService.send_verify_email(email, username, url)