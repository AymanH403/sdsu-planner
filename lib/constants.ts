import type { RequirementBucket } from "./types";

// Seasons and their ordering
export const SEASONS = ["FALL", "SPRING", "SUMMER", "WINTER"] as const;

export const SEASON_RANK: Record<string, number> = {
  WINTER: 0,
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
};

// Requirement buckets
export const REQUIREMENT_BUCKETS: RequirementBucket[] = [
  "accounting",
  "business",
  "ethics",
  "accounting_study",
  "general",
];

// Manual assignment options
export const ALL_MANUAL_BUCKETS: RequirementBucket[] = [
  "accounting",
  "business",
  "ethics",
  "accounting_study",
  "general",
];

// Storage keys
export const STORAGE_KEYS = {
  PLAN: "sdsu-planner-auto-audit-v2",
  AUDIT_LOG: "sdsu-planner-audit-log-v1",
} as const;

// Course review terms (courses that need manual review)
export const REVIEW_TERMS = [
  "experimental topics",
  "selected topics",
  "special topics",
  "special study",
  "independent study",
  "research",
  "internship",
  "thesis",
  "project extension",
  "comprehensive examination extension",
] as const;
