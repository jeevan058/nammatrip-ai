"""NammaTrip AI backend entry point.

Run locally:  uvicorn app.main:app --reload --port 8000
API docs:     http://127.0.0.1:8000/docs
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import Destination, Interest, TripPlan, TripRequest
from app.services.destinations import get_destination, load_destinations, search_destinations
from app.services.planner import NoDestinationsFound, generate_trip

load_dotenv()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Fails fast if destinations.json has a bad record.
    load_destinations()
    yield


app = FastAPI(
    title="NammaTrip AI API",
    description="Karnataka travel planning API for the Kannada Digital Innovation Hackathon 2026.",
    version="0.1.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health() -> dict:
    llm_provider = os.getenv("LLM_PROVIDER", "none").lower()
    return {
        "status": "ok",
        "destinations_loaded": len(load_destinations()),
        "llm_provider": llm_provider,
        "mode": "demo" if llm_provider == "none" else "live",
    }


@app.get("/api/destinations", response_model=list[Destination])
def list_destinations(
    interest: Interest | None = Query(default=None, description="Filter by interest category"),
    q: str | None = Query(default=None, max_length=60, description="Search by name or region"),
) -> list[Destination]:
    return search_destinations(interest=interest, query=q)


@app.get("/api/destinations/{destination_id}", response_model=Destination)
def destination_detail(destination_id: str) -> Destination:
    destination = get_destination(destination_id)
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination not found")
    return destination


@app.post("/api/trips/generate", response_model=TripPlan)
def generate(request: TripRequest) -> TripPlan:
    """Build a personalised itinerary. Works without an LLM key (demo mode)."""
    try:
        return generate_trip(request)
    except NoDestinationsFound as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:  # last-resort guard so the browser always gets clean JSON
        logging.getLogger("nammatrip").exception("Trip generation failed")
        raise HTTPException(status_code=500, detail="Could not build the itinerary. Please try again.") from error
