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

## Run Locally (Recommended for Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- FFmpeg (`sudo apt install ffmpeg` on Ubuntu/Debian, `brew install ffmpeg` on macOS)

### Option A: Using `uv` (fastest)

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# --- Backend ---
cd backend
cp .env.example .env
# Edit .env with your API keys (Groq key recommended for AI features)

uv venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

uv pip install -e .
uvicorn app.main:app --reload --port 8000
# Backend running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

```bash
# --- Frontend (in a new terminal) ---
cd frontend
npm install
npm run dev
# Frontend running at http://localhost:5173
```

### Option B: Using `pip` + `requirements.txt`

```bash
# --- Backend ---
cd backend
cp .env.example .env
# Edit .env with your API keys

python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```bash
# --- Frontend (in a new terminal) ---
cd frontend
npm install
npm run dev
```

### Option C: Docker Compose (production-like)

```bash
# Copy and configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Start all services (backend + frontend + Redis)
docker compose up --build

# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# Redis:    localhost:6379
```

### Verify It Works

1. Open `http://localhost:5173` in your browser
2. Register a new account
3. Enter a news topic on the dashboard (e.g. "India Budget 2026")
4. RSS feeds work without any API keys — you can test aggregation immediately
5. For AI script generation, add your Groq API key in Settings (free at https://console.groq.com)
6. Check `http://localhost:8000/docs` for the full Swagger API docs

## API Keys Setup

Configure these in the Settings page or in `backend/.env`:

| Service | Required | Free Tier | Purpose |
|---------|----------|-----------|---------|
| **Groq** | Recommended | 14,400 req/day | AI script generation & fact verification |
| **NewsAPI** | Optional | 100 req/day | Additional news sources |
| **GNews** | Optional | 100 req/day | Backup news source |
| **Pexels** | Optional | Generous | Stock images for videos |
| **YouTube** | For upload | 10,000 quota/day | Video publishing |

**Default free path**: RSS feeds (unlimited) + Edge TTS (free) + MoviePy (free). No API keys needed for basic functionality.

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
