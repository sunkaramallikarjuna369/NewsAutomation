from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.script import Script
from app.schemas.video import VoiceUploadResponse, VoiceGenerateRequest, VoiceGenerateResponse
from app.services.voice_service import VoiceService

router = APIRouter(prefix="/api/voice", tags=["Voice"])


@router.post("/upload-sample", response_model=VoiceUploadResponse)
async def upload_voice_sample(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()
    if len(content) < 1000:
        raise HTTPException(status_code=400, detail="Audio file too small")

    service = VoiceService()
    result = await service.save_voice_sample(content, file.filename, current_user.id)

    current_user.voice_profile_id = result["voice_profile_id"]
    current_user.voice_sample_path = result["file_path"]
    await db.commit()

    return VoiceUploadResponse(
        voice_profile_id=result["voice_profile_id"],
        quality_score=result["quality_score"],
        message="Voice sample uploaded successfully",
    )


@router.post("/generate", response_model=VoiceGenerateResponse)
async def generate_voice(
    data: VoiceGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Script).where(Script.id == data.script_id, Script.user_id == current_user.id)
    )
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if not script.script_json:
        raise HTTPException(status_code=400, detail="Script has no content")

    service = VoiceService()
    voice_result = await service.generate_from_script(
        script_json=script.script_json,
        user_id=current_user.id,
        voice_id=data.voice_profile_id,
        preset_voice=data.preset_voice or current_user.voice_preset,
    )

    return VoiceGenerateResponse(
        audio_file_path=voice_result["audio_file_path"],
        duration=voice_result["duration"],
    )


@router.get("/voices")
async def list_voices():
    service = VoiceService()
    return {"voices": service.get_preset_voices()}
