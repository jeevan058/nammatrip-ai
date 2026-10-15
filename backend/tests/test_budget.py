import pytest

from app.services import budget
from app.services.budget import calculate_budget, estimate_road_km, haversine_km


def base(**overrides):
    params = dict(
        days=3,
        travellers=2,
        budget_inr=20000,
        transport="bus",
        accommodation="budget",
        route_km=500,
        activity_cost_per_person_inr=400,
    )
    params.update(overrides)
    return calculate_budget(**params)


def line(result, category):
    return next(l for l in result.lines if l.category == category)


def test_total_is_sum_of_lines():
    result = base()
    assert result.total_inr == sum(l.amount_inr for l in result.lines)


def test_known_values_for_simple_trip():
    # 3 days, 2 travellers, bus, budget, 500 km, 400/person activities
    result = base()
    assert line(result, "transportation").amount_inr == 2000  # 500 km x 2.0 x 2 people
    assert line(result, "accommodation").amount_inr == 1800  # 2 nights x 1 room x 900
    assert line(result, "food").amount_inr == 2100  # 3 x 2 x 350
    assert line(result, "activities").amount_inr == 800  # 2 x 400
    assert line(result, "local_transport").amount_inr == 720  # 3 x 2 x 120
    assert line(result, "buffer").amount_inr == 742  # 10% of 7420
    assert result.total_inr == 8162


def test_within_budget_flags_and_difference():
    result = base(budget_inr=10000)
    assert result.within_budget is True
    assert result.difference_inr == 10000 - result.total_inr
    assert result.suggestions == []


def test_over_budget_gets_computed_suggestions():
    result = base(budget_inr=5000, accommodation="premium", transport="car", days=4)
    assert result.within_budget is False
    assert result.difference_inr < 0
    assert result.suggestions, "an over-budget trip should come with alternatives"
    assert all(s.saving_inr > 0 for s in result.suggestions)
    savings = [s.saving_inr for s in result.suggestions]
    assert savings == sorted(savings, reverse=True)


def test_suggestion_savings_match_real_recalculation():
    over = base(budget_inr=1000, accommodation="midrange", days=3)
    cheaper = base(budget_inr=1000, accommodation="budget", days=3)
    suggestion = next(s for s in over.suggestions if s.kind == "cheaper_accommodation")
    assert suggestion.saving_inr == over.total_inr - cheaper.total_inr


def test_rooms_scale_with_travellers():
    two = base(travellers=2)
    three = base(travellers=3)
    assert line(three, "accommodation").amount_inr == 2 * line(two, "accommodation").amount_inr


def test_car_cost_is_per_vehicle_not_per_person():
    four = base(transport="car", travellers=4)
    five = base(transport="car", travellers=5)
    assert line(five, "transportation").amount_inr == 2 * line(four, "transportation").amount_inr


def test_single_day_trip_has_no_accommodation():
    result = base(days=1)
    assert line(result, "accommodation").amount_inr == 0


def test_always_marked_as_estimate_with_disclaimer():
    result = base()
    assert result.is_estimate is True
    assert "not live prices" in result.disclaimer


@pytest.mark.parametrize(
    "overrides",
    [
        {"days": 0},
        {"travellers": 0},
        {"route_km": -1},
        {"activity_cost_per_person_inr": -5},
        {"transport": "helicopter"},
        {"accommodation": "castle"},
    ],
)
def test_invalid_inputs_are_rejected(overrides):
    with pytest.raises(ValueError):
        base(**overrides)


def test_haversine_bengaluru_to_mysuru_is_reasonable():
    # Straight-line Bengaluru -> Mysuru is roughly 125 km.
    km = haversine_km(12.9716, 77.5946, 12.3052, 76.6552)
    assert 115 < km < 140


def test_road_estimate_is_longer_than_straight_line():
    straight = haversine_km(12.9716, 77.5946, 12.3052, 76.6552)
    road = estimate_road_km(12.9716, 77.5946, 12.3052, 76.6552)
    assert road == pytest.approx(straight * budget.ROAD_FACTOR)
