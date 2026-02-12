import os
import logging
from typing import Optional, Dict, Any

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from app.core.config import settings

logger = logging.getLogger(__name__)

YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.readonly",
]


class YouTubeService:
    def __init__(self):
        self.client_id = settings.YOUTUBE_CLIENT_ID
        self.client_secret = settings.YOUTUBE_CLIENT_SECRET
        self.redirect_uri = settings.YOUTUBE_REDIRECT_URI

    def get_auth_url(self) -> str:
        if not self.client_id or not self.client_secret:
            raise ValueError("YouTube OAuth credentials not configured. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET.")

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri],
                }
            },
            scopes=YOUTUBE_SCOPES,
            redirect_uri=self.redirect_uri,
        )
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
        )
        return auth_url

    def exchange_code(self, code: str) -> Dict[str, Any]:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri],
                }
            },
            scopes=YOUTUBE_SCOPES,
            redirect_uri=self.redirect_uri,
        )
        flow.fetch_token(code=code)
        credentials = flow.credentials
        return {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
        }

    def get_credentials(self, refresh_token: str) -> Credentials:
        return Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
        )

    async def upload_video(
        self,
        refresh_token: str,
        video_path: str,
        title: str,
        description: str,
        tags: list,
        privacy: str = "private",
        category_id: str = "25",
        schedule_time: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        credentials = self.get_credentials(refresh_token)
        youtube = build("youtube", "v3", credentials=credentials)

        body = {
            "snippet": {
                "title": title,
                "description": description,
                "tags": tags,
                "categoryId": category_id,
            },
            "status": {
                "privacyStatus": privacy,
                "selfDeclaredMadeForKids": False,
            },
        }

        if schedule_time and privacy == "private":
            body["status"]["privacyStatus"] = "private"
            body["status"]["publishAt"] = schedule_time

        media = MediaFileUpload(video_path, mimetype="video/mp4", resumable=True)

        request = youtube.videos().insert(
            part="snippet,status",
            body=body,
            media_body=media,
        )

        response = None
        while response is None:
            _, response = request.next_chunk()

        video_id = response["id"]
        return {
            "youtube_video_id": video_id,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "status": "uploaded",
        }

    async def get_channel_info(self, refresh_token: str) -> Dict[str, Any]:
        credentials = self.get_credentials(refresh_token)
        youtube = build("youtube", "v3", credentials=credentials)
        response = youtube.channels().list(part="snippet,statistics", mine=True).execute()
        if response.get("items"):
            channel = response["items"][0]
            return {
                "channel_id": channel["id"],
                "title": channel["snippet"]["title"],
                "subscribers": channel["statistics"].get("subscriberCount", "0"),
            }
        return {}
