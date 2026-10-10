# BCL Onchain — Backend & Smart Contracts

```
bcl-onchain/
├─ docker-compose.yml          postgres + api + mint-worker + indexer
├─ contracts/                  Foundry project (Solidity 0.8.24, OpenZeppelin v5)
│  ├─ src/BCLLevelNFT.sol      ERC-721 level NFT: MINTER_ROLE, one per (wallet, level), soulbound flag, pausable
│  ├─ src/BCLRegistry.sol      .bcl registry: register/renew/transfer/release/resolver, grace period, reserved names
│  ├─ test/                    unit + fuzz tests, access-control and duplicate-mint tests
│  └─ script/Deploy.s.sol
└─ backend/                    FastAPI (Python 3.12, SQLAlchemy 2 async, PostgreSQL, web3.py 7)
   ├─ app/
   │  ├─ main.py               app, CORS, error handler
   │  ├─ core/                 config, db, security (JWT), errors
   │  ├─ models/               users/roles, tasks/submissions, points ledger, levels, nft mints, domains, chain events, audit
   │  ├─ schemas/              pydantic request/response models
   │  ├─ api/deps.py           auth + admin dependencies (admin role checked in DB on every request)
   │  ├─ api/routes/           auth, tasks, me, public (leaderboard/domains), admin
   │  ├─ services/             auth, tasks, submissions, points, levels, domains, audit, notifications
   │  │  └─ verification/      adapters: onchain_tx, nft_ownership, social (manual fallback), manual
   │  ├─ chain/                web3 client, ABIs, relayer, event indexer + reconciler
   │  └─ workers/              mint_worker.py, indexer_worker.py
   ├─ scripts/                 init_db.py (tables + placeholder levels), grant_admin.py
   └─ tests/                   pytest (SQLite): auth, admin authz, points idempotency, one-mint-per-level
```

## Run it

```bash
# contracts
cd contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 foundry-rs/forge-std --no-commit
forge build && forge test -vv
cp .env.example .env   # fill in, then:
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify --account <keystore>

# backend
cd ../backend
cp .env.example .env   # set contract addresses from the deploy output + RELAYER_PRIVATE_KEY
pip install -r requirements-dev.txt && pytest
docker compose up -d db && python -m scripts.init_db && python -m scripts.grant_admin 0xYourWallet
uvicorn app.main:app --reload                 # API  → http://localhost:8000/docs
python -m app.workers.indexer_worker          # indexer + reconciler
python -m app.workers.mint_worker             # relayer (run exactly ONE)
```

## Defaults I chose for the open decisions in the spec (all easy to flip)

| Decision | Default | Where |
|---|---|---|
| NFT transferable? | **Soulbound** | `NFT_TRANSFERABLE=false` (constructor arg, immutable) |
| Who pays mint gas? | **Project relayer** | `mint_worker.py` + `MINTER_ROLE` on relayer |
| Levels | placeholder 10 thresholds; one NFT per level crossed | `scripts/init_db.py`, `PUT /admin/levels` |
| Domains | renewable, 1–10 yrs, 30-day grace, transfers on, price in native coin (default 0) | `BCLRegistry` |
| Social verification | manual admin review until an official API is confirmed | `verification/manual.py` |
| Admin handover | two-step with delay (`AccessControlDefaultAdminRules`) | both contracts |

## Key flows

- **Login**: `POST /auth/nonce` → wallet signs returned `message` → `POST /auth/verify` → httpOnly session cookie. The server rebuilds the message from its stored nonce, so the signed text can't be altered; nonces are single-use.
- **Task**: `POST /tasks/{id}/submit` → verifier adapter → `finalize_verified` (user row lock + unique `idempotency_key`) → ledger row → level sync → one `nft_mints` row per level crossed (unique `(wallet, level)`).
- **Mint**: worker claims `queued` jobs (`FOR UPDATE SKIP LOCKED`), asks the chain if the NFT already exists, otherwise broadcasts `mintLevel` → `pending` → `confirmed` (worker and indexer both converge on token id). Reverts/RPC errors retry with backoff, then `failed` (admin retry endpoint).
- **Domains**: the user's wallet sends the `register` tx (`GET /domains/quote` gives contract/args/value). The indexer projects registry events into `domain_records`; `reconcile()` corrects drift against live chain state.

## Not done / next steps
- **Not compiled or run here.** The authoring environment had no Foundry, no network, and none of the Python dependencies installed, so I could only syntax-check the Python. Run `forge build && forge test` and `pytest` first and expect to fix small things.
- Alembic migrations (use `init_db.py` for dev only), rate limiting on `/auth/*` and `/tasks/*/submit`, real social-API adapters, metadata JSON/IPFS for the NFT levels, and an independent contract audit before mainnet.
- Hand-written ABIs in `chain/abis.py` must be kept in sync with the contracts (`forge inspect BCLLevelNFT abi`).
# BCL-onchain
