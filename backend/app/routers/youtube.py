from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.video import Video
from app.schemas.video import YouTubeUploadRequest, YouTubeUploadResponse
from app.services.youtube_service import YouTubeService

router = APIRouter(prefix="/api/youtube", tags=["YouTube"])


@router.get("/auth-url")
async def get_youtube_auth_url(current_user: User = Depends(get_current_user)):
    service = YouTubeService()
    try:
        url = service.get_auth_url()
        return {"auth_url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/callback")
async def youtube_oauth_callback(
    code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    service = YouTubeService()
    try:
        tokens = service.exchange_code(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth exchange failed: {str(e)}")

    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="No refresh token received")

    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/settings?youtube_token={refresh_token}"
    )


@router.post("/connect")
async def connect_youtube(
    refresh_token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.youtube_refresh_token = refresh_token
    try:
        service = YouTubeService()
        channel_info = await service.get_channel_info(refresh_token)
        current_user.youtube_channel_id = channel_info.get("channel_id")
        await db.commit()
        return {"status": "connected", "channel": channel_info}
    except Exception as e:
        await db.commit()
        return {"status": "connected", "channel": None, "warning": str(e)}


@router.post("/upload", response_model=YouTubeUploadResponse)
async def upload_to_youtube(
    data: YouTubeUploadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.youtube_refresh_token:
        raise HTTPException(status_code=400, detail="YouTube not connected. Please connect your account first.")

    result = await db.execute(
        select(Video).where(Video.id == data.video_id, Video.user_id == current_user.id)
    )
    video = result.scalar_one_or_none()
    if not video or not video.video_path:
        raise HTTPException(status_code=404, detail="Video not found or not ready")

    service = YouTubeService()
    try:
        yt_result = await service.upload_video(
            refresh_token=current_user.youtube_refresh_token,
            video_path=video.video_path,
            title=data.title,
            description=data.description,
            tags=data.tags,
            privacy=data.privacy,
            schedule_time=data.schedule_time,
        )

        video.youtube_video_id = yt_result["youtube_video_id"]
        video.youtube_url = yt_result["url"]
        video.youtube_status = "published"
        await db.commit()

        return YouTubeUploadResponse(
            youtube_video_id=yt_result["youtube_video_id"],
            url=yt_result["url"],
            status="published",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube upload failed: {str(e)}")


@router.get("/status")
async def youtube_connection_status(
    current_user: User = Depends(get_current_user),
):
    connected = bool(current_user.youtube_refresh_token)
    return {
        "connected": connected,
        "channel_id": current_user.youtube_channel_id if connected else None,
    }
