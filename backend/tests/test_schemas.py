import pytest
from pydantic import ValidationError

from app.schemas import TripRequest
from app.services.destinations import load_destinations


def valid(**overrides):
    data = dict(
        start_city="Bengaluru",
        days=3,
        budget_inr=8000,
        travellers=2,
        interests=["nature", "photography"],
    )
    data.update(overrides)
    return TripRequest(**data)


def test_valid_request_gets_defaults():
    trip = valid()
    assert trip.transport == "bus"
    assert trip.accommodation == "budget"
    assert trip.language == "en"


def test_kannada_start_city_is_accepted():
    assert valid(start_city="  ಬೆಂಗಳೂರು ").start_city == "ಬೆಂಗಳೂರು"


def test_duplicate_interests_removed_in_order():
    trip = valid(interests=["food", "nature", "food"])
    assert trip.interests == ["food", "nature"]


@pytest.mark.parametrize(
    "overrides",
    [
        {"days": 0},
        {"days": 11},
        {"budget_inr": 0},
        {"budget_inr": 500},
        {"budget_inr": -4000},
        {"travellers": 0},
        {"travellers": 50},
        {"interests": []},
        {"interests": ["skydiving"]},
        {"start_city": ""},
        {"start_city": "x"},
        {"transport": "teleport"},
        {"language": "fr"},
    ],
)
def test_invalid_requests_rejected(overrides):
    with pytest.raises(ValidationError):
        valid(**overrides)


def test_missing_required_field_rejected():
    with pytest.raises(ValidationError):
        TripRequest(start_city="Mysuru", days=2, travellers=1, interests=["food"])


def test_destination_dataset_is_valid_and_consistent():
    destinations = load_destinations()
    assert len(destinations) >= 12
    ids = {d.id for d in destinations}
    for d in destinations:
        assert d.name_kn, d.id
        assert d.activity_cost_inr.min <= d.activity_cost_inr.max, d.id
        assert set(d.nearby) <= ids, d.id
