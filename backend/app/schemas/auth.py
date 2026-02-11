from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    is_active: bool = True
    is_google_user: bool = False
    voice_profile_id: Optional[str] = None
    voice_preset: Optional[str] = None
    avatar_image_path: Optional[str] = None
    default_language: str = "en"
    default_style: str = "neutral"
    default_duration: int = 90
    dark_mode: bool = True

    class Config:
        from_attributes = True


class GoogleAuthCallback(BaseModel):
    code: str
    redirect_uri: Optional[str] = None
