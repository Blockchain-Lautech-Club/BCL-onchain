from __future__ import annotations

from pydantic import BaseModel


class NonceRequest(BaseModel):
    address: str


class NonceResponse(BaseModel):
    nonce: str
    message: str  # sign this exact string with personal_sign


class VerifyRequest(BaseModel):
    address: str
    signature: str
