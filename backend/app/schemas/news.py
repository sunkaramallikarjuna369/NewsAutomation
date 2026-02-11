from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class NewsAggregateRequest(BaseModel):
    topic: str
    target_count: int = 15


class ArticleSchema(BaseModel):
    source: str
    source_tier: str = "tier2"
    title: str
    summary: str
    key_facts: List[str] = []
    published_date: Optional[str] = None
    author: Optional[str] = None
    credibility_score: float = 0.5
    url: Optional[str] = None


class NewsAggregateResponse(BaseModel):
    id: int
    topic: str
    articles: List[ArticleSchema]
    source_count: int
    created_at: Optional[datetime] = None


class VerifyRequest(BaseModel):
    aggregation_id: int


class VerifiedFact(BaseModel):
    fact: str
    source_count: int
    sources: List[str]
    confidence: float


class ExcludedClaim(BaseModel):
    claim: str
    source: str
    reason: str


class VerificationResponse(BaseModel):
    id: int
    aggregation_id: int
    topic: str
    verified_facts: List[Any]
    excluded_claims: List[Any]
    agreement_score: float
    controversy_level: str
    summary: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
