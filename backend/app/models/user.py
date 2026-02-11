from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_google_user = Column(Boolean, default=False)
    google_id = Column(String(255), nullable=True)

    voice_profile_id = Column(String(255), nullable=True)
    voice_sample_path = Column(Text, nullable=True)
    voice_preset = Column(String(100), nullable=True)
    avatar_image_path = Column(Text, nullable=True)
    avatar_quality_score = Column(Integer, nullable=True)

    newsapi_key = Column(String(255), nullable=True)
    groq_api_key = Column(String(255), nullable=True)
    gnews_api_key = Column(String(255), nullable=True)
    pexels_api_key = Column(String(255), nullable=True)
    elevenlabs_api_key = Column(String(255), nullable=True)
    did_api_key = Column(String(255), nullable=True)
    youtube_refresh_token = Column(Text, nullable=True)
    youtube_channel_id = Column(String(255), nullable=True)

    default_language = Column(String(10), default="en")
    default_style = Column(String(50), default="neutral")
    default_duration = Column(Integer, default=90)
    dark_mode = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
