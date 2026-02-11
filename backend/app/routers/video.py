import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import os

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.script import Script
from app.models.video import Video, VideoJob
from app.schemas.video import VideoGenerateRequest, VideoStatusResponse, VideoResponse
from app.services.video_service import VideoService
from app.services.voice_service import VoiceService

router = APIRouter(prefix="/api/video", tags=["Video"])

_active_jobs: dict = {}


@router.post("/generate", response_model=VideoStatusResponse)
async def generate_video(
    data: VideoGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Script).where(Script.id == data.script_id, Script.user_id == current_user.id)
    )
    script = result.scalar_one_or_none()
    if not script or not script.script_json:
        raise HTTPException(status_code=404, detail="Script not found or empty")

    script_json = script.script_json
    title = "News Video"
    if isinstance(script_json, dict):
        vt = script_json.get("video_title", {})
        if isinstance(vt, dict):
            title = vt.get("primary", "News Video")

    video = Video(
        user_id=current_user.id,
        script_id=script.id,
        title=title,
        topic=script.topic,
        status="processing",
        progress=0,
        progress_message="Starting video generation...",
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)

    job = VideoJob(
        video_id=video.id,
        user_id=current_user.id,
        job_type="full_video",
        status="processing",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    asyncio.create_task(
        _run_video_generation(
            video_id=video.id,
            job_id=job.id,
            script_json=script_json,
            user_id=current_user.id,
            audio_path=data.audio_file_path,
            avatar_video_path=data.avatar_video_path,
            use_avatar=data.use_avatar,
            preset_voice=current_user.voice_preset,
        )
    )

    return VideoStatusResponse(
        job_id=job.id,
        video_id=video.id,
        status="processing",
        progress=0,
        progress_message="Video generation started...",
    )


async def _run_video_generation(
    video_id: int,
    job_id: int,
    script_json: dict,
    user_id: int,
    audio_path: str | None,
    avatar_video_path: str | None,
    use_avatar: bool,
    preset_voice: str | None,
):
    from app.core.database import async_session

    async with async_session() as db:
        try:
            result = await db.execute(select(Video).where(Video.id == video_id))
            video = result.scalar_one_or_none()
            result2 = await db.execute(select(VideoJob).where(VideoJob.id == job_id))
            job = result2.scalar_one_or_none()
            if not video or not job:
                return

            if not audio_path:
                video.progress = 5
                video.progress_message = "Generating voiceover..."
                await db.commit()

                voice_service = VoiceService()
                voice_result = await voice_service.generate_from_script(
                    script_json=script_json,
                    user_id=user_id,
                    preset_voice=preset_voice or "en-US-GuyNeural",
                )
                audio_path = voice_result["audio_file_path"]

            async def update_progress(progress: int, message: str):
                video.progress = progress
                video.progress_message = message
                job.progress = progress
                await db.commit()

            video_service = VideoService()
            result = await video_service.generate_video(
                script_json=script_json,
                audio_path=audio_path,
                user_id=user_id,
                avatar_video_path=avatar_video_path,
                use_avatar=use_avatar,
                progress_callback=update_progress,
            )

            video.video_path = result["video_path"]
            video.thumbnail_path = result["thumbnail_path"]
            video.duration = result["duration"]
            video.status = "completed"
            video.progress = 100
            video.progress_message = "Video complete!"
            job.status = "completed"
            job.progress = 100
            job.result_path = result["video_path"]
            await db.commit()

        except Exception as e:
            video.status = "failed"
            video.error_message = str(e)
            video.progress_message = f"Failed: {str(e)}"
            job.status = "failed"
            job.error_message = str(e)
            await db.commit()


@router.get("/status/{job_id}", response_model=VideoStatusResponse)
async def get_video_status(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoJob).where(VideoJob.id == job_id, VideoJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    result2 = await db.execute(select(Video).where(Video.id == job.video_id))
    video = result2.scalar_one_or_none()

    return VideoStatusResponse(
        job_id=job.id,
        video_id=job.video_id,
        status=job.status,
        progress=job.progress,
        progress_message=video.progress_message if video else None,
        video_path=video.video_path if video else None,
        error_message=job.error_message,
    )


@router.get("/list", response_model=list[VideoResponse])
async def list_videos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Video)
        .where(Video.user_id == current_user.id)
        .order_by(desc(Video.created_at))
        .limit(50)
    )
    videos = result.scalars().all()
    return [
        VideoResponse(
            id=v.id,
            title=v.title,
            description=v.description,
            topic=v.topic,
            video_path=v.video_path,
            thumbnail_path=v.thumbnail_path,
            duration=v.duration or 0.0,
            status=v.status,
            progress=v.progress or 0,
            youtube_video_id=v.youtube_video_id,
            youtube_url=v.youtube_url,
            youtube_status=v.youtube_status,
            tags=v.tags,
            created_at=v.created_at,
        )
        for v in videos
    ]


@router.get("/download/{video_id}")
async def download_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Video).where(Video.id == video_id, Video.user_id == current_user.id)
    )
    video = result.scalar_one_or_none()
    if not video or not video.video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    if not os.path.exists(video.video_path):
        raise HTTPException(status_code=404, detail="Video file not found on disk")

    return FileResponse(
        video.video_path,
        media_type="video/mp4",
        filename=f"{video.title}.mp4",
    )
