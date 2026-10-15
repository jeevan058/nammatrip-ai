"""Deterministic itinerary writer.

Used when no LLM is configured or when the model fails. It builds every day
from the curated destination data, so it is always grounded and never invents
places, prices or hours.
"""

from app.schemas import Activity, DayPlan, LLMItinerary, StartPoint, TripRequest
from app.services.retrieval import Stop, assign_days
from app.services.texts import INTEREST_WORDS, TIER_WORDS, t


def _dest_name(stop: Stop, lang: str) -> str:
    return stop.destination.name_kn if lang == "kn" else stop.destination.name


def build_fallback_itinerary(
    request: TripRequest, stops: list[Stop], start: StartPoint
) -> LLMItinerary:
    lang = request.language
    start_name = (start.name_kn or start.name) if lang == "kn" else start.name
    day_map = assign_days(stops)
    by_id = {s.destination.id: s for s in stops}

    # Each destination gets a queue of highlights shared across the days it covers.
    queues = {s.destination.id: list(s.destination.highlights) for s in stops}
    food_used: dict[str, int] = {s.destination.id: 0 for s in stops}

    days: list[DayPlan] = []
    for day_number in sorted(day_map):
        ids = day_map[day_number]
        stops_today = [by_id[i] for i in ids]
        names = [_dest_name(s, lang) for s in stops_today]
        primary = stops_today[0]
        activities: list[Activity] = []
        used_titles: set[str] = set()

        for slot in ("morning", "afternoon"):
            # Morning goes to the first stop of the day, afternoon to the last.
            stop = stops_today[0] if slot == "morning" else stops_today[-1]
            queue = queues[stop.destination.id]
            place = queue.pop(0) if queue else stop.destination.name
            # Two stops on one day can share a landmark name (e.g. Virupaksha Temple); skip repeats.
            while place in used_titles and queue:
                place = queue.pop(0)
            used_titles.add(place)
            first_visit = stop.destination.id not in {a.destination_id for a in activities}
            dest_name = _dest_name(stop, lang)
            if first_visit and day_number == min(d for d, v in day_map.items() if stop.destination.id in v):
                description = (
                    stop.destination.description_kn if lang == "kn" else stop.destination.description
                )
            else:
                description = t(lang, "visit_desc", place=place, dest=dest_name)
            activities.append(
                Activity(
                    slot=slot,
                    destination_id=stop.destination.id,
                    title=t(lang, "visit", place=place),
                    description=description[:400],
                )
            )

        evening_stop = stops_today[-1]
        # Drinks make poor dinner suggestions; keep them for the day's "eat" list only.
        foods = [f for f in evening_stop.destination.food if "coffee" not in f.lower() and "tea" not in f.lower()] or evening_stop.destination.food
        dest_name = _dest_name(evening_stop, lang)
        if foods:
            index = food_used[evening_stop.destination.id] % len(foods)
            food_used[evening_stop.destination.id] += 1
            activities.append(
                Activity(
                    slot="evening",
                    destination_id=evening_stop.destination.id,
                    title=t(lang, "evening_food"),
                    description=t(lang, "evening_food_desc", food=foods[index], dest=dest_name),
                )
            )
        else:
            activities.append(
                Activity(
                    slot="evening",
                    destination_id=evening_stop.destination.id,
                    title=t(lang, "evening_rest"),
                    description=t(lang, "evening_rest_desc", dest=dest_name),
                )
            )

        theme_key = "theme" if len(names) == 1 else "theme_multi"
        days.append(
            DayPlan(
                day=day_number,
                theme=t(lang, theme_key, n=day_number, place=names[0], places=" + ".join(names)),
                destination_ids=ids,
                activities=activities,
                food=list(dict.fromkeys(f for s in stops_today for f in s.destination.food))[:3],
                stay_note=(
                    t(lang, "stay", dest=_dest_name(primary, lang), tier=TIER_WORDS[lang][request.accommodation])
                    if day_number < max(day_map)
                    else None
                ),
            )
        )

    tips = [t(lang, "tip_estimates")]
    for stop in stops[:3]:
        tips.append(t(lang, "tip_season", dest=_dest_name(stop, lang), season=stop.destination.best_season))
    for stop in stops:
        if stop.destination.practical_notes and len(tips) < 6:
            tips.append(stop.destination.practical_notes[0])
    tips = list(dict.fromkeys(tips))[:8]

    interests = ", ".join(INTEREST_WORDS[lang][i] for i in request.interests)
    summary = t(
        lang,
        "summary",
        days=len(days),
        start=start_name,
        places=", ".join(_dest_name(s, lang) for s in stops),
        interests=interests,
    )
    return LLMItinerary(summary=summary[:500], days=days, tips=tips)
