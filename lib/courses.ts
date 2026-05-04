import type { CourseRecord, RawCourse } from "./types";

export function normalize(text: string) {
  return text.toLowerCase().trim();
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

export function matchSdsuCourses(
  courses: CourseRecord[],
  query: string,
  showRetired: boolean,
) {
  const q = normalize(query);
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

      return haystack.includes(q);
    })
    .slice(0, 30);
}