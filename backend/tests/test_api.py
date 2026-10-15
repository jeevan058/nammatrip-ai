import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["destinations_loaded"] >= 12
    assert body["mode"] in ("demo", "live")


def test_list_destinations():
    response = client.get("/api/destinations")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 12
    assert {"id", "name", "name_kn", "lat", "lng", "categories"} <= set(items[0])


def test_filter_by_interest():
    response = client.get("/api/destinations", params={"interest": "beaches"})
    assert response.status_code == 200
    items = response.json()
    assert items and all("beaches" in d["categories"] for d in items)


def test_search_by_name_and_kannada_name():
    english = client.get("/api/destinations", params={"q": "hampi"}).json()
    kannada = client.get("/api/destinations", params={"q": "ಹಂಪಿ"}).json()
    assert [d["id"] for d in english] == ["hampi"]
    assert [d["id"] for d in kannada] == ["hampi"]


def test_invalid_interest_is_rejected():
    response = client.get("/api/destinations", params={"interest": "skydiving"})
    assert response.status_code == 422


def test_destination_detail_and_404():
    assert client.get("/api/destinations/hampi").json()["name"] == "Hampi"
    assert client.get("/api/destinations/atlantis").status_code == 404


# --- trip generation endpoint ---------------------------------------------------

VALID_TRIP = {
    "start_city": "Bengaluru",
    "days": 3,
    "budget_inr": 12000,
    "travellers": 2,
    "interests": ["nature", "photography"],
}


def test_generate_trip_in_demo_mode(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "none")
    response = client.post("/api/trips/generate", json=VALID_TRIP)
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "fallback"
    assert body["days"] and body["stops"] and body["budget"]["lines"]
    assert body["budget"]["total_inr"] == sum(line["amount_inr"] for line in body["budget"]["lines"])


@pytest.mark.parametrize(
    "change",
    [
        {"budget_inr": 10},
        {"budget_inr": -5000},
        {"days": 0},
        {"days": 30},
        {"travellers": 0},
        {"interests": []},
        {"interests": ["skydiving"]},
        {"start_city": ""},
        {"transport": "helicopter"},
    ],
)
def test_generate_trip_rejects_bad_input(change):
    response = client.post("/api/trips/generate", json={**VALID_TRIP, **change})
    assert response.status_code == 422


def test_generate_trip_rejects_missing_fields():
    assert client.post("/api/trips/generate", json={"days": 3}).status_code == 422
