import type { CourseRecord } from "./types";
import {
  compactCourseCode,
  findCourseByFlexibleCode,
  suggestCourseByFlexibleCode,
} from "./courses";

export type BulkSuggestion = {
  input: string;
  suggestedCourse: CourseRecord;
};

export type BulkParseResult = {
  matched: CourseRecord[];
  unmatched: string[];
  suggestions: BulkSuggestion[];
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
  const rawLines = input
    .split(/\n|;/)
    .map((line) => normalizeCourseCode(line))
    .filter(Boolean);

  const matched: CourseRecord[] = [];
  const unmatched: string[] = [];
  const suggestions: BulkSuggestion[] = [];
  const seen = new Set<string>();

  for (const line of rawLines) {
    const exact = findCourseByFlexibleCode(catalog, line);

    if (exact) {
      if (!seen.has(exact.code)) {
        matched.push(exact);
        seen.add(exact.code);
      }
      continue;
    }

    const suggestion = suggestCourseByFlexibleCode(catalog, line);

    if (suggestion && compactCourseCode(suggestion.code).slice(0, 4) === compactCourseCode(line).slice(0, 4)) {
      suggestions.push({
        input: line,
        suggestedCourse: suggestion,
      });
      continue;
    }

    unmatched.push(line);
  }

  return { matched, unmatched, suggestions };
}