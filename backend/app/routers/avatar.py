from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.video import AvatarUploadResponse, AvatarGenerateRequest, AvatarGenerateResponse
from app.services.avatar_service import AvatarService

router = APIRouter(prefix="/api/avatar", tags=["Avatar"])


@router.post("/upload-photo", response_model=AvatarUploadResponse)
async def upload_avatar_photo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()
    if len(content) < 1000:
        raise HTTPException(status_code=400, detail="Image file too small")

    service = AvatarService()
    result = await service.save_avatar_photo(content, file.filename, current_user.id)

    current_user.avatar_image_path = result["file_path"]
    current_user.avatar_quality_score = result["quality_score"]
    await db.commit()

    return AvatarUploadResponse(
        avatar_id=result["avatar_id"],
        quality_score=result["quality_score"],
        message="Avatar photo uploaded successfully",
    )


@router.post("/generate", response_model=AvatarGenerateResponse)
async def generate_avatar(
    data: AvatarGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    avatar_path = current_user.avatar_image_path
    if not avatar_path:
        raise HTTPException(status_code=400, detail="No avatar photo uploaded. Please upload a photo first.")

    service = AvatarService()
    result = await service.generate_avatar_video(
        audio_path=data.audio_file_path,
        avatar_image_path=avatar_path,
        user_id=current_user.id,
    )

    if not result.get("avatar_video_path"):
        raise HTTPException(status_code=500, detail=result.get("error", "Avatar generation failed"))

    return AvatarGenerateResponse(avatar_video_path=result["avatar_video_path"])
