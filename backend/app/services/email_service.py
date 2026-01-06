import logging

from app.utils.email_client import EmailClient
from app.config import settings

log = logging.getLogger(__name__)


class EmailService:
    @classmethod
    def send_verify_email(cls, email: str, username: str, url: str):
        log.debug("Sending email to %s", email, extra={"email": email})
        try:
            subject = "Подтверждение эл. почты"
            html = EmailClient.render(
                template_path="confirm_email.html",
                username=username,
                url=url,
                expire_minutes=settings.EMAIL_TOKEN_EXPIRE_MINUTES,
                company_name=settings.COMPANY_NAME
            )
            body = EmailClient.render(
                template_path="confirm_email.txt",
                username=username,
                url=url,
                company_name=settings.COMPANY_NAME
            )

            EmailClient.send_email(to=email, subject=subject, html=html, body=body)
            log.info("Verify email sent to %s", email, extra={"email": email})
        except Exception as e:
            log.error("Failed to send email to %s", email, extra={"email": email})
            raise e