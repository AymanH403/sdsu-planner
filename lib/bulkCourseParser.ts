import type { CourseRecord } from "./types";

export type BulkParseResult = {
  matched: CourseRecord[];
  unmatched: string[];
};

function normalizeCourseCode(input: string) {
  return input
    .toUpperCase()
    .replace(/[,\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseBulkCourseInput(
  input: string,
  catalog: CourseRecord[],
): BulkParseResult {
  const catalogByCode = new Map(
    catalog.map((course) => [course.code.toUpperCase(), course]),
  );

  const rawLines = input
    .split(/\n|;/)
    .map((line) => normalizeCourseCode(line))
    .filter(Boolean);

  const found: CourseRecord[] = [];
  const unmatched: string[] = [];
  const seen = new Set<string>();

  for (const line of rawLines) {
    const direct = catalogByCode.get(line);

    if (direct) {
      if (!seen.has(direct.code)) {
        found.push(direct);
        seen.add(direct.code);
      }
      continue;
    }

    const looseMatch = line.match(/^([A-Z&]+(?:\s+[A-Z&]+){0,2})\s*(\d{2,3}[A-Z]{0,3})$/);

    if (looseMatch) {
      const prefix = looseMatch[1].replace(/\s+/g, " ").trim();
      const number = looseMatch[2].trim();
      const normalizedCode = `${prefix} ${number}`;

      const course = catalogByCode.get(normalizedCode);

      if (course) {
        if (!seen.has(course.code)) {
          found.push(course);
          seen.add(course.code);
        }
        continue;
      }
    }

    unmatched.push(line);
  }

  return { matched: found, unmatched };
}