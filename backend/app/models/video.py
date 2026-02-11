from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    script_id = Column(Integer, ForeignKey("scripts.id"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    topic = Column(String(500), nullable=True)

    audio_path = Column(Text, nullable=True)
    avatar_video_path = Column(Text, nullable=True)
    video_path = Column(Text, nullable=True)
    thumbnail_path = Column(Text, nullable=True)
    duration = Column(Float, default=0.0)
    resolution = Column(String(20), default="1080p")

    status = Column(String(50), default="pending")
    progress = Column(Integer, default=0)
    progress_message = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)

    youtube_video_id = Column(String(100), nullable=True)
    youtube_url = Column(String(500), nullable=True)
    youtube_status = Column(String(50), nullable=True)

    tags = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class VideoJob(Base):
    __tablename__ = "video_jobs"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_type = Column(String(50), nullable=False)
    status = Column(String(50), default="queued")
    progress = Column(Integer, default=0)
    result_path = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
