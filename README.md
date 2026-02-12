# NewsAI Studio - Automated News Video Generation Platform

A full-stack web application that automatically aggregates news, verifies facts, generates professional scripts, creates videos with voiceover and avatar, and uploads directly to YouTube.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python) + SQLite (async) + Redis
- **AI/ML**: Groq (LLM), Edge TTS (voice), SadTalker (avatar), MoviePy (video)
- **Deployment**: Docker + Docker Compose

## Features

- JWT authentication (email/password + Google OAuth)
- News aggregation from 10-15 sources (RSS feeds, NewsAPI, GNews)
- AI-powered fact verification and contradiction detection
- Professional script generation with voice markup
- Voice generation (Edge TTS preset voices + Coqui XTTS voice cloning)
- Talking-head avatar generation (SadTalker / static fallback)
- Video assembly with infographics, overlays, and background music
- Direct YouTube upload with metadata
- Real-time progress tracking
- Dark mode UI

---

## How to Execute

### Prerequisites (for all methods)

Install these before proceeding:

#### Python 3.11+

| OS | How to Install | Verify |
|----|---------------|--------|
| **Windows** | Download from https://www.python.org/downloads/ > Run installer > **Check "Add Python to PATH"** > Click Install | Open CMD: `python --version` |
| **Ubuntu/Debian** | `sudo apt update && sudo apt install python3 python3-pip python3-venv` | `python3 --version` |
| **macOS** | `brew install python` or download from https://www.python.org/downloads/ | `python3 --version` |

#### Node.js 18+

| OS | How to Install | Verify |
|----|---------------|--------|
| **Windows** | Download LTS from https://nodejs.org/ > Run installer > Follow prompts | Open CMD: `node --version` and `npm --version` |
| **Ubuntu/Debian** | `sudo apt update && sudo apt install nodejs npm` | `node --version` |
| **macOS** | `brew install node` or download from https://nodejs.org/ | `node --version` |

#### FFmpeg (required for video generation)

| OS | How to Install | Verify |
|----|---------------|--------|
| **Windows** | 1. Download from https://www.gyan.dev/ffmpeg/builds/ (get `ffmpeg-release-essentials.zip`) 2. Extract to `C:\ffmpeg` 3. Add `C:\ffmpeg\bin` to System PATH: Settings > System > About > Advanced system settings > Environment Variables > Edit PATH > Add `C:\ffmpeg\bin` 4. Restart CMD | Open CMD: `ffmpeg -version` |
| **Ubuntu/Debian** | `sudo apt update && sudo apt install ffmpeg` | `ffmpeg -version` |
| **macOS** | `brew install ffmpeg` | `ffmpeg -version` |

#### Git

| OS | How to Install | Verify |
|----|---------------|--------|
| **Windows** | Download from https://git-scm.com/download/win > Run installer > Use defaults | Open CMD: `git --version` |
| **Ubuntu/Debian** | `sudo apt install git` | `git --version` |
| **macOS** | `brew install git` or comes pre-installed with Xcode tools | `git --version` |

#### Redis (optional - for caching/background jobs)

| OS | How to Install | Verify |
|----|---------------|--------|
| **Windows** | **Option 1 (WSL - Recommended):** 1. Open PowerShell as Admin: `wsl --install` 2. Restart PC 3. Open Ubuntu from Start Menu 4. Run: `sudo apt update && sudo apt install redis-server` 5. Start: `sudo service redis-server start` **Option 2 (Memurai - Native Windows):** 1. Download from https://www.memurai.com/get-memurai (free developer edition) 2. Run installer 3. Memurai runs as a Windows service automatically **Option 3 (Docker):** `docker run -d -p 6379:6379 redis:7-alpine` | Open CMD: `redis-cli ping` should return `PONG` |
| **Ubuntu/Debian** | `sudo apt update && sudo apt install redis-server` then `sudo systemctl start redis-server` and `sudo systemctl enable redis-server` | `redis-cli ping` returns `PONG` |
| **macOS** | `brew install redis` then `brew services start redis` | `redis-cli ping` returns `PONG` |

> **Note**: Redis is optional. The app works fine without it. It's only used for caching and background job queues. If you skip Redis, just leave `REDIS_URL` empty in `.env`.

#### Docker & Docker Compose (only if using Docker method)

| OS | How to Install | Verify |
|----|---------------|--------|
| **Windows** | Download Docker Desktop from https://www.docker.com/products/docker-desktop/ > Run installer > Restart PC > Open Docker Desktop | Open CMD: `docker --version` and `docker compose version` |
| **Ubuntu/Debian** | Follow https://docs.docker.com/engine/install/ubuntu/ or: `sudo apt update && sudo apt install docker.io docker-compose-plugin` then `sudo usermod -aG docker $USER` (logout and login again) | `docker --version` and `docker compose version` |
| **macOS** | Download Docker Desktop from https://www.docker.com/products/docker-desktop/ or `brew install --cask docker` | `docker --version` and `docker compose version` |

---

### WITHOUT DOCKER (Local Execution)

No Docker needed. You only need Python 3.11+ and Node.js 18+.

#### Step 1: Clone the repository

```bash
git clone https://github.com/sunkaramallikarjuna369/NewsAutomation.git
cd NewsAutomation
```

#### Step 2: Configure environment variables

**Linux/macOS:**
```bash
cp backend/.env.example backend/.env
nano backend/.env    # or use any editor
```

**Windows (CMD):**
```cmd
copy backend\.env.example backend\.env
notepad backend\.env
```

Edit the `.env` file and add your API keys. At minimum, add `GROQ_API_KEY` for AI features (free at https://console.groq.com). RSS feeds work without any API keys. See the [API Keys Setup section](#api-keys-setup-4w--1h-guide) below for how to get each key.

#### Step 3: Start the Backend (choose one method)

**Method 1: Using `pip` + `requirements.txt` (simplest, no extra tools)**

Linux/macOS:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Windows (CMD):
```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Method 2: Using `uv` (faster installation)**

Linux/macOS:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
cd backend
uv venv .venv
source .venv/bin/activate
uv pip install -e .
uvicorn app.main:app --reload --port 8000
```

Windows (PowerShell):
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
cd backend
uv venv .venv
.venv\Scripts\activate
uv pip install -e .
uvicorn app.main:app --reload --port 8000
```

Backend will be running at:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

#### Step 4: Start the Frontend (open a new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```

Frontend will be running at: http://localhost:5173

#### Step 5: Open the app

1. Open http://localhost:5173 in your browser
2. Register a new account
3. Enter a news topic on the dashboard (e.g. "India Budget 2026")
4. News aggregation works immediately (RSS feeds are free, no API key needed)
5. For AI script generation, go to Settings and add your Groq API key
6. Backend API docs are at http://localhost:8000/docs

#### To stop the servers

Press `Ctrl+C` in each terminal (backend and frontend).

---

### WITH DOCKER (Production-like)

Requires Docker and Docker Compose installed.

#### Step 1: Clone the repository

```bash
git clone https://github.com/sunkaramallikarjuna369/NewsAutomation.git
cd NewsAutomation
```

#### Step 2: Configure environment variables

```bash
cp backend/.env.example backend/.env
# Open backend/.env in any editor and add your API keys
```

#### Step 3: Build and start all services

```bash
docker compose up --build
```

This starts 3 containers:
- **Backend** (FastAPI): http://localhost:8000
- **Frontend** (React + Nginx): http://localhost:5173
- **Redis**: localhost:6379

#### Step 4: Open the app

1. Open http://localhost:5173 in your browser
2. Register and start using the platform

#### To stop Docker

```bash
docker compose down
```

#### To rebuild after code changes

```bash
docker compose up --build
```

---

### Verify It Works (both methods)

1. Open http://localhost:5173 in your browser
2. Register a new account (any email/password)
3. Enter a news topic on the dashboard (e.g. "India Budget 2026")
4. RSS feeds work without any API keys - you can test news aggregation immediately
5. For AI script generation, add your Groq API key in Settings (free at https://console.groq.com)
6. Check http://localhost:8000/docs for the full Swagger API documentation

## API Keys Setup (4W + 1H Guide)

You can configure API keys in `backend/.env` file OR from the Settings page in the app after logging in.

**Default free path**: The app works without any API keys! RSS feeds (unlimited) + Edge TTS (free voices) + MoviePy (free video) all work out of the box. API keys unlock additional features.

---

### 1. GROQ_API_KEY (Recommended - FREE)

| Question | Answer |
|----------|--------|
| **What** | API key for Groq cloud inference platform. Gives access to Llama 3.1 70B large language model. |
| **Why** | Powers the core AI features: generates news scripts from verified facts, runs fact-verification across sources, creates video titles/descriptions/tags. Without it, the app returns template/placeholder scripts. |
| **When** | Needed every time you click "Generate Script" or "Verify Facts" in the app. Used on every video creation workflow. |
| **Where** | Get it from https://console.groq.com |
| **How** | 1. Go to https://console.groq.com 2. Sign up with Google or email (free) 3. Click **API Keys** in the left sidebar 4. Click **Create API Key** 5. Copy the key (starts with `gsk_...`) 6. Paste into `backend/.env`: `GROQ_API_KEY=gsk_your_key_here` |

**Free tier**: 14,400 requests/day, 6,000 tokens/min. More than enough for daily use.

---

### 2. NEWSAPI_KEY (Optional - FREE)

| Question | Answer |
|----------|--------|
| **What** | API key for NewsAPI.org, a news aggregation service that indexes 80,000+ sources worldwide. |
| **Why** | Adds more news sources beyond RSS feeds. Provides structured article data (title, description, author, source) for better fact verification. RSS feeds already work without this, so it's optional. |
| **When** | Used when you click "Aggregate News" on the dashboard. The app first tries RSS feeds, then NewsAPI if configured, then GNews. |
| **Where** | Get it from https://newsapi.org/register |
| **How** | 1. Go to https://newsapi.org/register 2. Sign up with email 3. Your API key appears on the dashboard immediately 4. Copy the key 5. Paste into `backend/.env`: `NEWSAPI_KEY=your_key_here` |

**Free tier**: 100 requests/day. Each "Aggregate News" click = 1 request.

---

### 3. GNEWS_API_KEY (Optional - FREE)

| Question | Answer |
|----------|--------|
| **What** | API key for GNews.io, a Google News-powered article search API. |
| **Why** | Acts as a backup/additional news source. If NewsAPI is exhausted or unavailable, GNews provides articles from Google News index. Helps reach the target of 10-15 sources per topic. |
| **When** | Used during news aggregation as a fallback source. Only called if enabled in `.env`. |
| **Where** | Get it from https://gnews.io/register |
| **How** | 1. Go to https://gnews.io/register 2. Sign up with email 3. Go to Dashboard > API Key 4. Copy the key 5. Paste into `backend/.env`: `GNEWS_API_KEY=your_key_here` |

**Free tier**: 100 requests/day.

---

### 4. PEXELS_API_KEY (Optional - FREE)

| Question | Answer |
|----------|--------|
| **What** | API key for Pexels.com, a free stock photo and video library. |
| **Why** | Provides background images and stock footage for the generated news videos. Without it, videos use solid-color backgrounds. With it, the video engine searches for topic-relevant images automatically. |
| **When** | Used during the "Generate Video" step. The video assembly engine searches Pexels for images matching each script segment. |
| **Where** | Get it from https://www.pexels.com/api/ |
| **How** | 1. Go to https://www.pexels.com/api/ 2. Click **Get Started** and create an account 3. After login, go to https://www.pexels.com/api/new/ 4. Fill in app name (e.g. "NewsAI Studio") and description 5. Your API key will be displayed 6. Paste into `backend/.env`: `PEXELS_API_KEY=your_key_here` |

**Free tier**: 200 requests/hour, 20,000 requests/month. Very generous.

---

### 5. GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET (Optional - FREE)

| Question | Answer |
|----------|--------|
| **What** | OAuth 2.0 credentials from Google Cloud Console. Used for "Sign in with Google" button. |
| **Why** | Lets users log in with their Google account instead of email/password. Convenient for users who don't want to create a new account. The app works fine with email/password login without this. |
| **When** | Only needed if you want Google login on the login page. Not required for any other feature. |
| **Where** | Get from https://console.cloud.google.com/ > APIs & Services > Credentials |
| **How** | 1. Go to https://console.cloud.google.com/ 2. Create a new project (or select existing) 3. Go to **APIs & Services** > **Credentials** 4. Click **Create Credentials** > **OAuth 2.0 Client IDs** 5. Set Application type: **Web application** 6. Add Authorized redirect URI: `http://localhost:8000/api/auth/google-oauth/callback` 7. Copy the **Client ID** and **Client Secret** 8. Paste into `backend/.env`: `GOOGLE_CLIENT_ID=your_id` and `GOOGLE_CLIENT_SECRET=your_secret` |

**Free**: No cost. Google OAuth is free for any number of users.

---

### 6. YOUTUBE_CLIENT_ID & YOUTUBE_CLIENT_SECRET (Optional - FREE)

| Question | Answer |
|----------|--------|
| **What** | OAuth 2.0 credentials for YouTube Data API v3. Enables direct video upload to YouTube from the app. |
| **Why** | Lets you upload generated videos to your YouTube channel directly from the dashboard with auto-generated title, description, tags, and thumbnail. Without it, you can still download the MP4 and upload manually. |
| **When** | Used when you click "Upload to YouTube" on a completed video. Also used for the initial YouTube channel connection in Settings. |
| **Where** | Get from https://console.cloud.google.com/ > APIs & Services |
| **How** | 1. Go to https://console.cloud.google.com/ 2. Select your project (or create one) 3. Go to **APIs & Services** > **Library** 4. Search for **YouTube Data API v3** and click **Enable** 5. Go to **APIs & Services** > **Credentials** 6. Click **Create Credentials** > **OAuth 2.0 Client IDs** 7. Set Application type: **Web application** 8. Add Authorized redirect URI: `http://localhost:8000/api/youtube/callback` 9. Copy the **Client ID** and **Client Secret** 10. Paste into `backend/.env`: `YOUTUBE_CLIENT_ID=your_id` and `YOUTUBE_CLIENT_SECRET=your_secret` |

**Free tier**: 10,000 quota units/day (1 upload = ~1,600 units, so ~6 uploads/day).

---

### 7. ELEVENLABS_API_KEY (Optional - PAID)

| Question | Answer |
|----------|--------|
| **What** | API key for ElevenLabs, a premium AI voice synthesis and voice cloning platform. |
| **Why** | Provides higher-quality voice cloning than the free Edge TTS. If you want your generated videos to sound like a specific person with high fidelity, ElevenLabs is the premium option. The app defaults to Edge TTS (free, good quality) without this key. |
| **When** | Used during voiceover generation only if configured. The app checks: if ElevenLabs key exists, use it; otherwise, use free Edge TTS. |
| **Where** | Get from https://elevenlabs.io/ |
| **How** | 1. Go to https://elevenlabs.io/ 2. Sign up for an account 3. Go to Profile (bottom-left) > API Keys 4. Copy the API key 5. Paste into `backend/.env`: `ELEVENLABS_API_KEY=your_key_here` |

**Free tier**: ~10,000 characters/month. Paid plans start at $5/month for 30,000 characters.

---

### 8. DID_API_KEY (Optional - PAID)

| Question | Answer |
|----------|--------|
| **What** | API key for D-ID, a cloud-based talking-head avatar generation service. |
| **Why** | Creates realistic talking-head avatar videos from a single photo + audio. Alternative to the local SadTalker (which requires GPU). Without either, the app generates videos without an avatar overlay. |
| **When** | Used during avatar video generation only if configured and `GPU_ENABLED=false`. If you have a GPU, the app uses free SadTalker instead. |
| **Where** | Get from https://www.d-id.com/ |
| **How** | 1. Go to https://www.d-id.com/ 2. Sign up for an account 3. Go to Settings > API Keys 4. Generate and copy the key 5. Paste into `backend/.env`: `DID_API_KEY=your_key_here` |

**Free tier**: 20 videos free, then paid plans start at $5.90/month.

---

### Complete `.env` File Reference

Here is every variable in `backend/.env` with explanations:

```bash
# ============================================================
# DATABASE (no setup needed - SQLite creates automatically)
# ============================================================
DATABASE_URL=sqlite+aiosqlite:///./newsai.db

# ============================================================
# AUTHENTICATION (change SECRET_KEY for production!)
# ============================================================
SECRET_KEY=your-secret-key-change-this
# Generate a secure key: python -c "import secrets; print(secrets.token_hex(32))"
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
# 1440 minutes = 24 hours login session

# ============================================================
# AI / LLM (Groq - recommended, free)
# ============================================================
GROQ_API_KEY=
# Get from: https://console.groq.com

# ============================================================
# NEWS SOURCES (optional - RSS feeds work without these)
# ============================================================
NEWSAPI_KEY=
# Get from: https://newsapi.org/register
GNEWS_API_KEY=
# Get from: https://gnews.io/register

# ============================================================
# STOCK IMAGES (optional)
# ============================================================
PEXELS_API_KEY=
# Get from: https://www.pexels.com/api/

# ============================================================
# GOOGLE OAUTH (optional - for Google login)
# ============================================================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google-oauth/callback
# Setup: https://console.cloud.google.com > APIs & Services > Credentials

# ============================================================
# YOUTUBE UPLOAD (optional)
# ============================================================
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=http://localhost:8000/api/youtube/callback
# Setup: Enable YouTube Data API v3 at https://console.cloud.google.com

# ============================================================
# REDIS (optional - for caching/background jobs)
# ============================================================
REDIS_URL=redis://localhost:6379/0
# Only needed if running Redis (Docker setup includes it)

# ============================================================
# PREMIUM APIS (optional - paid alternatives)
# ============================================================
ELEVENLABS_API_KEY=
# Premium voice cloning: https://elevenlabs.io
DID_API_KEY=
# Cloud avatar generation: https://www.d-id.com

# ============================================================
# APPLICATION SETTINGS (defaults are fine)
# ============================================================
UPLOAD_DIR=./app/static/uploads
# Where uploaded files (voice samples, avatars, videos) are stored
GPU_ENABLED=false
# Set to "true" if you have an NVIDIA GPU for SadTalker avatar generation
FRONTEND_URL=http://localhost:5173
# Frontend URL for CORS and redirects
```

---

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for the interactive Swagger UI.

### Core Endpoints

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/news/aggregate` - Aggregate news from sources
- `POST /api/news/verify` - Verify facts across sources
- `POST /api/script/generate` - Generate video script
- `POST /api/voice/generate` - Generate voiceover
- `POST /api/video/generate` - Generate full video
- `POST /api/youtube/upload` - Upload to YouTube

## Project Structure

```
NewsAutomation/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, database, security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── routers/       # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Helpers
│   │   └── main.py        # FastAPI app
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout, shared components
│   │   ├── pages/         # Login, Dashboard, Create, Videos, Profile, Settings
│   │   ├── context/       # Auth context
│   │   ├── lib/           # API client
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Workflow

1. **Enter topic** on dashboard → aggregates news from 10-15 sources
2. **Review verification** → see verified facts, excluded claims, agreement scores
3. **Edit script** → AI-generated 8-segment script with voice markup
4. **Generate video** → voiceover + infographics + avatar assembled into MP4
5. **Upload to YouTube** → with auto-generated title, description, tags
