from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import admin, auth, me, public, tasks
from app.api.routes import milestones, names, rewards
from app.core.config import settings
from app.core.errors import AppError

app = FastAPI(title="BCL Onchain API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,  # session cookie
    allow_methods=["GET", "POST", "PATCH", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": exc.code, "message": exc.message}})


for r in (public.router, auth.router, tasks.router, me.router, admin.router,
          rewards.router, milestones.router, names.router):
    app.include_router(r)
