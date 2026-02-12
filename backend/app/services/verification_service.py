import httpx
import json
import logging
from typing import List, Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

VERIFICATION_SYSTEM_PROMPT = """You are a fact verification engine. Given a list of news articles about a topic, you must:

1. Extract all factual claims from the articles
2. Cross-reference facts across sources
3. Identify verified facts (confirmed by 3+ sources), unverified claims (1-2 sources), and contradictions
4. Calculate an agreement score (0-1) and controversy level (low/medium/high)

Return a JSON object with this exact structure:
{
  "verified_facts": [
    {"fact": "...", "source_count": 5, "sources": ["Source1", "Source2", ...], "confidence": 0.95}
  ],
  "excluded_claims": [
    {"claim": "...", "source": "SourceName", "reason": "Only reported by single source"}
  ],
  "agreement_score": 0.85,
  "controversy_level": "low",
  "credibility_matrix": {
    "SourceName": {"facts_contributed": 5, "verified_ratio": 0.8}
  },
  "summary": "Brief verification summary..."
}

RETURN ONLY VALID JSON. No markdown, no commentary."""


class VerificationService:
    def __init__(self, groq_api_key: Optional[str] = None):
        self.groq_api_key = groq_api_key or settings.GROQ_API_KEY

    async def verify(self, topic: str, articles: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not self.groq_api_key:
            return self._fallback_verification(topic, articles)

        articles_text = json.dumps(articles[:15], indent=2, default=str)
        user_prompt = f"""Topic: {topic}

Articles to verify:
{articles_text}

Analyze these articles and provide fact verification results."""

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "llama-3.1-70b-versatile",
                        "messages": [
                            {"role": "system", "content": VERIFICATION_SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 4096,
                        "response_format": {"type": "json_object"},
                    },
                )
                if resp.status_code != 200:
                    logger.warning(f"Groq API error: {resp.status_code} {resp.text}")
                    return self._fallback_verification(topic, articles)

                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception as e:
            logger.warning(f"Verification error: {e}")
            return self._fallback_verification(topic, articles)

    def _fallback_verification(self, topic: str, articles: List[Dict[str, Any]]) -> Dict[str, Any]:
        source_facts: Dict[str, List[str]] = {}
        for art in articles:
            source = art.get("source", "Unknown")
            title = art.get("title", "")
            if title:
                source_facts.setdefault(title, []).append(source)

        verified = []
        excluded = []
        for fact, sources in source_facts.items():
            if len(sources) >= 2:
                verified.append({
                    "fact": fact,
                    "source_count": len(sources),
                    "sources": sources,
                    "confidence": min(len(sources) / 5.0, 1.0),
                })
            else:
                excluded.append({
                    "claim": fact,
                    "source": sources[0] if sources else "Unknown",
                    "reason": "Only reported by single source",
                })

        total = len(verified) + len(excluded)
        agreement = len(verified) / total if total > 0 else 0.5

        return {
            "verified_facts": verified[:20],
            "excluded_claims": excluded[:10],
            "agreement_score": round(agreement, 2),
            "controversy_level": "low" if agreement > 0.7 else "medium" if agreement > 0.4 else "high",
            "credibility_matrix": {},
            "summary": f"Analyzed {len(articles)} articles on '{topic}'. Found {len(verified)} verified facts and {len(excluded)} unverified claims.",
        }
