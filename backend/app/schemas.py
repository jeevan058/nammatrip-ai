"""Pydantic models shared by the API, the planner and the tests."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator

Interest = Literal[
    "nature",
    "heritage",
    "beaches",
    "adventure",
    "wildlife",
    "food",
    "culture",
    "photography",
    "spiritual",
]
TravelStyle = Literal[
    "relaxing", "adventurous", "cultural", "family-friendly", "romantic", "budget-friendly"
]
Transport = Literal["bus", "train", "car", "two-wheeler"]
Accommodation = Literal["budget", "midrange", "premium"]
Language = Literal["en", "kn"]


class TripRequest(BaseModel):
    """What the traveller tells us. Validated before anything else runs."""

    start_city: str = Field(min_length=2, max_length=80)
    days: int = Field(ge=1, le=10)
    budget_inr: int = Field(ge=1000, le=1_000_000)
    travellers: int = Field(ge=1, le=12)
    interests: list[Interest] = Field(min_length=1, max_length=9)
    style: TravelStyle = "relaxing"
    transport: Transport = "bus"
    accommodation: Accommodation = "budget"
    diet: str | None = Field(default=None, max_length=40)
    language: Language = "en"

    @field_validator("start_city", "diet", mode="before")
    @classmethod
    def _strip(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("interests")
    @classmethod
    def _unique_interests(cls, value):
        # keep the order the user chose, drop duplicates
        return list(dict.fromkeys(value))


class CostRange(BaseModel):
    min: int = Field(ge=0)
    max: int = Field(ge=0)


class Destination(BaseModel):
    id: str
    name: str
    name_kn: str
    region: str
    lat: float = Field(ge=11.0, le=19.0)  # rough bounding box for Karnataka
    lng: float = Field(ge=73.5, le=79.0)
    categories: list[Interest]
    description: str
    description_kn: str
    suggested_duration_hours: int = Field(ge=1, le=72)
    activity_cost_inr: CostRange
    best_season: str
    highlights: list[str]
    food: list[str]
    practical_notes: list[str]
    nearby: list[str]
    image: str


class BudgetLine(BaseModel):
    category: Literal[
        "transportation",
        "accommodation",
        "food",
        "activities",
        "local_transport",
        "buffer",
    ]
    amount_inr: int = Field(ge=0)
    basis: str  # plain-language explanation of how the number was estimated


class BudgetSuggestion(BaseModel):
    kind: Literal["cheaper_accommodation", "cheaper_transport", "fewer_days"]
    saving_inr: int = Field(ge=0)
    detail: str


class BudgetBreakdown(BaseModel):
    lines: list[BudgetLine]
    total_inr: int
    budget_inr: int
    difference_inr: int  # budget - total; negative means over budget
    within_budget: bool
    is_estimate: bool = True
    disclaimer: str
    suggestions: list[BudgetSuggestion] = []


# --- Itinerary models --------------------------------------------------------

Slot = Literal["morning", "afternoon", "evening"]


class Activity(BaseModel):
    slot: Slot
    destination_id: str
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=400)


class DayPlan(BaseModel):
    day: int = Field(ge=1, le=10)
    theme: str = Field(min_length=1, max_length=120)
    destination_ids: list[str]
    activities: list[Activity] = Field(min_length=1, max_length=6)
    food: list[str] = Field(default_factory=list, max_length=4)
    stay_note: str | None = Field(default=None, max_length=200)


class LLMItinerary(BaseModel):
    """The only shape we accept back from a language model."""

    summary: str = Field(min_length=1, max_length=500)
    days: list[DayPlan] = Field(min_length=1, max_length=10)
    tips: list[str] = Field(default_factory=list, max_length=8)


class StartPoint(BaseModel):
    name: str
    name_kn: str | None = None
    lat: float
    lng: float
    assumed: bool = False  # True when we did not recognise the city and used a default


class TravelLeg(BaseModel):
    """One journey between stops. Distances are estimates, not routed values."""

    day: int
    from_name: str
    to_name: str
    from_id: str | None = None
    to_id: str | None = None
    straight_km: float
    est_road_km: float
    approx_hours: float
    is_estimate: bool = True


class TripPlan(BaseModel):
    request: TripRequest
    start: StartPoint
    summary: str
    days: list[DayPlan]
    stops: list[Destination]  # ordered, full records so the client can draw the map
    legs: list[TravelLeg]
    budget: BudgetBreakdown
    tips: list[str]
    warnings: list[str] = []
    source: Literal["llm", "fallback"]
    fallback_reason: str | None = None
    estimates_note: str
