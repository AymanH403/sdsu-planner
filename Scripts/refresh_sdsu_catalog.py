import json
import re
from pathlib import Path
from urllib.parse import urljoin, urlencode, urlparse, parse_qs

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
OUTPUT_FILE = DATA_DIR / "sdsu_courses.json"
OVERRIDES_FILE = DATA_DIR / "sdsu_bucket_overrides.json"

BASE = "https://catalog.sdsu.edu/"
NAVOID = 992
CATOID = 11

# Keep this limited to relevant tracker subjects.
TARGET_PREFIXES = {
    "ACCTG",
    "B A",
    "FIN",
    "MIS",
    "MKTG",
    "ECON",
    "STAT",
}

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Mozilla/5.0"})


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def get_html(url: str) -> str:
    resp = SESSION.get(url, timeout=30)
    resp.raise_for_status()
    return resp.text


def build_course_index_url(page_num: int) -> str:
    query = {
        "catoid": CATOID,
        "navoid": NAVOID,
        "filter[3]": "1",
        "filter[item_type]": "3",
        "filter[only_active]": "1",
        "filter[cpage]": str(page_num),
    }
    return f"{BASE}content.php?{urlencode(query)}"


def parse_units_from_page(url: str):
    try:
        html = get_html(url)
        text = clean_text(BeautifulSoup(html, "html.parser").get_text(" ", strip=True))
        m = re.search(r"Units:\s*([0-9]+(?:\.[0-9]+)?)", text, re.IGNORECASE)
        return float(m.group(1)) if m else None
    except Exception as exc:
        print(f"Could not parse units for {url}: {exc}")
        return None


def parse_label(label: str):
    label = clean_text(label)
    m = re.match(r"^([A-Z&]+)\s+(\d+[A-Z]?)\s+(.+)$", label)
    if not m:
        return None, None

    prefix = m.group(1).strip()
    number = m.group(2).strip()
    title = m.group(3).strip()

    if prefix not in TARGET_PREFIXES:
        return None, None

    return f"{prefix} {number}", title


def detect_last_page() -> int:
    first_url = build_course_index_url(1)
    print(f"Detecting last page from: {first_url}")
    html = get_html(first_url)
    soup = BeautifulSoup(html, "html.parser")

    max_page = 1

    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "filter%5Bcpage%5D=" not in href and "filter[cpage]=" not in href:
            continue

        parsed = urlparse(urljoin(BASE, href))
        qs = parse_qs(parsed.query)

        candidates = []
        if "filter[cpage]" in qs:
            candidates.extend(qs["filter[cpage]"])
        if "filter%5Bcpage%5D" in qs:
            candidates.extend(qs["filter%5Bcpage%5D"])

        for value in candidates:
            try:
                page_num = int(value)
                if page_num > max_page:
                    max_page = page_num
            except ValueError:
                pass

    # Fallback: sometimes page links are rendered as plain text or buttons
    page_text = soup.get_text(" ", strip=True)
    for match in re.finditer(r"Page\s+(\d+)\s+of\s+(\d+)", page_text, re.IGNORECASE):
        try:
            possible_max = int(match.group(2))
            if possible_max > max_page:
                max_page = possible_max
        except ValueError:
            pass

    print(f"Detected last page: {max_page}")
    return max_page


def discover_all_relevant_course_links():
    all_courses = {}

    last_page = detect_last_page()

    for page_num in range(1, last_page + 1):
        url = build_course_index_url(page_num)
        print(f"Scanning index page {page_num}/{last_page}: {url}")

        try:
            html = get_html(url)
        except Exception as exc:
            print(f"Failed to fetch page {page_num}: {exc}")
            continue

        soup = BeautifulSoup(html, "html.parser")
        found_on_page = 0

        for a in soup.find_all("a", href=True):
            label = clean_text(a.get_text(" ", strip=True))
            href = a["href"]

            if "preview_course" not in href:
                continue

            code, title = parse_label(label)
            if not code:
                continue

            full_url = urljoin(BASE, href)

            if code not in all_courses:
                all_courses[code] = {
                    "code": code,
                    "title": title,
                    "units": None,
                    "status": "active",
                    "source_url": full_url,
                    "aliases": [],
                    "eligible_buckets": [],
                }
                found_on_page += 1

        print(f"Found {found_on_page} new relevant courses on page {page_num}")

    return list(all_courses.values())


def enrich_units(courses: list[dict]) -> list[dict]:
    for idx, course in enumerate(courses, start=1):
        print(f"[{idx}/{len(courses)}] Parsing units for {course['code']}")
        course["units"] = parse_units_from_page(course["source_url"])
    return courses


def load_overrides() -> dict:
    if not OVERRIDES_FILE.exists():
        print(f"No overrides file found at {OVERRIDES_FILE}")
        return {}

    with open(OVERRIDES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        raise ValueError("sdsu_bucket_overrides.json must be a JSON object keyed by course code")

    return data


def apply_bucket_overrides(courses: list[dict]) -> list[dict]:
    overrides = load_overrides()
    if not overrides:
        return courses

    matched = 0
    for course in courses:
        code = course.get("code")
        if code and code in overrides:
            patch = overrides[code]
            if isinstance(patch, dict):
                for key, value in patch.items():
                    course[key] = value
                matched += 1

    print(f"Applied overrides to {matched} courses")
    return courses


def main():
    print("Refreshing relevant SDSU course library...")
    DATA_DIR.mkdir(exist_ok=True)

    courses = discover_all_relevant_course_links()
    print(f"Discovered {len(courses)} relevant courses before unit enrichment")

    courses = enrich_units(courses)
    courses = apply_bucket_overrides(courses)

    courses = [c for c in courses if c.get("code")]
    courses = sorted(courses, key=lambda x: x["code"])

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(courses)} relevant courses to:")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    main()