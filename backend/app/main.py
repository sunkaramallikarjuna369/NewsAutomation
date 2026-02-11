from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging

from app.core.database import init_db
from app.core.config import settings
from app.routers import auth, news, script, voice, avatar, video, youtube
from app.routers import settings as settings_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting NewsAI Studio Backend...")
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    for subdir in ["voice_samples", "avatars", "videos", "thumbnails"]:
        os.makedirs(os.path.join(settings.UPLOAD_DIR, subdir), exist_ok=True)
    logger.info("Database initialized, upload directories created.")
    yield
    logger.info("Shutting down NewsAI Studio Backend...")


app = FastAPI(
    title="NewsAI Studio API",
    description="Automated News Video Generation Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(auth.router)
app.include_router(news.router)
app.include_router(script.router)
app.include_router(voice.router)
app.include_router(avatar.router)
app.include_router(video.router)
app.include_router(youtube.router)
app.include_router(settings_router.router)

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/healthz")
async def healthz():
    return {"status": "ok", "service": "NewsAI Studio"}


@app.get("/")
async def root():
    return {
        "name": "NewsAI Studio API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "news": "/api/news",
            "script": "/api/script",
            "voice": "/api/voice",
            "avatar": "/api/avatar",
            "video": "/api/video",
            "youtube": "/api/youtube",
            "settings": "/api/settings",
        },
    }
