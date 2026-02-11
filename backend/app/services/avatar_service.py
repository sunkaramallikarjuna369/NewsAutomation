import os
import uuid
import logging
from typing import Optional, Dict

from app.core.config import settings

logger = logging.getLogger(__name__)


class AvatarService:
    def __init__(self):
        self.upload_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
        os.makedirs(self.upload_dir, exist_ok=True)

    async def save_avatar_photo(self, file_content: bytes, filename: str, user_id: int) -> Dict:
        avatar_id = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}"
        ext = os.path.splitext(filename)[1] or ".png"
        save_path = os.path.join(self.upload_dir, f"{avatar_id}{ext}")
        with open(save_path, "wb") as f:
            f.write(file_content)

        quality_score = 85
        try:
            from PIL import Image
            img = Image.open(save_path)
            width, height = img.size
            if width >= 512 and height >= 512:
                quality_score = 95
            elif width >= 256 and height >= 256:
                quality_score = 80
            else:
                quality_score = 60
        except Exception as e:
            logger.warning(f"Image quality check failed: {e}")

        return {
            "avatar_id": avatar_id,
            "file_path": save_path,
            "quality_score": quality_score,
        }

    async def generate_avatar_video(
        self,
        audio_path: str,
        avatar_image_path: str,
        user_id: int,
    ) -> Dict:
        output_dir = os.path.join(settings.UPLOAD_DIR, "videos")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.mp4")

        if settings.GPU_ENABLED:
            try:
                return await self._generate_with_sadtalker(audio_path, avatar_image_path, output_path)
            except Exception as e:
                logger.warning(f"SadTalker generation failed: {e}")

        return await self._generate_static_avatar(audio_path, avatar_image_path, output_path)

    async def _generate_with_sadtalker(
        self, audio_path: str, avatar_image_path: str, output_path: str
    ) -> Dict:
        logger.info("SadTalker generation requested - requires GPU and SadTalker installation")
        raise NotImplementedError(
            "SadTalker requires GPU and local installation. "
            "Set GPU_ENABLED=true and install SadTalker to use this feature. "
            "Falling back to static avatar."
        )

    async def _generate_static_avatar(
        self, audio_path: str, avatar_image_path: str, output_path: str
    ) -> Dict:
        try:
            from moviepy import ImageClip, AudioFileClip

            audio_clip = AudioFileClip(audio_path)
            duration = audio_clip.duration

            img_clip = ImageClip(avatar_image_path, duration=duration)
            img_clip = img_clip.with_audio(audio_clip)
            img_clip = img_clip.resized(height=720)

            img_clip.write_videofile(
                output_path,
                fps=30,
                codec="libx264",
                audio_codec="aac",
                logger=None,
            )
            audio_clip.close()
            img_clip.close()

            return {"avatar_video_path": output_path}
        except Exception as e:
            logger.error(f"Static avatar generation failed: {e}")
            return {"avatar_video_path": "", "error": str(e)}
