from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.video import SettingsUpdate, SettingsResponse

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/", response_model=SettingsResponse)
async def get_settings(current_user: User = Depends(get_current_user)):
    return SettingsResponse(
        has_newsapi_key=bool(current_user.newsapi_key),
        has_groq_api_key=bool(current_user.groq_api_key),
        has_gnews_api_key=bool(current_user.gnews_api_key),
        has_pexels_api_key=bool(current_user.pexels_api_key),
        has_elevenlabs_api_key=bool(current_user.elevenlabs_api_key),
        has_did_api_key=bool(current_user.did_api_key),
        has_youtube_connected=bool(current_user.youtube_refresh_token),
        default_language=current_user.default_language or "en",
        default_style=current_user.default_style or "neutral",
        default_duration=current_user.default_duration or 90,
        dark_mode=current_user.dark_mode if current_user.dark_mode is not None else True,
    )


@router.post("/", response_model=SettingsResponse)
async def update_settings(
    data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.newsapi_key is not None:
        current_user.newsapi_key = data.newsapi_key
    if data.groq_api_key is not None:
        current_user.groq_api_key = data.groq_api_key
    if data.gnews_api_key is not None:
        current_user.gnews_api_key = data.gnews_api_key
    if data.pexels_api_key is not None:
        current_user.pexels_api_key = data.pexels_api_key
    if data.elevenlabs_api_key is not None:
        current_user.elevenlabs_api_key = data.elevenlabs_api_key
    if data.did_api_key is not None:
        current_user.did_api_key = data.did_api_key
    if data.default_language is not None:
        current_user.default_language = data.default_language
    if data.default_style is not None:
        current_user.default_style = data.default_style
    if data.default_duration is not None:
        current_user.default_duration = data.default_duration
    if data.dark_mode is not None:
        current_user.dark_mode = data.dark_mode

    await db.commit()
    await db.refresh(current_user)

    return SettingsResponse(
        has_newsapi_key=bool(current_user.newsapi_key),
        has_groq_api_key=bool(current_user.groq_api_key),
        has_gnews_api_key=bool(current_user.gnews_api_key),
        has_pexels_api_key=bool(current_user.pexels_api_key),
        has_elevenlabs_api_key=bool(current_user.elevenlabs_api_key),
        has_did_api_key=bool(current_user.did_api_key),
        has_youtube_connected=bool(current_user.youtube_refresh_token),
        default_language=current_user.default_language or "en",
        default_style=current_user.default_style or "neutral",
        default_duration=current_user.default_duration or 90,
        dark_mode=current_user.dark_mode if current_user.dark_mode is not None else True,
    )
