"""Resolve a traveller's starting location to coordinates."""

import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

from app.schemas import StartPoint, TripRequest

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "cities.json"
DEFAULT_CITY_ID = "bengaluru"


@lru_cache(maxsize=1)
def _cities() -> tuple[dict, ...]:
    with DATA_FILE.open(encoding="utf-8") as handle:
        return tuple(json.load(handle))


def _normalise(text: str) -> str:
    text = unicodedata.normalize("NFC", text).casefold()
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    return " ".join(text.split())


def _make_start(city: dict, assumed: bool = False) -> StartPoint:
    return StartPoint(
        name=city["name"],
        name_kn=city.get("name_kn"),
        lat=city["lat"],
        lng=city["lng"],
        assumed=assumed,
    )


def resolve_start(text: str) -> StartPoint:
    """Resolve a known city name, preserving the existing city database."""

    cities = _cities()
    needle = _normalise(text)

    for suffix in (", india", " india"):
        if needle.endswith(suffix):
            needle = needle[: -len(suffix)].strip()
            break

    if needle:
        for city in cities:
            names = [
                city.get("name", ""),
                city.get("name_kn", ""),
                *city.get("aliases", []),
            ]
            normalized = {
                _normalise(name)
                for name in names
                if isinstance(name, str) and name.strip()
            }
            if needle in normalized:
                return _make_start(city)

        for city in cities:
            names = [
                city.get("name", ""),
                city.get("name_kn", ""),
                *city.get("aliases", []),
            ]
            for name in names:
                if not isinstance(name, str):
                    continue
                normalized = _normalise(name)
                if len(normalized) >= 3 and needle.startswith(normalized + " "):
                    return _make_start(city)

    default = next(
        (city for city in cities if city.get("id") == DEFAULT_CITY_ID),
        None,
    )
    if default is None:
        raise RuntimeError("Default Bengaluru city is missing from cities.json")

    return _make_start(default, assumed=True)


def resolve_trip_start(request: TripRequest) -> StartPoint:
    """Use the selected place coordinates, or resolve an older text-only request."""

    if request.start_lat is not None and request.start_lng is not None:
        return StartPoint(
            name=request.start_city,
            name_kn=None,
            lat=request.start_lat,
            lng=request.start_lng,
            assumed=False,
        )

    return resolve_start(request.start_city)