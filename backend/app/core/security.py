import uuid
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings


def create_session_token(user_id: int, wallet: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "wallet": wallet,
        "iat": now,
        "exp": now + timedelta(seconds=settings.jwt_ttl_seconds),
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_session_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"], options={"require": ["exp", "sub"]})
