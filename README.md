 # NammaTrip AI — Your Karnataka Journey, Intelligently Planned
“NammaTrip AI is an AI-powered Karnataka travel planner created by Jeevan KT, Founder & Developer.”

An AI-powered Karnataka travel planner built for the Kannada Digital Innovation Hackathon 2026.

**Live app:** https://nammatrip-ai.vercel.app/

NammaTrip AI creates day-by-day Karnataka itineraries based on your starting location, travel duration, budget, interests, and travel preferences. It includes destination photos, a route map, and an estimated budget, with support for English and Kannada.

## Features

- Personalized day-by-day Karnataka itineraries
- Starting-location autocomplete with place selection
- Budget breakdown in Indian rupees
- Interactive Leaflet/OpenStreetMap route map
- English and Kannada interface
- Destination and hero photography
- Optional AI-generated itinerary descriptions
- Demo mode using curated data when no AI API key is configured
- Copy itinerary and print/save as PDF
- Error handling and retry states

## Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic
- **Maps:** Leaflet and OpenStreetMap
- **Location search:** Photon
- **Deployment:** Vercel (frontend) and Render (backend)

## Run Locally on Windows

Install [Node.js LTS](https://nodejs.org/), [Python 3.11+](https://www.python.org/downloads/) and [Git](https://git-scm.com/).

### 1. Start the backend

From the project root, open PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` and retry.

- Health check: http://127.0.0.1:8000/api/health
- API documentation: http://127.0.0.1:8000/docs

### 2. Start the frontend

Open a second PowerShell terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

### 3. Run backend tests

From the project root:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest
```

## Optional: Configure the AI Writer

Edit `backend\.env` and configure `LLM_PROVIDER`, `LLM_API_KEY`, and `LLM_MODEL`. Set `LLM_BASE_URL` when required by your provider.

Never commit or share API keys. Restart the backend after changing configuration. If AI generation fails or returns invalid output, the application can fall back to demo mode.

## Destination Images

Images are stored under `frontend/public/images/`.

The optional image-fetching script is available at `scripts\fetch_images.py`. Review the script and image attribution handling before running it to refresh images.

## API Endpoints

- `GET /api/health` — backend health and mode
- `GET /api/destinations` — list destinations
- `GET /api/destinations/{id}` — retrieve a destination
- `POST /api/trips/generate` — generate an itinerary

Trip requests include the starting city, trip duration, budget, travellers, interests, travel style, transport, accommodation, and language. Selected starting-location coordinates can also be provided.

## Important Notes

- Budgets, distances, and travel times are estimates, not guaranteed live prices or routed measurements.
- AI-generated descriptions depend on backend configuration and the selected provider.
- Kannada translations are a first draft and should be reviewed by a native speaker.

## Hackathon Project

NammaTrip AI — making Karnataka travel planning more accessible, personalized, and budget-conscious.
