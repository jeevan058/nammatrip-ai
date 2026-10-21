
"""Trip planning pipeline.

validate request -> resolve start -> select + order stops -> assign days
-> LLM writes text (or deterministic fallback) -> validate -> legs + budget in code
-> consistency checks -> TripPlan
"""

import json
import logging

from app.schemas import Destination, LLMItinerary, TravelLeg, TripPlan, TripRequest
from app.services.budget import DISCLAIMER, calculate_budget, estimate_road_km, haversine_km
from app.services.cities import resolve_trip_start
from app.services.destinations import load_destinations
from app.services.fallback import build_fallback_itinerary
from app.services.llm import LLMError, LLMProvider, LLMUnavailable, get_provider
from app.services.retrieval import Stop, assign_days, select_stops
from app.services.texts import t
from app.services.validator import InvalidItinerary, validate_llm_itinerary

log = logging.getLogger("nammatrip.planner")

AVERAGE_SPEED_KMH = 45.0
LONG_LEG_KM = 350.0
MIN_LEG_KM = 5.0
MAX_LLM_ATTEMPTS = 2


class NoDestinationsFound(Exception):
    """Nothing in the dataset matches the traveller's interests."""


SYSTEM_PROMPT = """You are the writing assistant of NammaTrip AI, a Karnataka travel planner.
The route, the days and the stops are already decided by the application. Your job is only to
write helpful, specific, friendly text for them.

Rules:
- Reply with ONE JSON object and nothing else.
- Use ONLY the destination ids given for each day. Never add or rename destinations.
- Do NOT state prices, ticket costs, opening hours, travel times or distances. The application
  handles those. Do not claim anything is currently open, available or booked.
- Use only facts from the provided destination data plus general, well-known cultural context.
- Write in the requested output language. If it is Kannada, write in Kannada script.
- Keep every description under 280 characters.

JSON shape:
{"summary": str, "days": [{"day": int, "theme": str, "destination_ids": [str],
 "activities": [{"slot": "morning"|"afternoon"|"evening", "destination_id": str,
 "title": str, "description": str}], "food": [str], "stay_note": str|null}], "tips": [str]}
Each day needs a morning, afternoon and evening activity."""


def _build_user_prompt(
    request: TripRequest,
    stops: list[Stop],
    skeleton: dict[int, list[str]],
) -> str:
    by_id = {s.destination.id: s.destination for s in stops}
    payload = {
        "traveller": {
            "start_city": request.start_city,
            "travellers": request.travellers,
            "interests": request.interests,
            "style": request.style,
            "accommodation": request.accommodation,
            "diet": request.diet,
            "output_language": "Kannada" if request.language == "kn" else "English",
        },
        "days": [
            {"day": day, "destination_ids": ids}
            for day, ids in sorted(skeleton.items())
        ],
        "destinations": {
            dest_id: {
                "name": d.name,
                "region": d.region,
                "description": d.description,
                "highlights": d.highlights,
                "food": d.food,
                "best_season": d.best_season,
                "practical_notes": d.practical_notes,
            }
            for dest_id, d in by_id.items()
        },
    }
    return json.dumps(payload, ensure_ascii=False)


def _generate_with_llm(
    provider: LLMProvider,
    request: TripRequest,
    stops: list[Stop],
    skeleton: dict[int, list[str]],
) -> LLMItinerary:
    user = _build_user_prompt(request, stops, skeleton)
    last_error = "unknown error"

    for attempt in range(1, MAX_LLM_ATTEMPTS + 1):
        prompt = user
        if attempt > 1:
            prompt += (
                f"\n\nYour previous reply was rejected: {last_error}. "
                "Return corrected JSON only."
            )

        raw = provider.complete_json(SYSTEM_PROMPT, prompt)

        try:
            return validate_llm_itinerary(raw, skeleton)
        except InvalidItinerary as error:
            last_error = str(error)
            log.warning(
                "LLM output rejected (attempt %s): %s",
                attempt,
                last_error,
            )

    raise InvalidItinerary(last_error)


def _build_legs(
    request: TripRequest,
    start,
    stops: list[Stop],
    skeleton: dict[int, list[str]],
) -> list[TravelLeg]:
    first_day = {}

    for day, ids in skeleton.items():
        for dest_id in ids:
            first_day.setdefault(dest_id, day)

    legs: list[TravelLeg] = []
    prev_name, prev_id, prev_lat, prev_lng = (
        start.name,
        None,
        start.lat,
        start.lng,
    )

    for stop in stops:
        d = stop.destination
        legs.append(
            _leg(
                first_day[d.id],
                prev_name,
                d.name,
                prev_id,
                d.id,
                prev_lat,
                prev_lng,
                d.lat,
                d.lng,
            )
        )
        prev_name, prev_id, prev_lat, prev_lng = (
            d.name,
            d.id,
            d.lat,
            d.lng,
        )

    legs.append(
        _leg(
            max(skeleton),
            prev_name,
            start.name,
            prev_id,
            None,
            prev_lat,
            prev_lng,
            start.lat,
            start.lng,
        )
    )

    # A leg under 5 km (for example when the start city is itself a stop)
    # is not a journey.
    return [leg for leg in legs if leg.est_road_km >= MIN_LEG_KM]


def _leg(
    day,
    from_name,
    to_name,
    from_id,
    to_id,
    lat1,
    lng1,
    lat2,
    lng2,
) -> TravelLeg:
    straight = haversine_km(lat1, lng1, lat2, lng2)
    road = estimate_road_km(lat1, lng1, lat2, lng2)

    return TravelLeg(
        day=day,
        from_name=from_name,
        to_name=to_name,
        from_id=from_id,
        to_id=to_id,
        straight_km=round(straight, 1),
        est_road_km=round(road, 1),
        approx_hours=round(road / AVERAGE_SPEED_KMH, 1),
    )


def _consistency_warnings(
    request: TripRequest,
    plan_days: int,
    legs: list[TravelLeg],
    stops: list[Stop],
    budget,
    assumed_start: bool,
) -> list[str]:
    lang = request.language
    warnings: list[str] = []

    if assumed_start:
        warnings.append(
            t(lang, "warn_assumed_start", city=request.start_city)
        )

    if plan_days < request.days:
        warnings.append(
            t(
                lang,
                "warn_fewer_days",
                planned=plan_days,
                requested=request.days,
            )
        )

    for leg in legs:
        if leg.est_road_km > LONG_LEG_KM:
            warnings.append(
                t(
                    lang,
                    "warn_long_leg",
                    a=leg.from_name,
                    b=leg.to_name,
                    km=round(leg.est_road_km),
                )
            )

    if not budget.within_budget:
        warnings.append(
            t(lang, "warn_over_budget", over=f"{-budget.difference_inr:,}")
        )

        free = [
            (
                s.destination.name_kn
                if lang == "kn"
                else s.destination.name
            )
            for s in stops
            if s.destination.activity_cost_inr.min == 0
        ]

        if free:
            warnings.append(
                t(lang, "warn_free", names=", ".join(free))
            )

    return warnings


def generate_trip(
    request: TripRequest,
    provider: LLMProvider | None = None,
) -> TripPlan:
    # Use the selected place's coordinates when provided by the frontend.
    # Otherwise, resolve the starting location using the existing city dataset.
    start = resolve_trip_start(request)

    stops = select_stops(request, start, load_destinations())
    if not stops:
        raise NoDestinationsFound(
            "No destinations match the selected interests."
        )

    skeleton = assign_days(stops)
    plan_days = len(skeleton)

    source = "llm"
    fallback_reason: str | None = None
    itinerary: LLMItinerary | None = None

    try:
        active = provider or get_provider()
        itinerary = _generate_with_llm(
            active,
            request,
            stops,
            skeleton,
        )
    except LLMUnavailable as error:
        source, fallback_reason = "fallback", str(error)
    except (LLMError, InvalidItinerary) as error:
        log.warning(
            "Falling back to deterministic itinerary: %s",
            error,
        )
        source, fallback_reason = "fallback", str(error)

    if itinerary is None:
        itinerary = build_fallback_itinerary(request, stops, start)

    legs = _build_legs(request, start, stops, skeleton)
    route_km = sum(leg.est_road_km for leg in legs)

    activity_per_person = sum(
        (
            s.destination.activity_cost_inr.min
            + s.destination.activity_cost_inr.max
        )
        // 2
        for s in stops
    )

    budget = calculate_budget(
        days=plan_days,
        travellers=request.travellers,
        budget_inr=request.budget_inr,
        transport=request.transport,
        accommodation=request.accommodation,
        route_km=route_km,
        activity_cost_per_person_inr=activity_per_person,
    )

    warnings = _consistency_warnings(
        request,
        plan_days,
        legs,
        stops,
        budget,
        start.assumed,
    )

    return TripPlan(
        request=request,
        start=start,
        summary=itinerary.summary,
        days=itinerary.days,
        stops=[s.destination for s in stops],
        legs=legs,
        budget=budget,
        tips=itinerary.tips,
        warnings=warnings,
        source=source,
        fallback_reason=fallback_reason,
        estimates_note=DISCLAIMER,
    )
