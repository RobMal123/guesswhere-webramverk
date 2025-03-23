from datetime import datetime, timedelta
from typing import Optional
import re
from passlib.context import CryptContext
from jose import jwt
import os
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY")
REFRESH_SECRET_KEY = os.getenv(
    "REFRESH_SECRET_KEY", SECRET_KEY
)  # Use different key for refresh tokens
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, secret_key: str = SECRET_KEY) -> Optional[dict]:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        return payload
    except jwt.JWTError:
        return None


def validate_password(password: str) -> bool:
    """
    Validate password complexity requirements:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one number
    - Contains at least one special character
    """
    if len(password) < 8:
        return False

    if not re.search(r"[A-Z]", password):
        return False

    if not re.search(r"[a-z]", password):
        return False

    if not re.search(r"\d", password):
        return False

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False

    return True


def validate_username(username: str) -> bool:
    """
    Validate username requirements:
    - 3-20 characters long
    - Contains only letters, numbers, and underscores
    - Starts with a letter
    """
    if not (3 <= len(username) <= 20):
        return False

    if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]*$", username):
        return False

    return True


def validate_email(email: str) -> bool:
    """
    Validate email format
    """
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def check_rate_limit(login_attempts: int, last_attempt: datetime) -> bool:
    """
    Check if user has exceeded rate limit
    - Reset attempts after 15 minutes
    - Max 5 attempts per 15 minutes
    """
    if login_attempts >= 5:
        if (datetime.utcnow() - last_attempt).total_seconds() < 900:  # 15 minutes
            return False
    return True
