import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def send_verification_email(email: str, verification_token: str) -> bool:
    """
    Send a verification email to the user.
    Returns True if successful, False otherwise.
    """
    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_USERNAME
        msg["To"] = email
        msg["Subject"] = "Verify your email address"

        verification_link = f"{BACKEND_URL}/verify-email/{verification_token}"

        body = f"""
        Hello!

        Please verify your email address by clicking the link below:
        {verification_link}

        This link will expire in 24 hours.

        If you didn't create an account, you can safely ignore this email.

        Best regards,
        The GuessWhere Team
        """

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        return True
    except Exception as e:
        logger.error(f"Error sending verification email: {str(e)}")
        return False


def is_token_expired(token_expires: datetime) -> bool:
    """
    Check if a verification token has expired.
    """
    if not token_expires:
        return True
    return datetime.now() > token_expires


def send_password_reset_email(email: str, reset_token: str) -> bool:
    """
    Send a password reset email to the user.
    Returns True if successful, False otherwise.
    """
    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_USERNAME
        msg["To"] = email
        msg["Subject"] = "Reset your password"

        reset_link = f"{FRONTEND_URL}/reset-password/{reset_token}"

        body = f"""
        Hello!

        You have requested to reset your password. Click the link below to set a new password:
        {reset_link}

        This link will expire in 1 hour.

        If you didn't request a password reset, you can safely ignore this email.

        Best regards,
        The GuessWhere Team
        """

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        return True
    except Exception as e:
        logger.error(f"Error sending password reset email: {str(e)}")
        return False
