"""Resolve the traveller's starting city to coordinates."""

import json
import re
from functools import lru_cache
from pathlib import Path

from app.schemas import StartPoint

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "cities.json"
DEFAULT_CITY_ID = "bengaluru"


@lru_cache(maxsize=1)
def _cities() -> tuple[dict, ...]:
    with DATA_FILE.open(encoding="utf-8") as handle:
        return tuple(json.load(handle))


# Kannada dependent vowel signs. A place name loses its final one when a suffix is added:
# ಮೈಸೂರು (Mysuru) -> ಮೈಸೂರಿನಿಂದ (from Mysuru). So we match on the name without it.
_VOWEL_SIGNS = "\u0cbe\u0cbf\u0cc0\u0cc1\u0cc2\u0cc6\u0cc7\u0cc8\u0cca\u0ccb\u0ccc"


def _stem(name: str) -> str:
    return name.rstrip(_VOWEL_SIGNS)


def _normalise(text: str) -> str:
    return re.sub(r"[^\wಀ-೿ ]+", " ", text.lower()).strip()


def resolve_start(text: str) -> StartPoint:
    """Match free text such as "Bangalore, India" or "ಮೈಸೂರು" to a known city.

    Unknown cities fall back to Bengaluru and are flagged with assumed=True so the
    caller can tell the traveller instead of silently guessing.
    """
    cities = _cities()
    needle = _normalise(text)
    words = set(needle.split())

    for city in cities:
        names = {_normalise(city["name"]), city["name_kn"], *city["aliases"]}
        if needle in names or words & names:
            return StartPoint(name=city["name"], name_kn=city["name_kn"], lat=city["lat"], lng=city["lng"])
        # Kannada suffixes ("ಮೈಸೂರಿನಿಂದ") are attached to the name, so also try a prefix match.
        if any(needle.startswith(_stem(name)) for name in names if len(_stem(name)) >= 3):
            return StartPoint(name=city["name"], name_kn=city["name_kn"], lat=city["lat"], lng=city["lng"])

    default = next(c for c in cities if c["id"] == DEFAULT_CITY_ID)
    return StartPoint(
        name=default["name"], name_kn=default["name_kn"], lat=default["lat"], lng=default["lng"], assumed=True
    )
