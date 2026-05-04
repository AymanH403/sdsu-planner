import json
import re
import time
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"

OUTPUT_FILE = DATA_DIR / "sdsu_courses.json"
PREFIX_OUTPUT_FILE = DATA_DIR / "sdsu_prefixes.json"
PREFIX_COUNTS_FILE = DATA_DIR / "sdsu_prefix_course_counts.json"
UNIT_FAILURES_FILE = DATA_DIR / "sdsu_unit_parse_failures.json"

BASE = "https://catalog.sdsu.edu/"
NAVOID = 992
CATOID = 11

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Mozilla/5.0"})


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def get_html(url: str, retries: int = 3, timeout: int = 60) -> str:
    last_error = None

    for attempt in range(1, retries + 1):
        try:
            resp = SESSION.get(url, timeout=timeout)
            resp.raise_for_status()
            return resp.text
        except Exception as exc:
            last_error = exc
            print(f"Attempt {attempt}/{retries} failed for {url}: {exc}")
            time.sleep(2 * attempt)

    raise last_error


def build_course_index_url(page_num: int = 1) -> str:
    query = {
        "catoid": CATOID,
        "navoid": NAVOID,
        "filter[item_type]": "3",
        "filter[only_active]": "1",
        "filter[3]": "1",
        "filter[cpage]": str(page_num),
    }
    return f"{BASE}content.php?{urlencode(query)}#acalog_template_course_filter"


def looks_like_prefix(text: str) -> bool:
    text = clean_text(text).upper()

    if not text:
        return False

    if len(text) > 10:
        return False

    if not re.fullmatch(r"[A-Z&]{1,5}(?:\s+[A-Z&]{1,5}){0,2}", text):
        return False

    bad_words = {
        "ALL",
        "HELP",
        "SEARCH",
        "CATALOG",
        "COURSES",
        "PROGRAMS",
        "FACULTY",
        "MENU",
        "BACK",
        "TOP",
        "PRINT",
        "HOME",
        "SELECT",
        "PREFIX",
    }

    return text not in bad_words


def extract_prefixes_from_dropdown() -> list[str]:
    url = build_course_index_url(1)
    print(f"Scanning prefix dropdown from: {url}")

    html = get_html(url)
    soup = BeautifulSoup(html, "html.parser")

    prefixes = set()

    for select in soup.find_all("select"):
        select_name = " ".join(
            [
                select.get("name", ""),
                select.get("id", ""),
                select.get("aria-label", ""),
            ]
        ).lower()

        is_prefix_select = (
            "filter[3]" in select_name
            or "prefix" in select_name
            or "subject" in select_name
            or "course" in select_name
        )

        if not is_prefix_select:
            continue

        for option in select.find_all("option"):
            value = clean_text(option.get("value", "")).upper()
            label = clean_text(option.get_text(" ", strip=True)).upper()
            candidate = value if value else label

            if looks_like_prefix(candidate):
                prefixes.add(candidate)

    if not prefixes:
        for option in soup.find_all("option"):
            value = clean_text(option.get("value", "")).upper()
            label = clean_text(option.get_text(" ", strip=True)).upper()

            for candidate in [value, label]:
                if looks_like_prefix(candidate):
                    prefixes.add(candidate)

    junk = {
        "ALL",
        "ALL PREFIXES",
        "COURSE PREFIX",
        "PREFIX",
        "SELECT",
        "SELECT PREFIX",
        "SEARCH",
        "HELP",
    }

    prefixes = {p for p in prefixes if p not in junk}
    prefixes = sorted(prefixes, key=lambda p: (-len(p), p))

    if not prefixes:
        raise RuntimeError("No SDSU course prefixes found.")

    DATA_DIR.mkdir(exist_ok=True)

    with open(PREFIX_OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(prefixes, f, indent=2, ensure_ascii=False)

    print(f"Found {len(prefixes)} prefixes.")
    print(f"Wrote prefix list to {PREFIX_OUTPUT_FILE}")

    return prefixes


def detect_last_page() -> int:
    html = get_html(build_course_index_url(1))
    soup = BeautifulSoup(html, "html.parser")

    max_page = 1

    for a in soup.find_all("a", href=True):
        href = urljoin(BASE, a["href"])
        parsed = urlparse(href)
        qs = parse_qs(parsed.query)

        values = []
        values.extend(qs.get("filter[cpage]", []))
        values.extend(qs.get("filter%5Bcpage%5D", []))

        for value in values:
            try:
                max_page = max(max_page, int(value))
            except ValueError:
                pass

    page_text = soup.get_text(" ", strip=True)

    for m in re.finditer(r"Page\s+\d+\s+of\s+(\d+)", page_text, re.IGNORECASE):
        try:
            max_page = max(max_page, int(m.group(1)))
        except ValueError:
            pass

    print(f"Detected {max_page} course index pages.")
    return max_page


def parse_units_from_text(text: str):
    text = clean_text(text)
    text = text.replace("–", "-").replace("—", "-")

    # Remove commas that can confuse numeric matching.
    text = re.sub(r"(?<=\d),(?=\d)", "", text)

    # Variable units:
    variable_patterns = [
        r"\bUnits?\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)\b",
        r"\bUnits?\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s+to\s+([0-9]+(?:\.[0-9]+)?)\b",
        r"\b([0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)\s+Units?\b",
        r"\b([0-9]+(?:\.[0-9]+)?)\s+to\s+([0-9]+(?:\.[0-9]+)?)\s+Units?\b",
    ]

    for pattern in variable_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            unit_min = float(match.group(1))
            unit_max = float(match.group(2))
            if unit_min > unit_max:
                unit_min, unit_max = unit_max, unit_min

            return {
                "units": unit_max,
                "unit_min": unit_min,
                "unit_max": unit_max,
                "variable_units": True,
            }

    # Fixed units:
    fixed_patterns = [
        r"\bUnits?\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\b",
        r"\b([0-9]+(?:\.[0-9]+)?)\s+Units?\b",
        r"\bCredit[s]?\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\b",
        r"\b([0-9]+(?:\.[0-9]+)?)\s+Credit[s]?\b",
    ]

    for pattern in fixed_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            units = float(match.group(1))
            return {
                "units": units,
                "unit_min": units,
                "unit_max": units,
                "variable_units": False,
            }

    return {
        "units": None,
        "unit_min": None,
        "unit_max": None,
        "variable_units": False,
    }

def parse_course_label(label: str, prefixes: list[str]):
    """
    Accepts:
      ACCTG 201
      ACCTG 201 - Financial Accounting Fundamentals
      B A 671
      B A 671 - Legal Environment of Business
      A E 490 - Aerospace Engineering Design
    """
    label = clean_text(label)

    if not label:
        return None

    for prefix in sorted(prefixes, key=len, reverse=True):
        prefix_pattern = r"\s+".join(map(re.escape, prefix.split()))

        pattern = (
        rf"^({prefix_pattern})"
        rf"\s+"
        rf"(\d{{2,3}}[A-Z]{{0,3}})"
        rf"(?:\s*[-–—:]\s*(.+)|\s*)$"
    )

        match = re.match(pattern, label, flags=re.IGNORECASE)

        if not match:
            continue

        parsed_prefix = clean_text(match.group(1).upper())
        number = clean_text(match.group(2).upper())
        title = clean_text(match.group(3) or "").strip(" -–—:")

        if parsed_prefix not in prefixes:
            continue

        return {
            "code": f"{parsed_prefix} {number}",
            "prefix": parsed_prefix,
            "number": number,
            "title": title,
        }

    return None


def build_course_index(prefixes: list[str]):
    """
    Primary source:
    compact catalog index page.

    It usually has:
      code
      title
      detail URL
    Sometimes units are nearby in the same row/block; if so, capture them here.
    """
    last_page = detect_last_page()
    courses = {}
    failed_pages = []

    for page_num in range(1, last_page + 1):
        url = build_course_index_url(page_num)
        print(f"Index page {page_num}/{last_page}: {url}")

        try:
            html = get_html(url)
        except Exception as exc:
            print(f"Failed index page {page_num}: {exc}")
            failed_pages.append(page_num)
            continue

        soup = BeautifulSoup(html, "html.parser")

        visible_course_links = 0
        parsed_course_links = 0
        new_courses = 0
        failed_labels = []

        for a in soup.find_all("a", href=True):
            href = a["href"]

            if "preview_course" not in href:
                continue

            label = clean_text(a.get_text(" ", strip=True))
            visible_course_links += 1

            parsed = parse_course_label(label, prefixes)

            if not parsed:
                if len(failed_labels) < 8:
                    failed_labels.append(label)
                continue

            parsed_course_links += 1

            full_url = urljoin(BASE, href)
            code = parsed["code"]

            container = a.find_parent(["tr", "td", "li", "div"]) or a.parent
            container_text = clean_text(container.get_text(" ", strip=True)) if container else label
            unit_info = parse_units_from_text(container_text)

            if code not in courses:
                courses[code] = {
                    "code": code,
                    "prefix": parsed["prefix"],
                    "number": parsed["number"],
                    "title": parsed.get("title", ""),
                    "units": unit_info["units"],
                    "unit_min": unit_info["unit_min"],
                    "unit_max": unit_info["unit_max"],
                    "variable_units": unit_info["variable_units"],
                    "status": "active",
                    "source_url": full_url,
                    "aliases": [],
                    "needs_detail_review": False,
                }
                new_courses += 1

        print(
            f"Page {page_num}: "
            f"{visible_course_links} visible, "
            f"{parsed_course_links} parsed, "
            f"{new_courses} new unique"
        )

        if failed_labels:
            print("  Sample failed labels:")
            for label in failed_labels:
                print(f"    {label}")

    if failed_pages:
        print(f"Retrying failed index pages: {failed_pages}")

    for page_num in failed_pages:
        url = build_course_index_url(page_num)
        print(f"Retry index page {page_num}/{last_page}")

        try:
            html = get_html(url, retries=5, timeout=90)
        except Exception as exc:
            print(f"Still failed index page {page_num}: {exc}")
            continue

        soup = BeautifulSoup(html, "html.parser")
        new_courses = 0

        for a in soup.find_all("a", href=True):
            href = a["href"]

            if "preview_course" not in href:
                continue

            label = clean_text(a.get_text(" ", strip=True))
            parsed = parse_course_label(label, prefixes)

            if not parsed:
                continue

            full_url = urljoin(BASE, href)
            code = parsed["code"]

            container = a.find_parent(["tr", "td", "li", "div"]) or a.parent
            container_text = clean_text(container.get_text(" ", strip=True)) if container else label
            unit_info = parse_units_from_text(container_text)

            if code not in courses:
                courses[code] = {
                    "code": code,
                    "prefix": parsed["prefix"],
                    "number": parsed["number"],
                    "title": parsed.get("title", ""),
                    "units": unit_info["units"],
                    "unit_min": unit_info["unit_min"],
                    "unit_max": unit_info["unit_max"],
                    "variable_units": unit_info["variable_units"],
                    "status": "active",
                    "source_url": full_url,
                    "aliases": [],
                    "needs_detail_review": False,
                }
                new_courses += 1

        print(f"Retry page {page_num}: {new_courses} new unique")

    return list(courses.values())


def parse_detail_title_and_units(course: dict):
    code = course["code"]
    url = course["source_url"]
    existing_title = clean_text(course.get("title", ""))

    try:
        html = get_html(url)
        soup = BeautifulSoup(html, "html.parser")
        text = clean_text(soup.get_text(" ", strip=True))

        title = existing_title

        if not title:
            for tag in soup.find_all(["h1", "h2", "h3", "strong"]):
                candidate = clean_text(tag.get_text(" ", strip=True))

                if not candidate:
                    continue

                if re.search(
                    re.escape(code).replace(r"\ ", r"\s+"),
                    candidate,
                    flags=re.IGNORECASE,
                ):
                    title = candidate
                    break

        if not title:
            code_pattern = re.escape(code).replace(r"\ ", r"\s+")
            match = re.search(
                rf"{code_pattern}\s*[-–—:]?\s*(.+?)\s+Units:",
                text,
                flags=re.IGNORECASE,
            )
            if match:
                title = clean_text(match.group(1))

        if title:
            code_pattern = re.escape(code).replace(r"\ ", r"\s+")
            title = re.sub(code_pattern, "", title, flags=re.IGNORECASE)
            title = title.strip(" -–—:|")

        unit_info = parse_units_from_text(text)

        return title, unit_info

    except Exception as exc:
        print(f"Could not parse details for {code}: {exc}")
        return existing_title, {
            "units": None,
            "unit_min": None,
            "unit_max": None,
            "variable_units": False,
        }


def enrich_missing_course_details(courses: list[dict]):
    """
    Only visit detail pages for courses missing title or units.
    Do not delete courses if enrichment fails.
    """
    missing = [
        course
        for course in courses
        if not course.get("title") or course.get("units") is None
    ]

    print(f"Enriching {len(missing)} courses with missing title/units.")

    for idx, course in enumerate(missing, start=1):
        print(f"[{idx}/{len(missing)}] Details: {course['code']}")

        title, unit_info = parse_detail_title_and_units(course)

        if not course.get("title") and title:
            course["title"] = title

        if course.get("units") is None and unit_info["units"] is not None:
            course["units"] = unit_info["units"]
            course["unit_min"] = unit_info["unit_min"]
            course["unit_max"] = unit_info["unit_max"]
            course["variable_units"] = unit_info["variable_units"]

    for course in courses:
        if not course.get("title"):
            course["title"] = "Unknown Title"
            course["needs_detail_review"] = True

        if course.get("units") is None:
            course["needs_detail_review"] = True

    return courses


def write_prefix_debug_summary(courses: list[dict], prefixes: list[str]):
    counts = {prefix: 0 for prefix in prefixes}

    for course in courses:
        prefix = course.get("prefix")
        if prefix in counts:
            counts[prefix] += 1

    with open(PREFIX_COUNTS_FILE, "w", encoding="utf-8") as f:
        json.dump(counts, f, indent=2, ensure_ascii=False)

    print(f"Wrote prefix course counts to {PREFIX_COUNTS_FILE}")


def write_unit_failures(courses: list[dict]):
    failures = [
        {
            "code": course.get("code"),
            "prefix": course.get("prefix"),
            "number": course.get("number"),
            "title": course.get("title"),
            "source_url": course.get("source_url"),
            "reason": "Could not parse units from compact index or detail page.",
        }
        for course in courses
        if course.get("units") is None
    ]

    with open(UNIT_FAILURES_FILE, "w", encoding="utf-8") as f:
        json.dump(failures, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(failures)} unit parse failures to {UNIT_FAILURES_FILE}")


def main():
    print("Refreshing SDSU catalog with variable-unit support...")
    DATA_DIR.mkdir(exist_ok=True)

    prefixes = extract_prefixes_from_dropdown()

    courses = build_course_index(prefixes)
    print(f"Built compact index with {len(courses)} unique course codes.")

    courses = enrich_missing_course_details(courses)

    # Do NOT delete courses with missing units.
    # Keep them and write diagnostics instead.
    courses = [
        course
        for course in courses
        if course.get("code")
        and course.get("prefix")
        and course.get("number")
    ]

    courses = sorted(courses, key=lambda c: (c["prefix"], c["number"], c["code"]))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)

    write_prefix_debug_summary(courses, prefixes)
    write_unit_failures(courses)

    variable_count = sum(1 for c in courses if c.get("variable_units"))
    missing_unit_count = sum(1 for c in courses if c.get("units") is None)

    print(f"\nWrote {len(courses)} courses to:")
    print(OUTPUT_FILE)
    print(f"Variable-unit courses: {variable_count}")
    print(f"Courses missing units: {missing_unit_count}")
    print(f"Diagnostics file:")
    print(UNIT_FAILURES_FILE)


if __name__ == "__main__":
    main()