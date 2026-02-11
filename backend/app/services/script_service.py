import httpx
import json
import logging
from typing import Dict, Any, Optional, List

from app.core.config import settings

logger = logging.getLogger(__name__)

SCRIPT_SYSTEM_PROMPT = """You are an elite investigative news analyst and AI video producer for professional YouTube current affairs channels. You operate as part of an automated news verification and video production platform.

OPERATIONAL CONTEXT:
You receive verified facts from news articles covering ONE specific topic/event. Your mission is to generate a professional video script.

EXECUTION:
- Construct a narrative arc: hook, body, context, conclusion
- Write for SPOKEN delivery (short sentences, contractions, active voice)
- Add voice direction markup: [pause], [breath], *emphasis*, [slow]...[/slow], [rise]...[/rise]
- Total duration must be 85-95 seconds
- Create 8 segments

Return a SINGLE JSON OBJECT with this structure:
{
  "metadata": {
    "topic": "...",
    "generated_at": "ISO timestamp",
    "total_duration_seconds": 90,
    "segment_count": 8,
    "language": "en",
    "style": "neutral"
  },
  "video_title": {
    "primary": "Main Title",
    "subtitle": "Subtitle"
  },
  "video_description": {
    "intro": "First paragraph...",
    "body": "Main description...",
    "timestamps": ["0:00 - Introduction", "0:12 - Key Facts", ...],
    "sources": ["Source1", "Source2"],
    "hashtags": ["#topic1", "#topic2"]
  },
  "voiceover_script": [
    {
      "segment_number": 1,
      "segment_type": "intro",
      "text": "Script text with [pause] and *emphasis* markup...",
      "duration_seconds": 12,
      "visual_cue": "Show intro graphic with topic title",
      "infographic_type": "title_card"
    }
  ],
  "visual_elements": [
    {
      "segment_number": 1,
      "type": "title_card",
      "content": {"title": "...", "subtitle": "..."},
      "duration_seconds": 12
    }
  ],
  "thumbnail": {
    "headline": "Short catchy title",
    "subtext": "Brief context",
    "style": "news_breaking"
  },
  "seo_tags": {
    "primary_keywords": ["keyword1", "keyword2"],
    "secondary_keywords": ["keyword3", "keyword4"],
    "category": "News & Politics"
  },
  "voice_synthesis_config": {
    "speaking_rate": 1.0,
    "pitch_variation": "moderate",
    "emphasis_strength": "medium"
  },
  "avatar_config": {
    "presentation_style": "formal",
    "gestures": "minimal"
  },
  "quality_assurance": {
    "fact_check_status": "verified",
    "bias_assessment": "neutral",
    "total_word_count": 250
  }
}

CRITICAL RULES:
1. Only include facts confirmed by sources
2. Never fabricate statistics, quotes, or events
3. Lead with data, official statements, and concrete facts
4. Maintain neutral, balanced tone
5. Write exactly as a professional news anchor would speak
6. Total voiceover must be between 85 and 95 seconds
7. Every visual element must support the spoken segment
8. When sources disagree, say 'according to [source]'
9. Use all voice direction markers for natural TTS
10. RETURN ONLY VALID JSON."""


class ScriptService:
    def __init__(self, groq_api_key: Optional[str] = None):
        self.groq_api_key = groq_api_key or settings.GROQ_API_KEY

    async def generate(
        self,
        topic: str,
        verified_facts: Optional[Any] = None,
        style: str = "neutral",
        duration: int = 90,
        language: str = "en",
    ) -> Dict[str, Any]:
        if not self.groq_api_key:
            return self._fallback_script(topic, verified_facts, style, duration, language)

        facts_text = json.dumps(verified_facts, indent=2, default=str) if verified_facts else "No verified facts provided."
        user_prompt = f"""Generate a professional news video script for:

Topic: {topic}
Style: {style}
Target Duration: {duration} seconds
Language: {language}

Verified Facts:
{facts_text}

Generate a complete 8-segment video script following the exact JSON structure specified."""

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
                            {"role": "system", "content": SCRIPT_SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.7,
                        "max_tokens": 8192,
                        "response_format": {"type": "json_object"},
                    },
                )
                if resp.status_code != 200:
                    logger.warning(f"Groq API error: {resp.status_code}")
                    return self._fallback_script(topic, verified_facts, style, duration, language)

                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception as e:
            logger.warning(f"Script generation error: {e}")
            return self._fallback_script(topic, verified_facts, style, duration, language)

    async def regenerate_segment(
        self, script_json: Dict[str, Any], segment_number: int, instructions: str = ""
    ) -> Dict[str, Any]:
        if not self.groq_api_key:
            return script_json

        prompt = f"""Given this existing script, regenerate ONLY segment {segment_number}.
Additional instructions: {instructions}

Current script:
{json.dumps(script_json, indent=2)}

Return the COMPLETE updated script JSON with the regenerated segment."""

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
                            {"role": "system", "content": SCRIPT_SYSTEM_PROMPT},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.7,
                        "max_tokens": 8192,
                        "response_format": {"type": "json_object"},
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return json.loads(data["choices"][0]["message"]["content"])
        except Exception as e:
            logger.warning(f"Segment regeneration error: {e}")
        return script_json

    def _fallback_script(
        self, topic: str, verified_facts: Any, style: str, duration: int, language: str
    ) -> Dict[str, Any]:
        segments = [
            {"segment_number": 1, "segment_type": "intro", "text": f"[pause] Welcome back. *Today* we're covering {topic}. [breath] Here's what you need to know.", "duration_seconds": 12, "visual_cue": "Show intro with topic title", "infographic_type": "title_card"},
            {"segment_number": 2, "segment_type": "fact", "text": f"[pause] The latest developments on {topic} have drawn significant attention. *Multiple sources* confirm key developments unfolding right now.", "duration_seconds": 12, "visual_cue": "Show key facts infographic", "infographic_type": "fact_list"},
            {"segment_number": 3, "segment_type": "fact", "text": "[pause] According to official reports, [breath] the situation has evolved considerably over the past few days.", "duration_seconds": 11, "visual_cue": "Show timeline", "infographic_type": "timeline"},
            {"segment_number": 4, "segment_type": "context", "text": "[pause] To put this in *perspective*, [breath] experts point to several underlying factors driving these developments.", "duration_seconds": 11, "visual_cue": "Show context graphic", "infographic_type": "comparison"},
            {"segment_number": 5, "segment_type": "analysis", "text": "[pause] What makes this particularly *significant* is the broader implications. [breath] Analysts suggest this could reshape the landscape.", "duration_seconds": 12, "visual_cue": "Show analysis chart", "infographic_type": "bar_chart"},
            {"segment_number": 6, "segment_type": "fact", "text": "[pause] Meanwhile, [breath] stakeholders from various sectors have weighed in with their *reactions* and assessments.", "duration_seconds": 11, "visual_cue": "Show quotes", "infographic_type": "quote_card"},
            {"segment_number": 7, "segment_type": "analysis", "text": "[pause] Looking ahead, [breath] *several scenarios* are being discussed by policy experts and industry leaders.", "duration_seconds": 11, "visual_cue": "Show future outlook", "infographic_type": "pie_chart"},
            {"segment_number": 8, "segment_type": "conclusion", "text": f"[pause] That's the latest on {topic}. [breath] *Stay tuned* for more updates. [pause] If you found this helpful, like and subscribe.", "duration_seconds": 10, "visual_cue": "Show outro with subscribe CTA", "infographic_type": "outro_card"},
        ]
        return {
            "metadata": {"topic": topic, "generated_at": "2024-01-01T00:00:00Z", "total_duration_seconds": 90, "segment_count": 8, "language": language, "style": style},
            "video_title": {"primary": f"Breaking: {topic} - Latest Updates", "subtitle": "Complete Analysis & Key Facts"},
            "video_description": {"intro": f"In this video, we cover the latest developments on {topic}.", "body": "A comprehensive analysis based on verified facts from multiple sources.", "timestamps": [f"0:00 - Introduction", "0:12 - Key Facts", "0:24 - Timeline", "0:35 - Context", "0:46 - Analysis", "0:57 - Reactions", "1:08 - Outlook", "1:19 - Conclusion"], "sources": ["Multiple verified sources"], "hashtags": [f"#{topic.replace(' ', '')}", "#BreakingNews", "#NewsUpdate"]},
            "voiceover_script": segments,
            "visual_elements": [{"segment_number": s["segment_number"], "type": s["infographic_type"], "content": {"title": s["visual_cue"]}, "duration_seconds": s["duration_seconds"]} for s in segments],
            "thumbnail": {"headline": f"{topic}: What You Need to Know", "subtext": "Complete Analysis", "style": "news_breaking"},
            "seo_tags": {"primary_keywords": topic.split()[:3], "secondary_keywords": ["news", "update", "analysis"], "category": "News & Politics"},
            "voice_synthesis_config": {"speaking_rate": 1.0, "pitch_variation": "moderate", "emphasis_strength": "medium"},
            "avatar_config": {"presentation_style": "formal", "gestures": "minimal"},
            "quality_assurance": {"fact_check_status": "fallback", "bias_assessment": "neutral", "total_word_count": 250},
        }
