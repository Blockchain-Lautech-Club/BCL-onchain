"""Grant the admin role to a wallet (creates the user row if needed).   python -m scripts.grant_admin 0x..."""
import asyncio
import sys

from sqlalchemy import select

from app.core.db import SessionLocal
from app.models import Role, User
from app.models.enums import RoleName
from app.services.auth_service import normalize_address


async def main(wallet: str) -> None:
    wallet = normalize_address(wallet)
    async with SessionLocal() as s:
        user = await s.scalar(select(User).where(User.wallet_address == wallet))
        if user is None:
            user = User(wallet_address=wallet)
            s.add(user)
            await s.flush()
        if not await s.scalar(select(Role.id).where(Role.user_id == user.id, Role.role == RoleName.ADMIN)):
            s.add(Role(user_id=user.id, role=RoleName.ADMIN))
        await s.commit()
    print(f"{wallet} is admin")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
