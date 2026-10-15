# NammaTrip AI — Your Karnataka Journey, Intelligently Planned

AI travel planner for Karnataka (Kannada Digital Innovation Hackathon 2026).
Tell it where you start, how many days, your budget and interests; it builds a
day-by-day itinerary with an honest rupee estimate and a route map, in English or Kannada.

## What works today
- Homepage, planner form with validation, English/Kannada switcher
- Itinerary generation: code picks and orders stops, budget is calculated in code
- Works with no API key (demo mode, curated data); with a key the LLM writes the text
- Results dashboard: overview, Leaflet/OpenStreetMap route, day-by-day, budget, tips
- Copy itinerary, print / save as PDF, error + retry states
- 79 backend tests

## Not built yet
Chat-style itinerary refinement, voice input, free-text Kannada request parsing,
saved trips, deployment. Real routed distances (current distances are labelled estimates).

## Run on Windows (PowerShell)
Install once: Node.js LTS (https://nodejs.org), Python 3.11+ (https://python.org, tick "Add to PATH"), Git (https://git-scm.com).

**Terminal 1: backend**
```powershell
cd nammatrip-ai\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```
If activation is blocked: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then retry.
Check http://127.0.0.1:8000/api/health and the API docs at http://127.0.0.1:8000/docs

**Terminal 2: frontend**
```powershell
cd nammatrip-ai\frontend
npm install
npm run dev
```
Open http://localhost:5173

**Run tests**
```powershell
cd nammatrip-ai\backend
.\.venv\Scripts\Activate.ps1
pytest
```

## Turn on the AI writer (optional)
Edit `backend\.env` (never share or commit it): set `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`
(and `LLM_BASE_URL` for `openai_compatible`). Restart the backend. `/api/health` should show `"mode": "live"`.
If the AI fails or returns invalid output, the app falls back to demo mode automatically.

## Add real photos (optional, once)
```powershell
cd nammatrip-ai
python scripts\fetch_images.py
```
Downloads openly licensed Wikimedia Commons photos and writes credits to ATTRIBUTIONS.md.

## API
- `GET /api/health` · `GET /api/destinations` · `GET /api/destinations/{id}`
- `POST /api/trips/generate` — body: `start_city, days, budget_inr, travellers, interests[], style, transport, accommodation, language`

All costs and travel times are planning estimates, not live prices.
Kannada text is a first draft and should be reviewed by a native speaker.
