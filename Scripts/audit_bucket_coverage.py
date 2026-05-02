import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COURSES_FILE = ROOT / "data" / "sdsu_courses.json"

with open(COURSES_FILE, "r", encoding="utf-8") as f:
    courses = json.load(f)

unbucketed = [c for c in courses if not c.get("eligible_buckets") and not c.get("buckets")]

print("Courses with no bucket data:")
for c in sorted(unbucketed, key=lambda x: x.get("code", "")):
    print(f"- {c.get('code')}: {c.get('title')}")
