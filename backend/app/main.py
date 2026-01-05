from contextlib import asynccontextmanager
import uvicorn
import logging

from fastapi import FastAPI, APIRouter, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.utils.redis import close_redis, init_redis
from app.users.router import user_router, auth_router
from app.log_config import set_logging
from app.config import settings

set_logging()
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    log.info("Redis connected")
    yield
    await close_redis()
    log.info("Redis disconnected")


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(user_router)
api_router.include_router(auth_router)
app = FastAPI(
    title=settings.COMPANY_NAME,
    description="## Backend messenger aether",
    lifespan=lifespan
)
app.include_router(api_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    response: Response = await call_next(request)
    log.info(
        "method=%s path=%s status=%s",
        request.method,
        request.url.path,
        response.status_code,
        extra={
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code
        }
    )
    return response


@app.get("/health")
async def test_health():
    return {"status": True}


if __name__ == "__main__":
    if settings.MODE == "PROD":
        UVICORN_PARAMS = dict(
            host=settings.HOST,
            port=settings.PORT,
            reload=False,
            workers=settings.WORKERS,
            access_log=False
        )
    else:
        UVICORN_PARAMS = dict(
            host=settings.HOST,
            port=settings.PORT,
            reload=True,
            access_log=False
        )
    log.info("app is starting")
    uvicorn.run("app.main:app", **UVICORN_PARAMS)