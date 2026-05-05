import type { CourseRecord, RawCourse } from "./types";

export function normalize(text: string) {
  return text.toLowerCase().trim();
}

export function compactCourseCode(text: string) {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function normalizeCourses(raw: RawCourse[]): CourseRecord[] {
  return raw
    .map((course) => {
      const code = (course.code || "").trim();
      const prefix = (course.prefix || code.split(" ")[0] || "").trim();
      const number = (course.number || code.split(" ").slice(1).join(" ") || "").trim();

      const units = Number(course.units);
      const unitMin = Number(course.unit_min ?? course.units);
      const unitMax = Number(course.unit_max ?? course.units);

      return {
        code,
        prefix,
        number,
        title: (course.title || "").replace(/^-/, "").trim(),
        units: Number.isFinite(units) ? units : 0,
        unitMin: Number.isFinite(unitMin) ? unitMin : Number.isFinite(units) ? units : 0,
        unitMax: Number.isFinite(unitMax) ? unitMax : Number.isFinite(units) ? units : 0,
        variableUnits: Boolean(course.variable_units),
        status: course.status === "retired" ? "retired" : "active",
        sourceUrl: course.source_url,
        aliases: Array.isArray(course.aliases) ? course.aliases : [],
        needsDetailReview: Boolean(course.needs_detail_review),
      };
    })
    .filter((course) => course.code && course.title && course.units >= 0);
}

export function findCourseByFlexibleCode(
  catalog: CourseRecord[],
  input: string,
): CourseRecord | null {
  const compactInput = compactCourseCode(input);
  if (!compactInput) return null;

  return (
    catalog.find((course) => compactCourseCode(course.code) === compactInput) ??
    null
  );
}

export function suggestCourseByFlexibleCode(
  catalog: CourseRecord[],
  input: string,
): CourseRecord | null {
  const compactInput = compactCourseCode(input);
  if (compactInput.length < 4) return null;

  const candidates = catalog
    .map((course) => {
      const compactCode = compactCourseCode(course.code);

      let score = 0;

      if (compactCode === compactInput) score += 100;
      if (compactCode.startsWith(compactInput)) score += 70;
      if (compactInput.startsWith(compactCode)) score += 60;

      const sharedPrefixLength = commonPrefixLength(compactCode, compactInput);
      score += sharedPrefixLength * 5;

      return { course, score };
    })
    .filter((item) => item.score >= 40)
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.course ?? null;
}

function commonPrefixLength(a: string, b: string) {
  let count = 0;
  const max = Math.min(a.length, b.length);

  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) break;
    count++;
  }

  return count;
}

export function matchSdsuCourses(
  courses: CourseRecord[],
  query: string,
  showRetired: boolean,
) {
  const q = normalize(query);
  const compactQ = compactCourseCode(query);

  if (!q) return [];

  return courses
    .filter((course) => {
      if (!showRetired && course.status === "retired") return false;

      const haystack = [
        course.code,
        course.prefix,
        course.number,
        course.title,
        ...course.aliases,
      ]
        .join(" ")
        .toLowerCase();

      const compactCode = compactCourseCode(course.code);

      return (
        haystack.includes(q) ||
        compactCode.includes(compactQ) ||
        compactCode.startsWith(compactQ)
      );
    })
    .slice(0, 30);
}