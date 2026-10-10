from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.api.routes import admin, auth, me, public, tasks
from app.api.routes import milestones, names, rewards
from app.core.config import settings
from app.core.db import engine, SessionLocal
from app.core.errors import AppError
from app.models import Base, LevelConfig

DEFAULT_THRESHOLDS = [100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000]

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with SessionLocal() as s:
            if not (await s.execute(select(LevelConfig).limit(1))).first():
                s.add_all(LevelConfig(level=i + 1, threshold=t) for i, t in enumerate(DEFAULT_THRESHOLDS))
                await s.commit()
    except Exception as e:
        print(f"Database initialization note: {e}")
    yield

app = FastAPI(title="BCL Onchain API", version="0.1.0", lifespan=lifespan)

# Allow configured origins and Vercel frontend
origins = list(set(settings.cors_origin_list + [
    "https://bcl-onchain.vercel.app",
    "http://localhost:3000",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "name": "BCL Onchain API",
        "status": "online",
        "docs": "/docs",
        "network": "Botchain Testnet (Chain ID: 968)"
    }

@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": exc.code, "message": exc.message}})

for r in (public.router, auth.router, tasks.router, me.router, admin.router,
          rewards.router, milestones.router, names.router):
    app.include_router(r)
