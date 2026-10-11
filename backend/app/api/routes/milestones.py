from __future__ import annotations

"""Admin milestone management + public milestone listing.

GET  /milestones                  — list all milestones (public)
GET  /milestones/{token_id}       — get one milestone (public)
POST /milestones                  — admin: create a new milestone
PATCH /milestones/{token_id}      — admin: update name/description/metadata_uri
POST /milestones/{token_id}/award — admin: award a specific milestone to a wallet
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session, require_admin
from app.models.enums import MilestoneType
from app.models.milestone import Milestone, token_id_for
from app.models.user import User
from app.services.milestone_service import (
    award_community_milestone,
    award_streak_milestone,
    award_task_milestone,
    create_milestone,
    get_milestone_by_token_id,
    list_milestones,
    queue_milestone_mint,
)

router = APIRouter(prefix="/milestones", tags=["milestones"])


# ─────────────────────────── schemas ─────────────────────────────────────────

class MilestoneOut(BaseModel):
    id: int
    milestone_type: str
    type_ref_id: int
    token_id: int
    name: str
    description: str
    metadata_uri: str
    points_threshold: int | None
    registered_on_chain: bool

    model_config = {"from_attributes": True}


class MilestoneCreate(BaseModel):
    milestone_type: MilestoneType
    type_ref_id: int
    name: str
    description: str = ""
    metadata_uri: str = ""
    points_threshold: int | None = None

    @field_validator("type_ref_id")
    @classmethod
    def ref_id_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("type_ref_id must be >= 1")
        return v


class MilestoneUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    metadata_uri: str | None = None


class AwardIn(BaseModel):
    wallet: str


# ─────────────────────────── endpoints ───────────────────────────────────────

@router.get("", response_model=list[MilestoneOut])
async def list_all(
    milestone_type: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    mt = MilestoneType(milestone_type) if milestone_type else None
    return await list_milestones(session, mt)


@router.get("/{token_id}", response_model=MilestoneOut)
async def get_one(token_id: int, session: AsyncSession = Depends(get_session)):
    m = await get_milestone_by_token_id(session, token_id)
    if not m:
        raise HTTPException(404, "Milestone not found")
    return m


@router.post("", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
async def create(
    body: MilestoneCreate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    try:
        m = await create_milestone(
            session,
            milestone_type=body.milestone_type,
            type_ref_id=body.type_ref_id,
            name=body.name,
            description=body.description,
            metadata_uri=body.metadata_uri,
            points_threshold=body.points_threshold,
        )
        await session.commit()
        await session.refresh(m)
        return m
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, "A milestone with that token_id already exists")


@router.patch("/{token_id}", response_model=MilestoneOut)
async def update(
    token_id: int,
    body: MilestoneUpdate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    m = await get_milestone_by_token_id(session, token_id)
    if not m:
        raise HTTPException(404, "Milestone not found")
    if body.name is not None:
        m.name = body.name
    if body.description is not None:
        m.description = body.description
    if body.metadata_uri is not None:
        m.metadata_uri = body.metadata_uri
    await session.commit()
    await session.refresh(m)
    return m


@router.post("/{token_id}/award", status_code=status.HTTP_202_ACCEPTED)
async def award(
    token_id: int,
    body: AwardIn,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """Admin manually awards any milestone to a wallet."""
    m = await get_milestone_by_token_id(session, token_id)
    if not m:
        raise HTTPException(404, "Milestone not found")

    user = await session.scalar(
        select(User).where(User.wallet_address == body.wallet.lower())
    )
    if not user:
        raise HTTPException(404, "Wallet not registered")

    mint = await queue_milestone_mint(session, user, m)
    await session.commit()
    if mint is None:
        raise HTTPException(409, "Mint job already exists for this wallet and milestone")
    return {"queued": True, "mint_id": mint.id, "token_id": token_id, "milestone": m.name}
