from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


class ScriptGenerateRequest(BaseModel):
    topic: str
    verified_facts: Optional[Any] = None
    verification_id: Optional[int] = None
    style: str = "neutral"
    duration: int = 90
    language: str = "en"


class RegenerateSegmentRequest(BaseModel):
    script_id: int
    segment_number: int
    instructions: str = ""


class ScriptUpdateRequest(BaseModel):
    script_json: Any


class ScriptResponse(BaseModel):
    id: int
    topic: str
    language: str
    style: str
    target_duration: int
    script_json: Optional[Any] = None
    metadata_json: Optional[Any] = None
    total_duration: float = 0.0
    segment_count: int = 0
    status: str = "draft"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
