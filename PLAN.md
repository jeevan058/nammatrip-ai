# NammaTrip AI — Build Plan

Deadline: Oct 25, 2026, 10:00 PM IST. Target: submit by Oct 24 evening, leaving Oct 25 as emergency buffer.

## Architecture

```
nammatrip-ai/
  frontend/   React + TypeScript + Vite + Tailwind, Leaflet/OSM, lucide-react
  backend/    FastAPI + Pydantic, SQLite (optional, P2)
    app/
      main.py            routes, CORS
      schemas.py         request/response models
      data/destinations.json   curated seed data (separate from logic)
      services/
        retrieval.py     filter + rank destinations
        llm.py           provider-agnostic LLM interface
        planner.py       pipeline orchestration
        budget.py        deterministic budget math
        validator.py     consistency checks
        fallback.py      deterministic itinerary (no LLM)
    tests/
  README.md, .env.example (x2)
```

Pipeline: validate input -> retrieve + rank destinations -> LLM writes itinerary (JSON only) -> schema validation -> budget computed in code -> consistency checks -> JSON to frontend. On any LLM failure: deterministic fallback itinerary from curated data.

## Priorities

P0: homepage, trip form, itinerary generation (with fallback), budget calc, destination details, EN/KN UI, backend integration, error handling, deployable.
P1: Leaflet map + route, itinerary refinement chat, better ranking, PDF export, visual polish.
P2: voice input, SQLite trip history.

## API keys

- LLM key (1 required for live AI): provider TBD, verify free tier in Phase 2. Kept in backend/.env only.
- None needed: OpenStreetMap tiles, Leaflet, browser speech recognition, demo/fallback mode.
- Optional: public OSRM demo server for real routes (rate-limited, fall back to straight-line labelled as estimate).

## Milestones

- Oct 12-13: plan, scaffold, both servers running
- Oct 14-15: destination dataset, schemas, budget module + tests, /api/health, /api/destinations
- Oct 16-17: LLM pipeline, validation, fallback, EN/KN test
- Oct 18-19: homepage, form, results dashboard
- Oct 20: map, refine endpoint + assistant UI, i18n pass
- Oct 21: PDF export, polish, responsive checks
- Oct 22: deploy, public URL check
- Oct 23: README, screenshots, pitch, demo script, voice input if stable
- Oct 24: bug bash, submit
- Oct 25: buffer only

## Risks

- Kannada LLM quality: test early with real prompts.
- Browser Kannada speech recognition is unreliable: text input is the guaranteed path.
- Free-tier backend cold starts: warm up before demo; demo mode as backup.
- Image URLs breaking: bundle local images, fallbacks for the rest.
- Unverified coordinates/prices in seed data: mark as estimates, verify coordinates before shipping.

## Demo flow

Home -> Kannada request typed in -> form auto-filled -> itinerary + budget + map -> "make it cheaper" refinement -> PDF export -> switch UI to Kannada.
