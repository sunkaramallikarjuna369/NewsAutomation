from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


class VoiceUploadResponse(BaseModel):
    voice_profile_id: str
    quality_score: int
    message: str


class VoiceGenerateRequest(BaseModel):
    script_id: int
    voice_profile_id: Optional[str] = None
    preset_voice: Optional[str] = None


class VoiceGenerateResponse(BaseModel):
    audio_file_path: str
    duration: float


class AvatarUploadResponse(BaseModel):
    avatar_id: str
    quality_score: int
    message: str


class AvatarGenerateRequest(BaseModel):
    audio_file_path: str
    avatar_id: Optional[str] = None


class AvatarGenerateResponse(BaseModel):
    avatar_video_path: str


class VideoGenerateRequest(BaseModel):
    script_id: int
    audio_file_path: Optional[str] = None
    avatar_video_path: Optional[str] = None
    use_avatar: bool = False


class VideoStatusResponse(BaseModel):
    job_id: int
    video_id: int
    status: str
    progress: int
    progress_message: Optional[str] = None
    video_path: Optional[str] = None
    error_message: Optional[str] = None


class VideoResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    topic: Optional[str] = None
    video_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    duration: float = 0.0
    status: str = "pending"
    progress: int = 0
    youtube_video_id: Optional[str] = None
    youtube_url: Optional[str] = None
    youtube_status: Optional[str] = None
    tags: Optional[Any] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class YouTubeUploadRequest(BaseModel):
    video_id: int
    title: str
    description: str
    tags: List[str] = []
    privacy: str = "private"
    schedule_time: Optional[str] = None


class YouTubeUploadResponse(BaseModel):
    youtube_video_id: str
    url: str
    status: str


class SettingsUpdate(BaseModel):
    newsapi_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    gnews_api_key: Optional[str] = None
    pexels_api_key: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
    did_api_key: Optional[str] = None
    default_language: Optional[str] = None
    default_style: Optional[str] = None
    default_duration: Optional[int] = None
    dark_mode: Optional[bool] = None


class SettingsResponse(BaseModel):
    has_newsapi_key: bool = False
    has_groq_api_key: bool = False
    has_gnews_api_key: bool = False
    has_pexels_api_key: bool = False
    has_elevenlabs_api_key: bool = False
    has_did_api_key: bool = False
    has_youtube_connected: bool = False
    default_language: str = "en"
    default_style: str = "neutral"
    default_duration: int = 90
    dark_mode: bool = True
