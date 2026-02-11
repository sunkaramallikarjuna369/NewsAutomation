from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class NewsAggregation(Base):
    __tablename__ = "news_aggregations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic = Column(String(500), nullable=False)
    articles_json = Column(JSON, nullable=True)
    source_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FactVerification(Base):
    __tablename__ = "fact_verifications"

    id = Column(Integer, primary_key=True, index=True)
    aggregation_id = Column(Integer, ForeignKey("news_aggregations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic = Column(String(500), nullable=False)
    verified_facts = Column(JSON, nullable=True)
    excluded_claims = Column(JSON, nullable=True)
    agreement_score = Column(Float, default=0.0)
    controversy_level = Column(String(50), default="low")
    credibility_matrix = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
