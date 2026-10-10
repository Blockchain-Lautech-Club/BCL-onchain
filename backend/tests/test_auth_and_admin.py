from eth_account import Account
from eth_account.messages import encode_defunct

from app.models import Role, User


async def _login(client, acct):
    r = await client.post("/auth/nonce", json={"address": acct.address})
    assert r.status_code == 200
    msg = r.json()["message"]
    sig = acct.sign_message(encode_defunct(text=msg)).signature.hex()
    return await client.post("/auth/verify", json={"address": acct.address, "signature": sig}), msg


async def test_wallet_login_flow(client):
    acct = Account.create()
    r, _ = await _login(client, acct)
    assert r.status_code == 200
    me = await client.get("/auth/me")
    assert me.json()["wallet_address"] == acct.address.lower()
    assert me.json()["is_admin"] is False


async def test_signature_from_other_wallet_rejected(client):
    a, b = Account.create(), Account.create()
    r = await client.post("/auth/nonce", json={"address": a.address})
    sig = b.sign_message(encode_defunct(text=r.json()["message"])).signature.hex()
    r = await client.post("/auth/verify", json={"address": a.address, "signature": sig})
    assert r.status_code == 401


async def test_nonce_is_single_use(client):
    acct = Account.create()
    r, msg = await _login(client, acct)
    sig = acct.sign_message(encode_defunct(text=msg)).signature.hex()
    replay = await client.post("/auth/verify", json={"address": acct.address, "signature": sig})
    assert replay.status_code == 401


TASK = {"title": "Follow us", "description": "Do it", "points": 50, "verification_type": "manual"}


async def test_non_admin_cannot_create_task(client):
    await _login(client, Account.create())
    assert (await client.post("/admin/tasks", json=TASK)).status_code == 403


async def test_unauthenticated_cannot_create_task(client):
    assert (await client.post("/admin/tasks", json=TASK)).status_code == 401


async def test_admin_task_flow_and_manual_review(client, session_factory):
    admin, user = Account.create(), Account.create()
    await _login(client, admin)
    async with session_factory() as s:
        u = (await s.execute(User.__table__.select().where(User.wallet_address == admin.address.lower()))).first()
        s.add(Role(user_id=u.id, role="admin"))
        await s.commit()

    r = await client.post("/admin/tasks", json={**TASK, "publish": True})
    assert r.status_code == 201
    task_id = r.json()["id"]

    client.cookies.clear()
    await _login(client, user)
    assert (await client.get("/tasks")).json()[0]["my_state"] == "not_started"
    sub = (await client.post(f"/tasks/{task_id}/submit", json={"evidence": {"link": "x"}})).json()
    assert sub["status"] == "under_review"
    assert (await client.get(f"/tasks/{task_id}")).json()["my_state"] == "under_review"
    assert (await client.post(f"/admin/submissions/{sub['id']}/review", json={"approve": True})).status_code == 403

    client.cookies.clear()
    await _login(client, admin)
    rv = await client.post(f"/admin/submissions/{sub['id']}/review", json={"approve": True})
    assert rv.json()["status"] == "verified"

    client.cookies.clear()
    await _login(client, user)
    me = (await client.get("/me")).json()
    assert me["total_points"] == 50
    assert (await client.post(f"/tasks/{task_id}/submit", json={})).status_code == 409  # already completed
