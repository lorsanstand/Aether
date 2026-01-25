import time
from contextlib import asynccontextmanager
import uvicorn
import logging
import uuid
import asyncio

from fastapi import FastAPI, APIRouter, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.core.redis import close_redis, init_redis
from app.users.router import router as user_router
from app.auth.router import router as auth_router
from app.chats.router import router as chat_router
from app.core.log_config import set_logging
from app.core.config import settings
from app.services.messenger_service import PubSubMessenger

set_logging()
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    log.info("Redis connected")
    task_send_message = asyncio.create_task(PubSubMessenger.subscribe_to_channels())
    log.info("Message sender started")
    yield
    await close_redis()
    log.info("Redis disconnected")
    task_send_message.cancel()
    log.info("Message sender stopped")


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(user_router)
api_router.include_router(auth_router)
api_router.include_router(chat_router)

@api_router.get("/health")
async def test_health():
    return {"status": True}

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
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.perf_counter()

    log.info(
        "Started method=%s path=%s",
        request.method, request.url.path,
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "type": "start"
        }
    )
    try:
        response: Response = await call_next(request)
        process_time = time.perf_counter() - start_time

        log.info(
            "Finished method=%s path=%s status=%s duration=%.3fs",
            request.method, request.url.path, response.status_code, process_time,
            extra={
                "request_id": request_id,
                "status": response.status_code,
                "duration": process_time,
                "type": "end"
            }
        )
        return response

    except Exception as e:
        log.error("Request failed id=%s error=%s", request_id, str(e))
        raise


if __name__ == "__main__":
    if settings.MODE == "PROD":
        UVICORN_PARAMS = dict(
            host=settings.BACKEND_HOST,
            port=settings.BACKEND_PORT,
            reload=False,
            workers=settings.WORKERS,
            access_log=False
        )
    else:
        UVICORN_PARAMS = dict(
            host=settings.BACKEND_HOST,
            port=settings.BACKEND_PORT,
            reload=True,
            access_log=False
        )
    log.info("app is starting")
    uvicorn.run("app.main:app", **UVICORN_PARAMS)