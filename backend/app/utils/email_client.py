import smtplib
import logging
import os

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from jinja2 import Environment, FileSystemLoader

from app.config import settings

log = logging.getLogger(__name__)

class EmailClient:
    env = Environment(
        loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "..", "templates"))
    )

    @classmethod
    def render(cls, template_path, **kwargs):
        log.debug(f"Rendering {template_path}", extra={"kwargs": kwargs, "template_path": template_path})
        template = cls.env.get_template(template_path)
        return template.render(**kwargs)


    @classmethod
    def send_email(cls, to: str, subject: str, html: str, body: str):
        log.info("Sending email", extra={"subject": subject, "to": to})
        try:
            msg = MIMEMultipart()
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_EMAIL
            msg["To"] = to

            msg.attach(MIMEText(html, "html", "utf-8"))
            msg.attach(MIMEText(body, "plain", "utf-8"))

            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as smtp:
                if not settings.MODE == "DEV":
                    smtp.starttls()
                    smtp.login(settings.SMTP_EMAIL, settings.SMTP_PASS)
                smtp.send_message(msg)
            log.info("Email sent successfully", extra={"to": to, "subject": subject})
        except Exception as e:
            log.error(f"Failed to send email: {str(e)}", extra={"to": to, "subject": subject})
            raise e