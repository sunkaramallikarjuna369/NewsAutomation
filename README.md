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

| Tool | Install Command | Verify |
|------|----------------|--------|
| **Python 3.11+** | [python.org/downloads](https://www.python.org/downloads/) or `sudo apt install python3 python3-pip python3-venv` | `python3 --version` |
| **Node.js 18+** | [nodejs.org](https://nodejs.org/) or `sudo apt install nodejs npm` | `node --version` |
| **FFmpeg** | `sudo apt install ffmpeg` (Ubuntu/Debian) or `brew install ffmpeg` (macOS) | `ffmpeg -version` |
| **Git** | `sudo apt install git` | `git --version` |

**Optional (only if using Docker):**

| Tool | Install Command | Verify |
|------|----------------|--------|
| **Docker** | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) | `docker --version` |
| **Docker Compose** | Included with Docker Desktop, or `sudo apt install docker-compose-plugin` | `docker compose version` |

---

### WITHOUT DOCKER (Local Execution)

No Docker needed. You only need Python 3.11+ and Node.js 18+.

#### Step 1: Clone the repository

```bash
git clone https://github.com/sunkaramallikarjuna369/NewsAutomation.git
cd NewsAutomation
```

#### Step 2: Configure environment variables

```bash
cp backend/.env.example backend/.env
# Open backend/.env in any editor and add your API keys
# At minimum, add GROQ_API_KEY for AI features (free at https://console.groq.com)
# RSS feeds work without any API keys
```

#### Step 3: Start the Backend (choose one method)

**Method 1: Using `pip` + `requirements.txt` (simplest, no extra tools)**

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

**Method 2: Using `uv` (faster installation)**

```bash
# Install uv first (one-time)
curl -LsSf https://astral.sh/uv/install.sh | sh

cd backend

# Create virtual environment and install
uv venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows
uv pip install -e .

# Start the backend server
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

## API Keys Setup (Step-by-Step)

You can configure API keys either in `backend/.env` file OR from the Settings page in the app after logging in.

**Default free path**: The app works without any API keys! RSS feeds (unlimited) + Edge TTS (free voices) + MoviePy (free video) all work out of the box. API keys unlock additional features.

---

### 1. Groq API Key (Recommended - FREE)

**What it does**: Powers AI script generation and fact verification using Llama 3.1 70B.

**How to get it**:
1. Go to https://console.groq.com
2. Sign up with Google or email (free)
3. Click **API Keys** in the left sidebar
4. Click **Create API Key**
5. Copy the key (starts with `gsk_...`)

**Add to `.env`**:
```
GROQ_API_KEY=gsk_your_key_here
```
**Free tier**: 14,400 requests/day, 6,000 tokens/min

---

### 2. NewsAPI Key (Optional - FREE)

**What it does**: Fetches news articles from 80,000+ sources worldwide.

**How to get it**:
1. Go to https://newsapi.org/register
2. Sign up with email
3. Your API key will be shown on the dashboard
4. Copy the key

**Add to `.env`**:
```
NEWSAPI_KEY=your_key_here
```
**Free tier**: 100 requests/day (works for development). Note: RSS feeds already provide news without this key.

---

### 3. GNews API Key (Optional - FREE)

**What it does**: Backup news source with Google News data.

**How to get it**:
1. Go to https://gnews.io/register
2. Sign up with email
3. Go to Dashboard > API Key
4. Copy the key

**Add to `.env`**:
```
GNEWS_API_KEY=your_key_here
```
**Free tier**: 100 requests/day

---

### 4. Pexels API Key (Optional - FREE)

**What it does**: Provides stock images and videos for video backgrounds.

**How to get it**:
1. Go to https://www.pexels.com/api/
2. Click **Get Started** and create an account
3. After login, go to https://www.pexels.com/api/new/
4. Fill in the form (app name, description)
5. Your API key will be displayed

**Add to `.env`**:
```
PEXELS_API_KEY=your_key_here
```
**Free tier**: 200 requests/hour, 20,000 requests/month

---

### 5. Google OAuth (Optional - For Google Login)

**What it does**: Allows users to log in with their Google account.

**How to get it**:
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Set Application type: **Web application**
6. Add Authorized redirect URI: `http://localhost:8000/api/auth/google-oauth/callback`
7. Copy the **Client ID** and **Client Secret**

**Add to `.env`**:
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google-oauth/callback
```

---

### 6. YouTube API (Optional - For Video Upload)

**What it does**: Upload generated videos directly to your YouTube channel.

**How to get it**:
1. Go to https://console.cloud.google.com/
2. Select your project (or create one)
3. Go to **APIs & Services** > **Library**
4. Search for **YouTube Data API v3** and click **Enable**
5. Go to **APIs & Services** > **Credentials**
6. Click **Create Credentials** > **OAuth 2.0 Client IDs**
7. Set Application type: **Web application**
8. Add Authorized redirect URI: `http://localhost:8000/api/youtube/callback`
9. Copy the **Client ID** and **Client Secret**

**Add to `.env`**:
```
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:8000/api/youtube/callback
```
**Free tier**: 10,000 quota units/day (1 upload = ~1,600 units, so ~6 uploads/day)

---

### 7. ElevenLabs API Key (Optional - PAID)

**What it does**: Premium voice cloning with high-quality AI voices (alternative to free Edge TTS).

**How to get it**:
1. Go to https://elevenlabs.io/
2. Sign up for an account
3. Go to Profile > API Keys
4. Copy the API key

**Add to `.env`**:
```
ELEVENLABS_API_KEY=your_key_here
```
**Free tier**: Limited characters/month. Paid plans start at $5/month.

---

### 8. D-ID API Key (Optional - PAID)

**What it does**: Cloud-based avatar/talking-head generation (alternative to local SadTalker).

**How to get it**:
1. Go to https://www.d-id.com/
2. Sign up for an account
3. Go to Settings > API Keys
4. Generate and copy the key

**Add to `.env`**:
```
DID_API_KEY=your_key_here
```
**Free tier**: 20 videos free, then paid.

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
