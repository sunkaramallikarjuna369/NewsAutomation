from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    verification_id = Column(Integer, ForeignKey("fact_verifications.id"), nullable=True)
    topic = Column(String(500), nullable=False)
    language = Column(String(10), default="en")
    style = Column(String(50), default="neutral")
    target_duration = Column(Integer, default=90)
    script_json = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    total_duration = Column(Float, default=0.0)
    segment_count = Column(Integer, default=0)
    status = Column(String(50), default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
