"""Loads and queries the curated destination dataset."""

import json
from functools import lru_cache
from pathlib import Path

from app.schemas import Destination

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "destinations.json"


@lru_cache(maxsize=1)
def load_destinations() -> tuple[Destination, ...]:
    """Read destinations.json and validate every record.

    A bad record raises immediately, so data mistakes are caught at startup
    instead of showing up as broken pages later.
    """
    with DATA_FILE.open(encoding="utf-8") as handle:
        raw = json.load(handle)
    destinations = tuple(Destination.model_validate(item) for item in raw)

    ids = [d.id for d in destinations]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate destination ids in destinations.json")
    known = set(ids)
    for d in destinations:
        unknown = [n for n in d.nearby if n not in known]
        if unknown:
            raise ValueError(f"{d.id}: unknown nearby ids {unknown}")
    return destinations


def get_destination(destination_id: str) -> Destination | None:
    return next((d for d in load_destinations() if d.id == destination_id), None)


def search_destinations(interest: str | None = None, query: str | None = None) -> list[Destination]:
    results = list(load_destinations())
    if interest:
        results = [d for d in results if interest in d.categories]
    if query:
        needle = query.strip().lower()
        results = [
            d
            for d in results
            if needle in d.name.lower() or needle in d.name_kn or needle in d.region.lower()
        ]
    return results
