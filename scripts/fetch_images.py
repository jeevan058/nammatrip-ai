"""Download openly licensed photos of Karnataka destinations from Wikimedia Commons.

Run once on your own computer (needs internet):
    python scripts/fetch_images.py

Photos are saved to frontend/public/images/destinations/ and the author and
licence of every photo are written to ATTRIBUTIONS.md next to them.
Only CC / public-domain images are accepted. Review the photos before the demo,
and keep ATTRIBUTIONS.md in the project so credit is given.
If a photo cannot be found, the site automatically shows its drawn fallback.
"""

import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "backend" / "app" / "data" / "destinations.json"
OUT = ROOT / "frontend" / "public" / "images" / "destinations"
API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {"User-Agent": "NammaTripAI-hackathon/0.1 (student project; image fetch script)"}

# Better search phrases than the display names.
QUERIES = {
    "mysuru": "Mysore Palace illuminated",
    "coorg": "Coorg coffee plantation hills",
    "hampi": "Hampi Vittala Temple stone chariot",
    "chikkamagaluru": "Mullayanagiri Chikmagalur hills",
    "gokarna": "Gokarna Om Beach",
    "jog-falls": "Jog Falls Karnataka",
    "bengaluru": "Vidhana Soudha Bangalore",
    "badami": "Badami cave temples",
    "pattadakal": "Pattadakal temples",
    "udupi": "Udupi Krishna Matha",
    "shivamogga": "Agumbe sunset Karnataka",
    "bandipur": "Bandipur National Park",
    "belur-halebidu": "Hoysaleswara Temple Halebidu",
    "channapatna": "Channapatna toys",
}
OK_LICENCE = re.compile(r"^(CC[ -]BY|CC0|Public domain|PD)", re.I)


def get_json(params: dict) -> dict:
    url = f"{API}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as r:
        return json.load(r)


def find_image(query: str):
    data = get_json({
        "action": "query", "format": "json", "generator": "search", "gsrsearch": query,
        "gsrnamespace": 6, "gsrlimit": 12, "prop": "imageinfo",
        "iiprop": "url|mime|extmetadata", "iiurlwidth": 1400,
    })
    pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    for page in pages:
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        licence = meta.get("LicenseShortName", {}).get("value", "")
        if info.get("mime") == "image/jpeg" and OK_LICENCE.match(licence) and info.get("thumburl"):
            author = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "Unknown")).strip()
            return info["thumburl"], page["title"], author, licence, info.get("descriptionurl", "")
    return None


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    destinations = json.loads(DATA.read_text(encoding="utf-8"))
    credits, missing = [], []
    for d in destinations:
        target = OUT / d["image"]
        if target.exists():
            print(f"skip   {d['id']} (already downloaded)")
            continue
        try:
            found = find_image(QUERIES.get(d["id"], d["name"] + " Karnataka"))
            if not found:
                missing.append(d["id"]); print(f"none   {d['id']}"); continue
            url, title, author, licence, page = found
            req = urllib.request.Request(url, headers=HEADERS)
            target.write_bytes(urllib.request.urlopen(req, timeout=60).read())
            credits.append(f"- **{d['name']}**: {title} by {author}, {licence}. {page}")
            print(f"ok     {d['id']}  <- {title}")
        except Exception as error:  # keep going; one failure should not stop the rest
            missing.append(d["id"]); print(f"failed {d['id']}: {error}")
    if credits:
        with (OUT / "ATTRIBUTIONS.md").open("a", encoding="utf-8") as f:
            f.write("\n".join(credits) + "\n")
    if missing:
        print("\nNo photo for:", ", ".join(missing), "(the drawn fallback will be shown)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
