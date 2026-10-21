import json

import httpx
import pytest

from app.schemas import TripRequest
from app.services import llm
from app.services.cities import resolve_start
from app.services.destinations import load_destinations
from app.services.fallback import build_fallback_itinerary
from app.services.planner import generate_trip
from app.services.retrieval import assign_days, select_stops
from app.services.validator import InvalidItinerary, extract_json, validate_llm_itinerary


def make_request(**overrides) -> TripRequest:
    data = dict(
        start_city="Bengaluru",
        days=3,
        budget_inr=15000,
        travellers=2,
        interests=["nature", "photography"],
    )
    data.update(overrides)
    return TripRequest(**data)


class FakeProvider:
    """Returns canned replies in order; records how many times it was called."""

    name = "fake"

    def __init__(self, *replies):
        self.replies = list(replies)
        self.calls = 0

    def complete_json(self, system, user):
        self.calls += 1
        reply = self.replies.pop(0) if len(self.replies) > 1 else self.replies[0]
        if isinstance(reply, Exception):
            raise reply
        return reply


def valid_reply(request: TripRequest) -> str:
    start = resolve_start(request.start_city)
    stops = select_stops(request, start, load_destinations())
    return build_fallback_itinerary(request, stops, start).model_dump_json()


# --- city lookup -----------------------------------------------------------

def test_resolve_known_city_aliases():
    assert resolve_start("Bangalore, India").name == "Bengaluru"
    assert resolve_start("mysore").name == "Mysuru"


def test_resolve_kannada_city_with_suffix():
    assert resolve_start("ಮೈಸೂರಿನಿಂದ").name == "Mysuru"
    assert resolve_start("ಬೆಂಗಳೂರು").name == "Bengaluru"


def test_unknown_city_is_flagged_not_hidden():
    start = resolve_start("Atlantis")
    assert start.assumed is True and start.name == "Bengaluru"


# --- stop selection ----------------------------------------------------------

@pytest.mark.parametrize("days", [1, 2, 3, 5, 7])
def test_selected_stops_fit_requested_days(days):
    request = make_request(days=days, interests=["heritage", "culture", "nature"])
    stops = select_stops(request, resolve_start("Bengaluru"), load_destinations())
    assert stops
    assert sum(s.units for s in stops) <= days + 1e-6
    assert len({s.destination.id for s in stops}) == len(stops)  # no duplicate stops
    assert max(assign_days(stops)) <= days


def test_every_stop_matches_an_interest():
    request = make_request(interests=["beaches"])
    stops = select_stops(request, resolve_start("Bengaluru"), load_destinations())
    assert all("beaches" in s.destination.categories for s in stops[:1])


# --- end to end in demo mode ---------------------------------------------------

def test_demo_mode_returns_complete_plan(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "none")
    plan = generate_trip(make_request())
    assert plan.source == "fallback" and plan.fallback_reason
    assert [d.day for d in plan.days] == list(range(1, len(plan.days) + 1))
    for day in plan.days:
        assert {a.slot for a in day.activities} == {"morning", "afternoon", "evening"}
    known = {s.id for s in plan.stops}
    assert all(i in known for d in plan.days for i in d.destination_ids)


def test_budget_total_is_sum_of_lines_and_flags_are_consistent(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "none")
    plan = generate_trip(make_request(budget_inr=1000, days=4, transport="car"))
    b = plan.budget
    assert b.total_inr == sum(line.amount_inr for line in b.lines)
    assert b.within_budget is False and b.difference_inr == b.budget_inr - b.total_inr
    assert b.suggestions  # over budget must come with savings ideas
    assert any("over your budget" in w for w in plan.warnings)


def test_legs_have_no_zero_distance_journeys(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "none")
    plan = generate_trip(make_request(days=6, interests=["food", "culture"]))
    assert all(leg.est_road_km >= 5 and leg.is_estimate for leg in plan.legs)


def test_kannada_output_uses_kannada_text(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "none")
    plan = generate_trip(make_request(language="kn"))
    assert any("ಀ" <= ch <= "೿" for ch in plan.summary)
    assert any("ಀ" <= ch <= "೿" for ch in plan.days[0].theme)


def test_unknown_start_city_adds_warning(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "none")
    plan = generate_trip(make_request(start_city="Atlantis"))
    assert plan.start.assumed and any("Atlantis" in w for w in plan.warnings)


# --- LLM path -------------------------------------------------------------------

def test_valid_llm_reply_is_used():
    request = make_request()
    provider = FakeProvider(valid_reply(request))
    plan = generate_trip(request, provider)
    assert plan.source == "llm" and plan.fallback_reason is None and provider.calls == 1


def test_llm_json_in_code_fence_is_accepted():
    request = make_request()
    provider = FakeProvider("Here you go:\n```json\n" + valid_reply(request) + "\n```")
    assert generate_trip(request, provider).source == "llm"


def test_invalid_then_valid_reply_retries_once():
    request = make_request()
    provider = FakeProvider("not json at all", valid_reply(request))
    plan = generate_trip(request, provider)
    assert plan.source == "llm" and provider.calls == 2


def test_persistently_bad_llm_falls_back():
    request = make_request()
    provider = FakeProvider("{}")
    plan = generate_trip(request, provider)
    assert plan.source == "fallback" and provider.calls == 2
    assert plan.days  # the traveller still gets a usable plan


def test_llm_error_falls_back_without_retry_storm():
    provider = FakeProvider(llm.LLMError("rate limited"))
    plan = generate_trip(make_request(), provider)
    assert plan.source == "fallback" and "rate limited" in plan.fallback_reason and provider.calls == 1


def test_llm_cannot_add_unplanned_destinations():
    request = make_request()
    data = json.loads(valid_reply(request))
    data["days"][0]["activities"][0]["destination_id"] = "hampi"  # not on the planned route
    start = resolve_start(request.start_city)
    skeleton = assign_days(select_stops(request, start, load_destinations()))
    with pytest.raises(InvalidItinerary):
        validate_llm_itinerary(json.dumps(data), skeleton)


def test_llm_text_is_stripped_of_markup():
    request = make_request()
    data = json.loads(valid_reply(request))
    data["summary"] = "Nice <script>alert(1)</script> trip"
    start = resolve_start(request.start_city)
    skeleton = assign_days(select_stops(request, start, load_destinations()))
    result = validate_llm_itinerary(json.dumps(data), skeleton)
    assert "<" not in result.summary and ">" not in result.summary


def test_llm_wrong_number_of_days_is_rejected():
    request = make_request()
    data = json.loads(valid_reply(request))
    data["days"] = data["days"][:-1]
    start = resolve_start(request.start_city)
    skeleton = assign_days(select_stops(request, start, load_destinations()))
    with pytest.raises(InvalidItinerary):
        validate_llm_itinerary(json.dumps(data), skeleton)


def test_extract_json_rejects_garbage():
    with pytest.raises(InvalidItinerary):
        extract_json("sorry, I cannot help")


# --- providers (HTTP mocked, no network) --------------------------------------------

def mock_transport(status, body):
    return httpx.MockTransport(lambda request: httpx.Response(status, json=body))


def test_openai_compatible_provider_parses_reply():
    provider = llm.OpenAICompatibleProvider(
        "https://example.test/v1", "k", "m",
        transport=mock_transport(200, {"choices": [{"message": {"content": "{\"ok\": 1}"}}]}),
    )
    assert provider.complete_json("s", "u") == '{"ok": 1}'


def test_anthropic_provider_parses_reply():
    provider = llm.AnthropicProvider(
        "k", "m", transport=mock_transport(200, {"content": [{"type": "text", "text": "{\"ok\": 1}"}]})
    )
    assert provider.complete_json("s", "u") == '{"ok": 1}'


def test_rate_limit_and_bad_key_raise_clear_errors():
    limited = llm.OpenAICompatibleProvider("https://x.test", "k", "m", transport=mock_transport(429, {}))
    with pytest.raises(llm.LLMError, match="rate limited"):
        limited.complete_json("s", "u")
    bad_key = llm.AnthropicProvider("k", "m", transport=mock_transport(401, {}))
    with pytest.raises(llm.LLMError, match="API key"):
        bad_key.complete_json("s", "u")


def test_provider_config_from_environment(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "none")
    with pytest.raises(llm.LLMUnavailable):
        llm.get_provider()
    monkeypatch.setenv("LLM_PROVIDER", "anthropic")
    monkeypatch.setenv("LLM_API_KEY", "secret")
    monkeypatch.setenv("LLM_MODEL", "some-model")
    assert llm.get_provider().name == "anthropic"
    monkeypatch.setenv("LLM_PROVIDER", "openai_compatible")
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    with pytest.raises(llm.LLMUnavailable):  # base URL missing
        llm.get_provider()
