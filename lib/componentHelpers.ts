import type { AuditResult, PlannerEntry, RequirementBucket } from "./types";

/**
 * Determine the automatically-allocated bucket for a course entry.
 * Checks allocations first, then general courses, defaults to general.
 */
export function autoBucketFor(
  entryId: string,
  audit: AuditResult,
): RequirementBucket {
  const allocation = audit.allocations.find((a) => a.entryId === entryId);
  if (allocation) return allocation.allocatedTo;

  const general = audit.generalCourses.find((a) => a.entryId === entryId);
  if (general) return "general";

  return "general";
}

/**
 * Get the effective bucket for a course entry.
 * Takes into account manual overrides, otherwise returns auto-allocated bucket.
 */
export function effectiveBucket(
  entry: PlannerEntry,
  audit: AuditResult,
): RequirementBucket {
  return entry.manualBucketOverride ?? autoBucketFor(entry.id, audit);
}

/**
 * Get the display bucket for a course entry (alias for effectiveBucket).
 * Useful for UI display purposes.
 */
export function bucketFor(
  entry: PlannerEntry,
  audit: AuditResult,
): RequirementBucket {
  return effectiveBucket(entry, audit);
}

/**
 * Determine if a course can be dropped into a specific bucket.
 * Manual courses can go anywhere. Auto courses can only go to allowed buckets or general.
 */
export function canDrop(
  entry: PlannerEntry | undefined,
  bucket: RequirementBucket,
): boolean {
  if (!entry) return false;
  if (entry.sourceType === "manual") return true;
  if (bucket === "general") return true;
  return entry.candidateBuckets.some((candidate) => candidate.bucket === bucket);
}

/**
 * Find the allocation for an entry within the audit result.
 */
export function findAllocationFor(
  entryId: string,
  audit: AuditResult,
) {
  return audit.allocations.find((a) => a.entryId === entryId);
}

/**
 * Check if a course is in the general bucket.
 */
export function isInGeneralBucket(
  entry: PlannerEntry,
  audit: AuditResult,
): boolean {
  return effectiveBucket(entry, audit) === "general";
}
