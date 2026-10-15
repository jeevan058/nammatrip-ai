"""Small set of server-side phrases, in English and Kannada.

Only used for text the backend itself writes (fallback itineraries, warnings).
The Kannada phrases are short and simple; they should be reviewed by a native
speaker before the final demo.
"""

TEXTS = {
    "en": {
        "theme": "Day {n}: {place}",
        "theme_multi": "Day {n}: {places}",
        "visit": "Visit {place}",
        "visit_desc": "Spend this part of the day at {place}, one of the highlights of {dest}.",
        "evening_food": "Dinner and local flavours",
        "evening_food_desc": "Try local food such as {food} around {dest}.",
        "evening_rest": "Relax and unwind",
        "evening_rest_desc": "Take an easy evening in {dest} and rest before the next day.",
        "stay": "Stay near {dest}. Choose a {tier} option that fits your budget.",
        "summary": "A {days}-day Karnataka trip from {start} covering {places}, matched to your interests in {interests}.",
        "tip_estimates": "Costs and travel times here are planning estimates, not live prices. Verify fares, tickets and opening hours before you book.",
        "tip_season": "Best time for {dest}: {season}.",
        "warn_assumed_start": "We did not recognise \"{city}\", so distances are calculated from Bengaluru.",
        "warn_fewer_days": "We found enough places for {planned} of your {requested} days. Consider adding a day to a favourite stop.",
        "warn_long_leg": "The journey from {a} to {b} is long (about {km} km by road, estimate). Plan for an early start or an overnight break.",
        "warn_over_budget": "This plan is about Rs {over} over your budget. See the savings suggestions below.",
        "warn_free": "Low-cost or free options on this route include: {names}.",
        "warn_fallback": "Built from our curated destination data without the AI writer, so descriptions are shorter.",
    },
    "kn": {
        "theme": "ದಿನ {n}: {place}",
        "theme_multi": "ದಿನ {n}: {places}",
        "visit": "{place} ಭೇಟಿ",
        "visit_desc": "ದಿನದ ಈ ಭಾಗವನ್ನು {dest} ಪ್ರದೇಶದ {place} ನೋಡಲು ಕಳೆಯಿರಿ.",
        "evening_food": "ಸ್ಥಳೀಯ ಊಟ ಮತ್ತು ರುಚಿ",
        "evening_food_desc": "{dest} ಬಳಿ {food} ಮುಂತಾದ ಸ್ಥಳೀಯ ಖಾದ್ಯಗಳನ್ನು ಸವಿಯಿರಿ.",
        "evening_rest": "ವಿಶ್ರಾಂತಿ",
        "evening_rest_desc": "{dest} ನಲ್ಲಿ ಸಂಜೆಯನ್ನು ನಿಧಾನವಾಗಿ ಕಳೆದು ಮರುದಿನಕ್ಕೆ ವಿಶ್ರಮಿಸಿ.",
        "stay": "{dest} ಹತ್ತಿರ ಉಳಿದುಕೊಳ್ಳಿ. ನಿಮ್ಮ ಬಜೆಟ್‌ಗೆ ಹೊಂದುವ {tier} ಆಯ್ಕೆ ಆರಿಸಿ.",
        "summary": "{days} ದಿನಗಳ ಕರ್ನಾಟಕ ಪ್ರವಾಸ. ಆರಂಭ: {start}. ಸ್ಥಳಗಳು: {places}. ನಿಮ್ಮ ಆಸಕ್ತಿಗಳು: {interests}.",
        "tip_estimates": "ಇಲ್ಲಿರುವ ವೆಚ್ಚ ಮತ್ತು ಪ್ರಯಾಣ ಸಮಯ ಅಂದಾಜುಗಳು ಮಾತ್ರ, ಇಂದಿನ ನಿಜವಾದ ದರಗಳಲ್ಲ. ಬುಕ್ ಮಾಡುವ ಮೊದಲು ದರ, ಟಿಕೆಟ್ ಮತ್ತು ಸಮಯಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
        "tip_season": "{dest}: ಉತ್ತಮ ಸಮಯ ({season}).",
        "warn_assumed_start": "\"{city}\" ನಮಗೆ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ, ಆದ್ದರಿಂದ ದೂರಗಳನ್ನು ಬೆಂಗಳೂರಿನಿಂದ ಲೆಕ್ಕ ಹಾಕಲಾಗಿದೆ.",
        "warn_fewer_days": "ನಿಮ್ಮ {requested} ದಿನಗಳಲ್ಲಿ {planned} ದಿನಗಳಿಗೆ ಸಾಕಾಗುವ ಸ್ಥಳಗಳು ಮಾತ್ರ ಸಿಕ್ಕಿವೆ. ಇಷ್ಟದ ಸ್ಥಳದಲ್ಲಿ ಒಂದು ದಿನ ಹೆಚ್ಚು ಕಳೆಯುವುದನ್ನು ಪರಿಗಣಿಸಿ.",
        "warn_long_leg": "ಪ್ರಯಾಣ {a} → {b} ದೀರ್ಘವಾಗಿದೆ (ರಸ್ತೆಯಲ್ಲಿ ಸುಮಾರು {km} ಕಿ.ಮೀ, ಅಂದಾಜು). ಬೇಗ ಹೊರಡಿ ಅಥವಾ ಮಾರ್ಗದಲ್ಲಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.",
        "warn_over_budget": "ಈ ಯೋಜನೆ ನಿಮ್ಮ ಬಜೆಟ್‌ಗಿಂತ ಸುಮಾರು ₹{over} ಹೆಚ್ಚಿದೆ. ಕೆಳಗಿನ ಉಳಿತಾಯ ಸಲಹೆಗಳನ್ನು ನೋಡಿ.",
        "warn_free": "ಈ ಮಾರ್ಗದಲ್ಲಿ ಕಡಿಮೆ ವೆಚ್ಚದ ಅಥವಾ ಉಚಿತ ಆಯ್ಕೆಗಳು: {names}.",
        "warn_fallback": "AI ಬರಹಗಾರರ ಸಹಾಯವಿಲ್ಲದೆ ನಮ್ಮ ಆಯ್ದ ಸ್ಥಳ ಮಾಹಿತಿಯಿಂದ ರೂಪಿಸಲಾಗಿದೆ, ಆದ್ದರಿಂದ ವಿವರಗಳು ಚಿಕ್ಕದಾಗಿವೆ.",
    },
}

TIER_WORDS = {
    "en": {"budget": "budget", "midrange": "mid-range", "premium": "premium"},
    "kn": {"budget": "ಕಡಿಮೆ ದರದ", "midrange": "ಮಧ್ಯಮ ದರದ", "premium": "ಪ್ರೀಮಿಯಂ"},
}

INTEREST_WORDS = {
    "en": {
        "nature": "nature", "heritage": "heritage", "beaches": "beaches", "adventure": "adventure",
        "wildlife": "wildlife", "food": "food", "culture": "culture", "photography": "photography",
        "spiritual": "spiritual places",
    },
    "kn": {
        "nature": "ಪ್ರಕೃತಿ", "heritage": "ಪರಂಪರೆ", "beaches": "ಕಡಲತೀರಗಳು", "adventure": "ಸಾಹಸ",
        "wildlife": "ವನ್ಯಜೀವಿ", "food": "ಆಹಾರ", "culture": "ಸಂಸ್ಕೃತಿ", "photography": "ಫೋಟೋಗ್ರಫಿ",
        "spiritual": "ಆಧ್ಯಾತ್ಮಿಕ ತಾಣಗಳು",
    },
}


def t(lang: str, key: str, **kwargs) -> str:
    return TEXTS[lang][key].format(**kwargs)
