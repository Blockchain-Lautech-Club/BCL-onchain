from sqlalchemy import func, select

from app.models import NFTMint, PointsLedger, Task, TaskSubmission, User
from app.models.enums import SubmissionStatus
from app.services.points_service import adjust_points, finalize_verified


async def _setup(session, points=150, repeatable=False):
    user = User(wallet_address="0x" + "1" * 40)
    admin = User(wallet_address="0x" + "2" * 40)
    session.add_all([user, admin])
    await session.flush()
    task = Task(title="T", description="d", points=points, verification_type="manual", created_by=admin.id,
                repeatable=repeatable, status="published")
    session.add(task)
    await session.flush()
    return user, admin, task


async def _sub(session, user, task):
    sub = TaskSubmission(task_id=task.id, user_id=user.id, wallet=user.wallet_address, evidence={})
    session.add(sub)
    await session.flush()
    return sub


async def test_points_awarded_exactly_once(session):
    user, _, task = await _setup(session)
    s1, s2 = await _sub(session, user, task), await _sub(session, user, task)

    assert await finalize_verified(session, s1, task) is True
    assert await finalize_verified(session, s2, task) is False  # same task+user -> idempotent
    await session.commit()

    assert s2.status == SubmissionStatus.REJECTED
    assert await session.scalar(select(func.count()).select_from(PointsLedger)) == 1
    await session.refresh(user)
    assert user.total_points == 150 and user.level == 1


async def test_repeatable_task_awards_each_submission(session):
    user, _, task = await _setup(session, points=10, repeatable=True)
    for _ in range(3):
        assert await finalize_verified(session, await _sub(session, user, task), task) is True
    await session.commit()
    await session.refresh(user)
    assert user.total_points == 30


async def test_one_mint_per_level_crossed(session):
    user, admin, task = await _setup(session, points=300)
    await finalize_verified(session, await _sub(session, user, task), task)  # 300 -> crosses L1 and L2
    await session.commit()

    levels = (await session.execute(select(NFTMint.level).order_by(NFTMint.level))).scalars().all()
    assert levels == [1, 2]

    await adjust_points(session, admin, user.id, 250, "bonus")  # 550 -> L3 only; no duplicate L1/L2
    await session.commit()
    levels = (await session.execute(select(NFTMint.level).order_by(NFTMint.level))).scalars().all()
    assert levels == [1, 2, 3]


async def test_point_deduction_never_remints(session):
    user, admin, task = await _setup(session, points=120)
    await finalize_verified(session, await _sub(session, user, task), task)
    await adjust_points(session, admin, user.id, -100, "correction")  # level 1 -> 0
    await adjust_points(session, admin, user.id, 100, "restore")  # back to level 1
    await session.commit()
    assert await session.scalar(select(func.count()).select_from(NFTMint)) == 1
