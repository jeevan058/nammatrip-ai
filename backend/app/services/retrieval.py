"""Choose and order destinations for a trip.

Everything here is deterministic. The language model never decides which
places are visited or in what order; it only writes about the stops chosen here.
"""

from dataclasses import dataclass

from app.schemas import Destination, StartPoint, TripRequest
from app.services.budget import estimate_road_km, haversine_km

EPSILON = 1e-6

# Which interest categories each travel style leans towards.
STYLE_CATEGORIES = {
    "relaxing": {"nature", "beaches", "spiritual"},
    "adventurous": {"adventure", "wildlife"},
    "cultural": {"culture", "heritage"},
    "family-friendly": {"nature", "wildlife", "culture"},
    "romantic": {"nature", "beaches", "photography"},
    "budget-friendly": set(),
}


@dataclass(frozen=True)
class Stop:
    destination: Destination
    units: float  # how many days of the trip this stop uses (0.5, 1 or 2)


def day_units(destination: Destination) -> float:
    """Rough share of the trip a destination deserves, from its suggested duration."""
    hours = destination.suggested_duration_hours
    if hours <= 4:
        return 0.5
    if hours <= 12:
        return 1.0
    return 2.0


def score_destination(destination: Destination, request: TripRequest, start: StartPoint) -> float:
    matches = len(set(destination.categories) & set(request.interests))
    if matches == 0:
        return 0.0
    score = 3.0 * matches
    score += 0.5 * len(set(destination.categories) & STYLE_CATEGORIES[request.style])
    if request.style == "budget-friendly":
        score -= destination.activity_cost_inr.max / 5000

    # Short trips should stay close to home; long trips can reach further.
    weight = 2.0 if request.days <= 2 else 1.0 if request.days <= 4 else 0.5
    km = estimate_road_km(start.lat, start.lng, destination.lat, destination.lng)
    score -= weight * (km / 200)

    # Tight budgets favour cheaper stops: penalise a stop whose typical activity cost
    # takes more than 10% of each traveller's total budget.
    per_person_budget = request.budget_inr / request.travellers
    typical_cost = (destination.activity_cost_inr.min + destination.activity_cost_inr.max) / 2
    score -= 4.0 * max(0.0, typical_cost / per_person_budget - 0.10)
    return score


def _max_hop_km(days: int) -> float:
    return 250.0 if days <= 4 else 450.0


def select_stops(
    request: TripRequest, start: StartPoint, destinations: tuple[Destination, ...]
) -> list[Stop]:
    """Pick stops that fill the requested days, then order them to limit backtracking."""
    ranked = sorted(
        ((score_destination(d, request, start), d) for d in destinations),
        key=lambda pair: pair[0],
        reverse=True,
    )
    candidates = [(score, d) for score, d in ranked if score > 0 or _has_match(d, request)]
    if not candidates:
        return []

    anchor_score, anchor = candidates[0]
    chosen: dict[str, tuple[Destination, float]] = {}
    remaining = float(request.days)

    def take(destination: Destination) -> None:
        nonlocal remaining
        units = min(day_units(destination), remaining)
        chosen[destination.id] = (destination, units)
        remaining -= units

    take(anchor)
    last = anchor
    while remaining > EPSILON:
        best: tuple[float, Destination] | None = None
        for score, candidate in candidates:
            if candidate.id in chosen:
                continue
            hop = haversine_km(last.lat, last.lng, candidate.lat, candidate.lng)
            if hop > _max_hop_km(request.days):
                continue
            natural = day_units(candidate)
            # Squeezing a big destination into too little time is penalised in proportion.
            squeeze = max(0.0, 1.0 - min(natural, remaining) / natural)
            value = score - hop / 200 - 1.5 * squeeze
            if best is None or value > best[0]:
                best = (value, candidate)
        if best is None:
            break  # nothing sensible left within reach
        take(best[1])
        last = best[1]

    return _order_stops([Stop(d, u) for d, u in chosen.values()], start)


def _has_match(destination: Destination, request: TripRequest) -> bool:
    return bool(set(destination.categories) & set(request.interests))


def _order_stops(stops: list[Stop], start: StartPoint) -> list[Stop]:
    """Nearest-neighbour ordering from the start city. Simple and good enough for <= 10 stops."""
    ordered: list[Stop] = []
    pool = list(stops)
    here = (start.lat, start.lng)
    while pool:
        nearest = min(pool, key=lambda s: haversine_km(*here, s.destination.lat, s.destination.lng))
        pool.remove(nearest)
        ordered.append(nearest)
        here = (nearest.destination.lat, nearest.destination.lng)
    return ordered


def assign_days(stops: list[Stop]) -> dict[int, list[str]]:
    """Lay stops end to end across days. A 2-unit stop spans two days; two 0.5 stops share one."""
    days: dict[int, list[str]] = {}
    cursor = 0.0
    for stop in stops:
        first_day = int(cursor + EPSILON) + 1
        end = cursor + stop.units
        last_day = max(first_day, int(end - EPSILON) + 1)
        for day in range(first_day, last_day + 1):
            days.setdefault(day, []).append(stop.destination.id)
        cursor = end
    return days
