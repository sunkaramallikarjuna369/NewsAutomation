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

- FFmpeg: `sudo apt install ffmpeg` (Ubuntu/Debian) or `brew install ffmpeg` (macOS)

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
