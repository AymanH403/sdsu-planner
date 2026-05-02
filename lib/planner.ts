import { TARGETS, isBucketKey } from "./buckets";
import type { BucketKey, DropBucket, PlannerEntry } from "./types";

export function totalsFromEntries(entries: PlannerEntry[]) {
  const totals: Record<BucketKey, number> = {
    accounting: 0,
    business: 0,
    ethics: 0,
    accounting_study: 0,
    general: 0,
  };

  for (const entry of entries) {
    if (entry.assignedBucket !== "unassigned" && isBucketKey(entry.assignedBucket)) {
      totals[entry.assignedBucket] += entry.units;
    }
  }

  return totals;
}

export function totalUnitsFromEntries(entries: PlannerEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.units, 0);
}

export function entriesInBucket(entries: PlannerEntry[], bucket: DropBucket) {
  return entries.filter((entry) => entry.assignedBucket === bucket);
}

export function canDropIntoBucket(entry: PlannerEntry | undefined, bucket: DropBucket) {
  if (!entry) return false;
  if (bucket === "unassigned") return true;
  if (entry.eligibleBuckets.length === 0) return true;
  return entry.eligibleBuckets.includes(bucket);
}

export function suggestedBucket(
  eligibleBuckets: BucketKey[],
  currentTotals: Record<BucketKey, number>,
): DropBucket {
  if (eligibleBuckets.length === 0) return "unassigned";

  const priorityBuckets = eligibleBuckets.filter((bucket) => bucket !== "general");

  if (priorityBuckets.length === 0) return "general";

  const sorted = [...priorityBuckets].sort((a, b) => {
    const aTarget = a in TARGETS ? TARGETS[a as Exclude<BucketKey, "general">] : 0;
    const bTarget = b in TARGETS ? TARGETS[b as Exclude<BucketKey, "general">] : 0;
    const aNeed = aTarget - currentTotals[a];
    const bNeed = bTarget - currentTotals[b];
    return bNeed - aNeed;
  });

  return sorted[0];
}