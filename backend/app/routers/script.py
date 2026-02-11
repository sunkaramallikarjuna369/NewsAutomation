from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.news import FactVerification
from app.models.script import Script
from app.schemas.script import (
    ScriptGenerateRequest,
    RegenerateSegmentRequest,
    ScriptUpdateRequest,
    ScriptResponse,
)
from app.services.script_service import ScriptService

router = APIRouter(prefix="/api/script", tags=["Script"])


@router.post("/generate", response_model=ScriptResponse)
async def generate_script(
    data: ScriptGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verified_facts = data.verified_facts
    if data.verification_id:
        result = await db.execute(
            select(FactVerification).where(
                FactVerification.id == data.verification_id,
                FactVerification.user_id == current_user.id,
            )
        )
        verification = result.scalar_one_or_none()
        if verification:
            verified_facts = verification.verified_facts

    service = ScriptService(groq_api_key=current_user.groq_api_key)
    script_json = await service.generate(
        topic=data.topic,
        verified_facts=verified_facts,
        style=data.style,
        duration=data.duration,
        language=data.language,
    )

    segments = script_json.get("voiceover_script", [])
    total_duration = sum(s.get("duration_seconds", 0) for s in segments)

    script = Script(
        user_id=current_user.id,
        verification_id=data.verification_id,
        topic=data.topic,
        language=data.language,
        style=data.style,
        target_duration=data.duration,
        script_json=script_json,
        metadata_json=script_json.get("metadata"),
        total_duration=total_duration,
        segment_count=len(segments),
        status="generated",
    )
    db.add(script)
    await db.commit()
    await db.refresh(script)

    return ScriptResponse(
        id=script.id,
        topic=script.topic,
        language=script.language,
        style=script.style,
        target_duration=script.target_duration,
        script_json=script.script_json,
        metadata_json=script.metadata_json,
        total_duration=script.total_duration,
        segment_count=script.segment_count,
        status=script.status,
        created_at=script.created_at,
    )


@router.post("/regenerate-segment", response_model=ScriptResponse)
async def regenerate_segment(
    data: RegenerateSegmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Script).where(Script.id == data.script_id, Script.user_id == current_user.id)
    )
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    service = ScriptService(groq_api_key=current_user.groq_api_key)
    updated_json = await service.regenerate_segment(
        script.script_json, data.segment_number, data.instructions
    )

    script.script_json = updated_json
    segments = updated_json.get("voiceover_script", [])
    script.total_duration = sum(s.get("duration_seconds", 0) for s in segments)
    script.segment_count = len(segments)
    await db.commit()
    await db.refresh(script)

    return ScriptResponse(
        id=script.id,
        topic=script.topic,
        language=script.language,
        style=script.style,
        target_duration=script.target_duration,
        script_json=script.script_json,
        metadata_json=script.metadata_json,
        total_duration=script.total_duration,
        segment_count=script.segment_count,
        status=script.status,
        created_at=script.created_at,
    )


@router.put("/update/{script_id}", response_model=ScriptResponse)
async def update_script(
    script_id: int,
    data: ScriptUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Script).where(Script.id == script_id, Script.user_id == current_user.id)
    )
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    script.script_json = data.script_json
    segments = data.script_json.get("voiceover_script", []) if isinstance(data.script_json, dict) else []
    script.total_duration = sum(s.get("duration_seconds", 0) for s in segments)
    script.segment_count = len(segments)
    script.status = "edited"
    await db.commit()
    await db.refresh(script)

    return ScriptResponse(
        id=script.id,
        topic=script.topic,
        language=script.language,
        style=script.style,
        target_duration=script.target_duration,
        script_json=script.script_json,
        metadata_json=script.metadata_json,
        total_duration=script.total_duration,
        segment_count=script.segment_count,
        status=script.status,
        created_at=script.created_at,
    )


@router.get("/{script_id}", response_model=ScriptResponse)
async def get_script(
    script_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Script).where(Script.id == script_id, Script.user_id == current_user.id)
    )
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    return ScriptResponse(
        id=script.id,
        topic=script.topic,
        language=script.language,
        style=script.style,
        target_duration=script.target_duration,
        script_json=script.script_json,
        metadata_json=script.metadata_json,
        total_duration=script.total_duration,
        segment_count=script.segment_count,
        status=script.status,
        created_at=script.created_at,
    )
