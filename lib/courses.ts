import { isBucketKey } from "./buckets";
import type { RawCourse, CourseRecord } from "./types";

export function normalize(text: string) {
  return text.toLowerCase().trim();
}

export function normalizeCourses(raw: RawCourse[]): CourseRecord[] {
  return raw
    .map((course) => {
      const buckets = Array.isArray(course.eligible_buckets)
        ? course.eligible_buckets
        : Array.isArray(course.buckets)
          ? course.buckets
          : [];

      return {
        code: (course.code || "").trim(),
        title: (course.title || "").trim(),
        units: Number(course.units) || 0,
        status: course.status === "retired" ? "retired" : "active",
        aliases: Array.isArray(course.aliases) ? course.aliases : [],
        eligibleBuckets: buckets.filter(isBucketKey),
      };
    })
    .filter((course) => course.code && course.title && course.units > 0);
}

export function matchSdsuCourses(
  courses: CourseRecord[],
  query: string,
  showRetired: boolean,
) {
  const q = normalize(query);
  if (!q) return [];

  return courses.filter((course) => {
    if (!showRetired && course.status === "retired") return false;

    const haystack = [
      course.code,
      course.title,
      ...course.aliases,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  }).slice(0, 20);
}