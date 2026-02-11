from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.news import NewsAggregation, FactVerification
from app.schemas.news import (
    NewsAggregateRequest,
    NewsAggregateResponse,
    VerifyRequest,
    VerificationResponse,
    ArticleSchema,
)
from app.services.news_service import NewsService
from app.services.verification_service import VerificationService

router = APIRouter(prefix="/api/news", tags=["News"])


@router.post("/aggregate", response_model=NewsAggregateResponse)
async def aggregate_news(
    data: NewsAggregateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NewsService(
        newsapi_key=current_user.newsapi_key,
        gnews_key=current_user.gnews_api_key,
    )
    articles = await service.aggregate(data.topic, data.target_count)

    aggregation = NewsAggregation(
        user_id=current_user.id,
        topic=data.topic,
        articles_json=articles,
        source_count=len(set(a.get("source", "") for a in articles)),
    )
    db.add(aggregation)
    await db.commit()
    await db.refresh(aggregation)

    return NewsAggregateResponse(
        id=aggregation.id,
        topic=aggregation.topic,
        articles=[ArticleSchema(**a) for a in articles],
        source_count=aggregation.source_count,
        created_at=aggregation.created_at,
    )


@router.post("/verify", response_model=VerificationResponse)
async def verify_news(
    data: VerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(NewsAggregation).where(
            NewsAggregation.id == data.aggregation_id,
            NewsAggregation.user_id == current_user.id,
        )
    )
    aggregation = result.scalar_one_or_none()
    if not aggregation:
        raise HTTPException(status_code=404, detail="Aggregation not found")

    service = VerificationService(
        groq_api_key=current_user.groq_api_key,
    )
    verification_result = await service.verify(
        aggregation.topic, aggregation.articles_json or []
    )

    verification = FactVerification(
        aggregation_id=aggregation.id,
        user_id=current_user.id,
        topic=aggregation.topic,
        verified_facts=verification_result.get("verified_facts", []),
        excluded_claims=verification_result.get("excluded_claims", []),
        agreement_score=verification_result.get("agreement_score", 0.0),
        controversy_level=verification_result.get("controversy_level", "low"),
        credibility_matrix=verification_result.get("credibility_matrix", {}),
        summary=verification_result.get("summary", ""),
    )
    db.add(verification)
    await db.commit()
    await db.refresh(verification)

    return VerificationResponse(
        id=verification.id,
        aggregation_id=verification.aggregation_id,
        topic=verification.topic,
        verified_facts=verification.verified_facts or [],
        excluded_claims=verification.excluded_claims or [],
        agreement_score=verification.agreement_score,
        controversy_level=verification.controversy_level,
        summary=verification.summary,
        created_at=verification.created_at,
    )


@router.get("/trending")
async def get_trending():
    return {
        "trending_topics": [
            "India Budget 2026",
            "AI Regulation Global",
            "Climate Change COP",
            "Space Exploration Updates",
            "Cryptocurrency Regulation",
            "Global Economy Outlook",
            "Technology IPOs 2026",
            "Education Policy Reform",
        ]
    }
