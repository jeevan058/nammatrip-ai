
"""Resolve a traveller's starting location to coordinates."""

import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

from app.schemas import StartPoint

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "cities.json"
DEFAULT_CITY_ID = "bengaluru"


@lru_cache(maxsize=1)
def _cities() -> tuple[dict, ...]:
    with DATA_FILE.open(encoding="utf-8") as handle:
        return tuple(json.load(handle))


def _normalise(text: str) -> str:
    """Normalise English and Kannada names without corrupting Unicode."""
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
    """
    Resolve a free-text starting location using the local city database.

    Recognises city names, aliases, English names and Kannada names.
    Unknown locations still use the configured fallback and are flagged
    with assumed=True.
    """
    cities = _cities()
    needle = _normalise(text)

    # Remove common country suffixes without changing the place name.
    for suffix in (", india", " india"):
        if needle.endswith(suffix):
            needle = needle[: -len(suffix)].strip()
            break

    if needle:
        # Prefer exact matches before trying partial matches.
        for city in cities:
            names = [
                city.get("name", ""),
                city.get("name_kn", ""),
                *city.get("aliases", []),
            ]
            normalised_names = {
                _normalise(name) for name in names if isinstance(name, str) and name.strip()
            }

            if needle in normalised_names:
                return _make_start(city)

        # Support inputs such as "Chitradurga, Karnataka" when the city
        # itself is already present in the database.
        for city in cities:
            names = [
                city.get("name", ""),
                city.get("name_kn", ""),
                *city.get("aliases", []),
            ]
            normalised_names = [
                _normalise(name)
                for name in names
                if isinstance(name, str) and len(_normalise(name)) >= 3
            ]

            for name in normalised_names:
                if needle.startswith(name + " ") or needle.startswith(name + ","):
                    return _make_start(city)

    default = next(
        (city for city in cities if city.get("id") == DEFAULT_CITY_ID),
        None,
    )
    if default is None:
        raise RuntimeError(
            f"Default city '{DEFAULT_CITY_ID}' is missing from {DATA_FILE}"
        )

    return _make_start(default, assumed=True)
