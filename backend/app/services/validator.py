"""Validation for model output and consistency checks for finished plans.

Model text is untrusted: it is parsed, cleaned, schema-checked and compared with
the stops our own code chose before anything reaches the browser.
"""

import json
import re

from pydantic import ValidationError

from app.schemas import LLMItinerary

TAG_RE = re.compile(r"<[^>]*>")
CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


class InvalidItinerary(ValueError):
    """The model output cannot be used. The message is safe to log."""


def clean_text(value: str) -> str:
    value = TAG_RE.sub("", value)
    value = CONTROL_RE.sub("", value)
    return re.sub(r"\s+", " ", value).strip()


def extract_json(raw: str) -> dict:
    """Pull one JSON object out of a model reply, tolerating code fences and chatter."""
    text = raw.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    else:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            raise InvalidItinerary("No JSON object found in the model reply.")
        text = text[start : end + 1]
    try:
        data = json.loads(text)
    except json.JSONDecodeError as error:
        raise InvalidItinerary(f"Reply is not valid JSON: {error.msg}") from error
    if not isinstance(data, dict):
        raise InvalidItinerary("Reply JSON is not an object.")
    return data


def _scrub(node):
    if isinstance(node, str):
        return clean_text(node)
    if isinstance(node, list):
        return [_scrub(item) for item in node]
    if isinstance(node, dict):
        return {key: _scrub(value) for key, value in node.items()}
    return node


def validate_llm_itinerary(raw: str, skeleton: dict[int, list[str]]) -> LLMItinerary:
    """Parse and check a model reply against the day skeleton chosen by our code.

    skeleton maps day number -> destination ids allowed on that day.
    """
    data = _scrub(extract_json(raw))
    try:
        itinerary = LLMItinerary.model_validate(data)
    except ValidationError as error:
        first = error.errors()[0]
        where = ".".join(str(p) for p in first["loc"])
        raise InvalidItinerary(f"Schema check failed at {where}: {first['msg']}") from error

    got_days = [d.day for d in itinerary.days]
    if got_days != sorted(skeleton):
        raise InvalidItinerary(f"Expected days {sorted(skeleton)} but got {got_days}.")

    for day in itinerary.days:
        allowed = set(skeleton[day.day])
        # Our own plan decides the day's stops; the model's list is overwritten, not trusted.
        day.destination_ids = list(skeleton[day.day])
        for activity in day.activities:
            if activity.destination_id not in allowed:
                raise InvalidItinerary(
                    f"Day {day.day} uses destination '{activity.destination_id}' that was not planned for that day."
                )
        slots = [a.slot for a in day.activities]
        if len(slots) != len(set(slots)):
            raise InvalidItinerary(f"Day {day.day} repeats a time slot.")
    return itinerary
