import os
import uuid
import logging
import asyncio
from typing import Dict, Any, Optional, List

from app.core.config import settings

logger = logging.getLogger(__name__)


class VideoService:
    def __init__(self):
        self.output_dir = os.path.join(settings.UPLOAD_DIR, "videos")
        self.thumbnail_dir = os.path.join(settings.UPLOAD_DIR, "thumbnails")
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.thumbnail_dir, exist_ok=True)

    async def generate_video(
        self,
        script_json: Dict[str, Any],
        audio_path: str,
        user_id: int,
        avatar_video_path: Optional[str] = None,
        use_avatar: bool = False,
        progress_callback=None,
    ) -> Dict[str, Any]:
        video_id = f"video_{user_id}_{uuid.uuid4().hex[:8]}"
        output_path = os.path.join(self.output_dir, f"{video_id}.mp4")
        thumbnail_path = os.path.join(self.thumbnail_dir, f"{video_id}.png")

        try:
            if progress_callback:
                await progress_callback(10, "Generating infographics...")

            infographic_paths = await self._generate_infographics(script_json, user_id)

            if progress_callback:
                await progress_callback(30, "Preparing video components...")

            if progress_callback:
                await progress_callback(50, "Assembling video...")

            await self._assemble_video(
                script_json=script_json,
                audio_path=audio_path,
                infographic_paths=infographic_paths,
                avatar_video_path=avatar_video_path if use_avatar else None,
                output_path=output_path,
            )

            if progress_callback:
                await progress_callback(80, "Generating thumbnail...")

            await self._generate_thumbnail(script_json, thumbnail_path)

            if progress_callback:
                await progress_callback(100, "Video complete!")

            duration = 0.0
            try:
                from moviepy import VideoFileClip
                clip = VideoFileClip(output_path)
                duration = clip.duration
                clip.close()
            except Exception:
                pass

            return {
                "video_path": output_path,
                "thumbnail_path": thumbnail_path,
                "duration": duration,
                "video_id": video_id,
            }
        except Exception as e:
            logger.error(f"Video generation failed: {e}")
            raise

    async def _generate_infographics(
        self, script_json: Dict[str, Any], user_id: int
    ) -> List[str]:
        visual_elements = script_json.get("visual_elements", [])
        paths = []

        for element in visual_elements:
            try:
                seg_num = element.get("segment_number", 0)
                elem_type = element.get("type", "title_card")
                content = element.get("content", {})

                path = await self._create_infographic(
                    elem_type, content, seg_num, user_id
                )
                paths.append(path)
            except Exception as e:
                logger.warning(f"Infographic generation error: {e}")
                paths.append(None)

        return paths

    async def _create_infographic(
        self, chart_type: str, content: Dict, seg_num: int, user_id: int
    ) -> str:
        from PIL import Image, ImageDraw, ImageFont
        import plotly.graph_objects as go

        output_path = os.path.join(
            self.output_dir, f"infographic_{user_id}_{seg_num}.png"
        )

        if chart_type in ("bar_chart", "pie_chart", "timeline"):
            try:
                if chart_type == "bar_chart":
                    fig = go.Figure(
                        data=[go.Bar(x=["Category A", "Category B", "Category C"], y=[30, 50, 20])]
                    )
                elif chart_type == "pie_chart":
                    fig = go.Figure(
                        data=[go.Pie(labels=["Segment 1", "Segment 2", "Segment 3"], values=[40, 35, 25])]
                    )
                else:
                    fig = go.Figure(
                        data=[go.Scatter(x=[1, 2, 3, 4], y=[10, 20, 15, 25], mode="lines+markers")]
                    )
                fig.update_layout(
                    template="plotly_dark",
                    width=1920,
                    height=1080,
                    paper_bgcolor="#1a1a2e",
                    plot_bgcolor="#1a1a2e",
                    font=dict(color="white", size=18),
                    title=dict(text=content.get("title", ""), font=dict(size=28)),
                )
                fig.write_image(output_path)
                return output_path
            except Exception as e:
                logger.warning(f"Plotly chart error: {e}")

        img = Image.new("RGB", (1920, 1080), color=(26, 26, 46))
        draw = ImageDraw.Draw(img)

        title = content.get("title", f"Segment {seg_num}")
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
            small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        except Exception:
            font = ImageFont.load_default()
            small_font = font

        draw.rectangle([50, 50, 1870, 150], fill=(30, 60, 114))
        bbox = draw.textbbox((0, 0), title, font=font)
        text_width = bbox[2] - bbox[0]
        draw.text(((1920 - text_width) // 2, 70), title, fill="white", font=font)

        subtitle = content.get("subtitle", "")
        if subtitle:
            bbox2 = draw.textbbox((0, 0), subtitle, font=small_font)
            sw = bbox2[2] - bbox2[0]
            draw.text(((1920 - sw) // 2, 200), subtitle, fill=(200, 200, 200), font=small_font)

        draw.rectangle([100, 950, 1820, 960], fill=(0, 188, 212))

        img.save(output_path)
        return output_path

    async def _assemble_video(
        self,
        script_json: Dict[str, Any],
        audio_path: str,
        infographic_paths: List[Optional[str]],
        avatar_video_path: Optional[str],
        output_path: str,
    ):
        from moviepy import (
            ImageClip,
            AudioFileClip,
            VideoFileClip,
            CompositeVideoClip,
            concatenate_videoclips,
        )

        audio = AudioFileClip(audio_path)
        total_duration = audio.duration

        segments = script_json.get("voiceover_script", [])
        if not segments:
            bg = ImageClip(
                self._create_solid_frame(), duration=total_duration
            ).with_audio(audio)
            bg.write_videofile(output_path, fps=30, codec="libx264", audio_codec="aac", logger=None)
            audio.close()
            bg.close()
            return

        clips = []
        current_time = 0
        for i, segment in enumerate(segments):
            seg_duration = segment.get("duration_seconds", total_duration / len(segments))
            if i == len(segments) - 1:
                seg_duration = total_duration - current_time

            if seg_duration <= 0:
                continue

            if i < len(infographic_paths) and infographic_paths[i] and os.path.exists(infographic_paths[i]):
                clip = ImageClip(infographic_paths[i], duration=seg_duration)
            else:
                clip = ImageClip(self._create_solid_frame(), duration=seg_duration)

            clip = clip.resized((1920, 1080))
            clips.append(clip)
            current_time += seg_duration

        if not clips:
            bg = ImageClip(
                self._create_solid_frame(), duration=total_duration
            ).with_audio(audio)
            bg.write_videofile(output_path, fps=30, codec="libx264", audio_codec="aac", logger=None)
            audio.close()
            bg.close()
            return

        final = concatenate_videoclips(clips, method="compose")

        if avatar_video_path and os.path.exists(avatar_video_path):
            try:
                avatar_clip = VideoFileClip(avatar_video_path)
                avatar_clip = avatar_clip.resized(height=250)
                avatar_clip = avatar_clip.with_position(("right", "bottom"))
                if avatar_clip.duration < final.duration:
                    avatar_clip = avatar_clip.with_effects([])
                final = CompositeVideoClip([final, avatar_clip])
            except Exception as e:
                logger.warning(f"Avatar overlay failed: {e}")

        final = final.with_audio(audio)
        final.write_videofile(output_path, fps=30, codec="libx264", audio_codec="aac", logger=None)

        audio.close()
        final.close()
        for c in clips:
            c.close()

    def _create_solid_frame(self) -> str:
        from PIL import Image
        path = os.path.join(self.output_dir, "solid_bg.png")
        if not os.path.exists(path):
            img = Image.new("RGB", (1920, 1080), color=(26, 26, 46))
            img.save(path)
        return path

    async def _generate_thumbnail(self, script_json: Dict[str, Any], output_path: str):
        from PIL import Image, ImageDraw, ImageFont

        thumbnail_data = script_json.get("thumbnail", {})
        headline = thumbnail_data.get("headline", "News Update")
        subtext = thumbnail_data.get("subtext", "")

        img = Image.new("RGB", (1280, 720), color=(20, 20, 50))
        draw = ImageDraw.Draw(img)

        draw.rectangle([0, 0, 1280, 80], fill=(220, 20, 20))
        try:
            banner_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
        except Exception:
            banner_font = ImageFont.load_default()
        draw.text((20, 25), "BREAKING NEWS", fill="white", font=banner_font)

        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 52)
            sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        except Exception:
            title_font = ImageFont.load_default()
            sub_font = title_font

        words = headline.split()
        lines = []
        current = ""
        for w in words:
            test = f"{current} {w}".strip()
            bbox = draw.textbbox((0, 0), test, font=title_font)
            if bbox[2] - bbox[0] > 1200:
                lines.append(current)
                current = w
            else:
                current = test
        if current:
            lines.append(current)

        y_pos = 200
        for line in lines[:3]:
            draw.text((40, y_pos), line, fill="white", font=title_font)
            y_pos += 65

        if subtext:
            draw.text((40, y_pos + 30), subtext, fill=(180, 180, 180), font=sub_font)

        draw.rectangle([0, 680, 1280, 720], fill=(0, 188, 212))

        img.save(output_path)
