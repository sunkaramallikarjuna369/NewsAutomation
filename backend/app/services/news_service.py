import httpx
import feedparser
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)

RSS_FEEDS = {
    "The Hindu": "https://www.thehindu.com/news/national/feeder/default.rss",
    "Indian Express": "https://indianexpress.com/section/india/feed/",
    "NDTV": "https://feeds.feedburner.com/ndtvnews-top-stories",
    "Reuters India": "https://feeds.reuters.com/reuters/INtopNews",
    "Times of India": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
    "Hindustan Times": "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
    "BBC India": "https://feeds.bbci.co.uk/news/world/asia/india/rss.xml",
    "Al Jazeera": "https://www.aljazeera.com/xml/rss/all.xml",
    "Economic Times": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
    "Livemint": "https://www.livemint.com/rss/news",
}

SOURCE_TIERS = {
    "Reuters India": "tier1",
    "BBC India": "tier1",
    "Al Jazeera": "tier1",
    "The Hindu": "tier1",
    "NDTV": "tier2",
    "Indian Express": "tier2",
    "Times of India": "tier2",
    "Hindustan Times": "tier2",
    "Economic Times": "tier2",
    "Livemint": "tier2",
    "NewsAPI": "tier2",
    "GNews": "tier3",
}


class NewsService:
    def __init__(self, newsapi_key: Optional[str] = None, gnews_key: Optional[str] = None):
        self.newsapi_key = newsapi_key or settings.NEWSAPI_KEY
        self.gnews_key = gnews_key or settings.GNEWS_API_KEY

    async def aggregate(self, topic: str, target_count: int = 15) -> List[Dict[str, Any]]:
        tasks = []
        tasks.append(self._fetch_rss_feeds(topic))
        if self.newsapi_key:
            tasks.append(self._fetch_newsapi(topic))
        if self.gnews_key:
            tasks.append(self._fetch_gnews(topic))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        all_articles = []
        for result in results:
            if isinstance(result, Exception):
                logger.warning(f"News fetch error: {result}")
                continue
            if isinstance(result, list):
                all_articles.extend(result)

        seen_titles = set()
        unique_articles = []
        for article in all_articles:
            title_lower = article.get("title", "").lower().strip()
            if title_lower and title_lower not in seen_titles:
                seen_titles.add(title_lower)
                unique_articles.append(article)

        unique_articles.sort(
            key=lambda x: x.get("credibility_score", 0.5), reverse=True
        )
        return unique_articles[:target_count]

    async def _fetch_rss_feeds(self, topic: str) -> List[Dict[str, Any]]:
        articles = []
        topic_lower = topic.lower()
        keywords = topic_lower.split()

        async def fetch_single_feed(name: str, url: str):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        return []
                feed = feedparser.parse(resp.text)
                matched = []
                for entry in feed.entries[:30]:
                    title = getattr(entry, "title", "")
                    summary = getattr(entry, "summary", getattr(entry, "description", ""))
                    text = f"{title} {summary}".lower()
                    if any(kw in text for kw in keywords):
                        matched.append({
                            "source": name,
                            "source_tier": SOURCE_TIERS.get(name, "tier3"),
                            "title": title,
                            "summary": summary[:500] if summary else "",
                            "key_facts": [],
                            "published_date": getattr(entry, "published", None),
                            "author": getattr(entry, "author", None),
                            "credibility_score": 0.7 if SOURCE_TIERS.get(name) == "tier1" else 0.5,
                            "url": getattr(entry, "link", ""),
                        })
                return matched
            except Exception as e:
                logger.warning(f"RSS feed error for {name}: {e}")
                return []

        tasks = [fetch_single_feed(name, url) for name, url in RSS_FEEDS.items()]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, list):
                articles.extend(result)
        return articles

    async def fetch_daily_headlines(self) -> List[Dict[str, Any]]:
        articles: List[Dict[str, Any]] = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                for name, url in list(RSS_FEEDS.items())[:5]:
                    try:
                        resp = await client.get(url)
                        if resp.status_code != 200:
                            continue
                        feed = feedparser.parse(resp.text)
                        for entry in feed.entries[:3]:
                            title = getattr(entry, "title", "")
                            summary = getattr(entry, "summary", getattr(entry, "description", ""))
                            articles.append({
                                "source": name,
                                "title": title,
                                "summary": (summary[:200] + "...") if len(summary) > 200 else summary,
                                "url": getattr(entry, "link", ""),
                                "published_date": getattr(entry, "published", None),
                            })
                    except Exception as e:
                        logger.warning(f"Daily headlines RSS error for {name}: {e}")
                        continue
        except Exception as e:
            logger.warning(f"Daily headlines error: {e}")
        seen_titles: set = set()
        unique: List[Dict[str, Any]] = []
        for a in articles:
            t = a.get("title", "").lower().strip()
            if t and t not in seen_titles:
                seen_titles.add(t)
                unique.append(a)
        return unique[:15]

    async def _fetch_newsapi(self, topic: str) -> List[Dict[str, Any]]:
        if not self.newsapi_key:
            return []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://newsapi.org/v2/everything",
                    params={
                        "q": topic,
                        "sortBy": "relevancy",
                        "pageSize": 10,
                        "apiKey": self.newsapi_key,
                        "language": "en",
                    },
                )
                if resp.status_code != 200:
                    return []
                data = resp.json()
                articles = []
                for art in data.get("articles", []):
                    articles.append({
                        "source": f"NewsAPI - {art.get('source', {}).get('name', 'Unknown')}",
                        "source_tier": "tier2",
                        "title": art.get("title", ""),
                        "summary": art.get("description", "")[:500],
                        "key_facts": [],
                        "published_date": art.get("publishedAt"),
                        "author": art.get("author"),
                        "credibility_score": 0.6,
                        "url": art.get("url", ""),
                    })
                return articles
        except Exception as e:
            logger.warning(f"NewsAPI error: {e}")
            return []

    async def _fetch_gnews(self, topic: str) -> List[Dict[str, Any]]:
        if not self.gnews_key:
            return []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://gnews.io/api/v4/search",
                    params={
                        "q": topic,
                        "max": 10,
                        "token": self.gnews_key,
                        "lang": "en",
                    },
                )
                if resp.status_code != 200:
                    return []
                data = resp.json()
                articles = []
                for art in data.get("articles", []):
                    articles.append({
                        "source": f"GNews - {art.get('source', {}).get('name', 'Unknown')}",
                        "source_tier": "tier3",
                        "title": art.get("title", ""),
                        "summary": art.get("description", "")[:500],
                        "key_facts": [],
                        "published_date": art.get("publishedAt"),
                        "author": None,
                        "credibility_score": 0.4,
                        "url": art.get("url", ""),
                    })
                return articles
        except Exception as e:
            logger.warning(f"GNews error: {e}")
            return []
