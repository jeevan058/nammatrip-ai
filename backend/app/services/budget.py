"""Deterministic budget calculator.

All money maths happens here, in plain Python, never inside the language model.
The rates below are rough planning assumptions for Karnataka, NOT live prices.
They are returned to the user as estimates and can be tuned in one place.
"""

import math

from app.schemas import BudgetBreakdown, BudgetLine, BudgetSuggestion

# --- Planning assumptions (INR). Estimates only. ---------------------------
ROAD_FACTOR = 1.3  # straight-line distance -> rough road distance

# Cost per km. Bus/train are per person; car/two-wheeler are per vehicle.
TRANSPORT_RATE_PER_KM = {"bus": 2.0, "train": 1.0, "car": 13.0, "two-wheeler": 3.0}
VEHICLE_CAPACITY = {"bus": 1, "train": 1, "car": 4, "two-wheeler": 2}

ROOM_NIGHT = {"budget": 900, "midrange": 2200, "premium": 5500}  # per room per night
GUESTS_PER_ROOM = 2
FOOD_PER_PERSON_DAY = {"budget": 350, "midrange": 650, "premium": 1200}
LOCAL_TRANSPORT_PER_PERSON_DAY = {"budget": 120, "midrange": 200, "premium": 350}
BUFFER_RATE = 0.10

DISCLAIMER = (
    "These are planning estimates based on typical ranges, not live prices or "
    "guaranteed costs. Check current fares, room rates and ticket prices before booking."
)


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Straight-line distance between two points in km."""
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    d_lat = p2 - p1
    d_lng = math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(d_lng / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def estimate_road_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Rough road distance (straight line x 1.3). An estimate, not a routed distance."""
    return haversine_km(lat1, lng1, lat2, lng2) * ROAD_FACTOR


def _transport_cost(transport: str, travellers: int, route_km: float) -> int:
    vehicles_or_people = math.ceil(travellers / VEHICLE_CAPACITY[transport])
    return round(route_km * TRANSPORT_RATE_PER_KM[transport] * vehicles_or_people)


def _core_lines(
    *,
    days: int,
    travellers: int,
    transport: str,
    accommodation: str,
    route_km: float,
    activity_cost_per_person_inr: int,
) -> list[BudgetLine]:
    nights = max(days - 1, 0)
    rooms = math.ceil(travellers / GUESTS_PER_ROOM)

    return [
        BudgetLine(
            category="transportation",
            amount_inr=_transport_cost(transport, travellers, route_km),
            basis=f"about {round(route_km)} km of round-trip road travel by {transport} (estimated distance)",
        ),
        BudgetLine(
            category="accommodation",
            amount_inr=nights * rooms * ROOM_NIGHT[accommodation],
            basis=f"{nights} night(s) x {rooms} room(s) at a {accommodation} rate",
        ),
        BudgetLine(
            category="food",
            amount_inr=days * travellers * FOOD_PER_PERSON_DAY[accommodation],
            basis=f"{days} day(s) x {travellers} traveller(s) at a {accommodation} daily food estimate",
        ),
        BudgetLine(
            category="activities",
            amount_inr=travellers * activity_cost_per_person_inr,
            basis=f"{travellers} traveller(s) x typical entry and activity cost per person",
        ),
        BudgetLine(
            category="local_transport",
            amount_inr=days * travellers * LOCAL_TRANSPORT_PER_PERSON_DAY[accommodation],
            basis=f"{days} day(s) of autos, cabs or local buses for {travellers} traveller(s)",
        ),
    ]


def _total_with_buffer(core: list[BudgetLine]) -> tuple[list[BudgetLine], int]:
    subtotal = sum(line.amount_inr for line in core)
    buffer_amount = round(subtotal * BUFFER_RATE)
    lines = core + [
        BudgetLine(
            category="buffer",
            amount_inr=buffer_amount,
            basis=f"{int(BUFFER_RATE * 100)}% emergency buffer on the subtotal",
        )
    ]
    return lines, subtotal + buffer_amount


def calculate_budget(
    *,
    days: int,
    travellers: int,
    budget_inr: int,
    transport: str,
    accommodation: str,
    route_km: float,
    activity_cost_per_person_inr: int,
) -> BudgetBreakdown:
    """Build a transparent budget breakdown and compare it with the user's budget.

    route_km is the total estimated road distance for the whole trip, including
    the return journey. activity_cost_per_person_inr is the summed typical
    entry/activity cost per person for the chosen stops.
    """
    if days < 1 or travellers < 1:
        raise ValueError("days and travellers must be at least 1")
    if route_km < 0 or activity_cost_per_person_inr < 0:
        raise ValueError("route_km and activity cost cannot be negative")
    if transport not in TRANSPORT_RATE_PER_KM:
        raise ValueError(f"unknown transport: {transport}")
    if accommodation not in ROOM_NIGHT:
        raise ValueError(f"unknown accommodation: {accommodation}")

    params = dict(
        days=days,
        travellers=travellers,
        transport=transport,
        accommodation=accommodation,
        route_km=route_km,
        activity_cost_per_person_inr=activity_cost_per_person_inr,
    )
    lines, total = _total_with_buffer(_core_lines(**params))
    difference = budget_inr - total

    suggestions: list[BudgetSuggestion] = []
    if difference < 0:
        suggestions = _suggest_savings(params, total)

    return BudgetBreakdown(
        lines=lines,
        total_inr=total,
        budget_inr=budget_inr,
        difference_inr=difference,
        within_budget=difference >= 0,
        disclaimer=DISCLAIMER,
        suggestions=suggestions,
    )


def _total_for(params: dict) -> int:
    return _total_with_buffer(_core_lines(**params))[1]


def _suggest_savings(params: dict, current_total: int) -> list[BudgetSuggestion]:
    """Recalculate cheaper variants so every suggested saving is a real computed number."""
    suggestions: list[BudgetSuggestion] = []

    tiers = list(ROOM_NIGHT)  # budget, midrange, premium
    idx = tiers.index(params["accommodation"])
    if idx > 0:
        cheaper = tiers[idx - 1]
        saving = current_total - _total_for({**params, "accommodation": cheaper})
        if saving > 0:
            suggestions.append(
                BudgetSuggestion(
                    kind="cheaper_accommodation",
                    saving_inr=saving,
                    detail=f"Switch to {cheaper} accommodation and food.",
                )
            )

    if params["transport"] in ("car", "two-wheeler"):
        saving = current_total - _total_for({**params, "transport": "bus"})
        if saving > 0:
            suggestions.append(
                BudgetSuggestion(
                    kind="cheaper_transport",
                    saving_inr=saving,
                    detail="Use buses for the long legs instead of a private vehicle.",
                )
            )

    if params["days"] > 1:
        shorter = params["days"] - 1
        saving = current_total - _total_for({**params, "days": shorter})
        if saving > 0:
            suggestions.append(
                BudgetSuggestion(
                    kind="fewer_days",
                    saving_inr=saving,
                    detail=f"Shorten the trip to {shorter} day(s).",
                )
            )

    return sorted(suggestions, key=lambda s: s.saving_inr, reverse=True)
