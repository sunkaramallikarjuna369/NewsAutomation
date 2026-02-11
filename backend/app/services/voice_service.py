import os
import uuid
import asyncio
import logging
import json
import re
from typing import Optional, List, Dict

from app.core.config import settings

logger = logging.getLogger(__name__)

EDGE_TTS_VOICES = [
    {"id": "en-US-GuyNeural", "name": "Guy (US Male)", "language": "en-US", "gender": "male"},
    {"id": "en-US-JennyNeural", "name": "Jenny (US Female)", "language": "en-US", "gender": "female"},
    {"id": "en-US-AriaNeural", "name": "Aria (US Female)", "language": "en-US", "gender": "female"},
    {"id": "en-US-DavisNeural", "name": "Davis (US Male)", "language": "en-US", "gender": "male"},
    {"id": "en-IN-NeerjaNeural", "name": "Neerja (India Female)", "language": "en-IN", "gender": "female"},
    {"id": "en-IN-PrabhatNeural", "name": "Prabhat (India Male)", "language": "en-IN", "gender": "male"},
    {"id": "en-GB-SoniaNeural", "name": "Sonia (UK Female)", "language": "en-GB", "gender": "female"},
    {"id": "en-GB-RyanNeural", "name": "Ryan (UK Male)", "language": "en-GB", "gender": "male"},
    {"id": "hi-IN-SwaraNeural", "name": "Swara (Hindi Female)", "language": "hi-IN", "gender": "female"},
    {"id": "hi-IN-MadhurNeural", "name": "Madhur (Hindi Male)", "language": "hi-IN", "gender": "male"},
    {"id": "te-IN-MohanNeural", "name": "Mohan (Telugu Male)", "language": "te-IN", "gender": "male"},
    {"id": "te-IN-ShrutiNeural", "name": "Shruti (Telugu Female)", "language": "te-IN", "gender": "female"},
    {"id": "ta-IN-PallaviNeural", "name": "Pallavi (Tamil Female)", "language": "ta-IN", "gender": "female"},
    {"id": "ta-IN-ValluvarNeural", "name": "Valluvar (Tamil Male)", "language": "ta-IN", "gender": "male"},
]


def clean_markup(text: str) -> str:
    text = re.sub(r'\[pause\]', '...', text)
    text = re.sub(r'\[breath\]', '', text)
    text = re.sub(r'\[slow\]', '', text)
    text = re.sub(r'\[/slow\]', '', text)
    text = re.sub(r'\[rise\]', '', text)
    text = re.sub(r'\[/rise\]', '', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


class VoiceService:
    def __init__(self):
        self.upload_dir = os.path.join(settings.UPLOAD_DIR, "voice_samples")
        os.makedirs(self.upload_dir, exist_ok=True)

    def get_preset_voices(self) -> List[Dict]:
        return EDGE_TTS_VOICES

    async def save_voice_sample(self, file_content: bytes, filename: str, user_id: int) -> Dict:
        profile_id = f"voice_{user_id}_{uuid.uuid4().hex[:8]}"
        ext = os.path.splitext(filename)[1] or ".wav"
        save_path = os.path.join(self.upload_dir, f"{profile_id}{ext}")
        with open(save_path, "wb") as f:
            f.write(file_content)
        quality_score = min(90, max(50, len(file_content) // 1000))
        return {
            "voice_profile_id": profile_id,
            "file_path": save_path,
            "quality_score": quality_score,
        }

    async def generate_audio(
        self,
        text: str,
        output_path: str,
        voice_id: Optional[str] = None,
        preset_voice: Optional[str] = None,
    ) -> Dict:
        import edge_tts

        clean_text = clean_markup(text)
        voice = preset_voice or voice_id or "en-US-GuyNeural"
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        communicate = edge_tts.Communicate(clean_text, voice)
        await communicate.save(output_path)

        file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
        estimated_duration = len(clean_text.split()) / 2.5

        return {
            "audio_file_path": output_path,
            "duration": round(estimated_duration, 1),
            "file_size": file_size,
        }

    async def generate_from_script(
        self,
        script_json: Dict,
        user_id: int,
        voice_id: Optional[str] = None,
        preset_voice: Optional[str] = None,
    ) -> Dict:
        segments = script_json.get("voiceover_script", [])
        if not segments:
            raise ValueError("No voiceover segments found in script")

        full_text = " ".join(seg.get("text", "") for seg in segments)
        output_dir = os.path.join(settings.UPLOAD_DIR, "voice_samples")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"audio_{user_id}_{uuid.uuid4().hex[:8]}.mp3")

        result = await self.generate_audio(full_text, output_path, voice_id, preset_voice)
        return result
