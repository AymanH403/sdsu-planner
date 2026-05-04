import { RULESETS } from "./rulesets";
import type {
  Allocation,
  AuditResult,
  PlannerEntry,
  RequirementBucket,
  RulesetId,
} from "./types";

function candidateFor(entry: PlannerEntry, bucket: RequirementBucket) {
  return entry.candidateBuckets.find((candidate) => candidate.bucket === bucket);
}

function entryCanUseBucket(entry: PlannerEntry, bucket: RequirementBucket) {
  return Boolean(candidateFor(entry, bucket));
}

function scarcityScore(entry: PlannerEntry, bucket: RequirementBucket, activeBuckets: RequirementBucket[]) {
  const usableBuckets = activeBuckets.filter((b) => entryCanUseBucket(entry, b));

  /**
   * Lower flexibility = higher priority.
   * Example: FIN course only useful for business should be used before
   * ACCTG course that can potentially cover accounting/accounting_study/ethics.
   */
  const flexibilityPenalty = usableBuckets.length;

  const candidate = candidateFor(entry, bucket);
  const confidence = candidate?.confidence ?? 0;

  return confidence * 100 - flexibilityPenalty * 5;
}

export function auditPlan(entries: PlannerEntry[], rulesetId: RulesetId): AuditResult {
  const ruleset = RULESETS[rulesetId];

  const totalUnits = entries.reduce((sum, entry) => sum + entry.units, 0);
  const used = new Set<string>();
  const allocations: Allocation[] = [];
  const warnings: string[] = [];

  const activeBuckets = ruleset.requirements.map((req) => req.bucket);

  const progress: Record<string, number> = {};
  for (const req of ruleset.requirements) {
    progress[req.bucket] = 0;
  }

  /**
   * 1. Apply manual overrides first.
   */
  for (const entry of entries) {
    if (!entry.manualBucketOverride) continue;
    if (entry.manualBucketOverride === "general") continue;

    const req = ruleset.requirements.find((r) => r.bucket === entry.manualBucketOverride);
    if (!req) continue;

    const candidate = candidateFor(entry, entry.manualBucketOverride);

    used.add(entry.id);
    progress[entry.manualBucketOverride] += entry.units;

    allocations.push({
      entryId: entry.id,
      code: entry.code,
      title: entry.title,
      units: entry.units,
      allocatedTo: entry.manualBucketOverride,
      confidence: candidate?.confidence ?? 0.5,
      reason: candidate?.reason ?? "User manually assigned this course.",
      isManualOverride: true,
    });
  }

  /**
   * 2. Fill hard requirements bucket by bucket.
   *
   * For the current MVP, this is greedy but scarcity-aware.
   * Later, replace this with real linear/integer optimization.
   */
  for (const req of ruleset.requirements) {
    while (progress[req.bucket] < req.requiredUnits) {
      const available = entries
        .filter((entry) => !used.has(entry.id))
        .filter((entry) => entry.units > 0)
        .filter((entry) => entryCanUseBucket(entry, req.bucket))
        .map((entry) => {
          const candidate = candidateFor(entry, req.bucket)!;
          const score = scarcityScore(entry, req.bucket, activeBuckets);

          return {
            entry,
            candidate,
            score,
          };
        })
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.candidate.confidence !== a.candidate.confidence) {
            return b.candidate.confidence - a.candidate.confidence;
          }
          return b.entry.units - a.entry.units;
        });

      const chosen = available[0];
      if (!chosen) break;

      used.add(chosen.entry.id);
      progress[req.bucket] += chosen.entry.units;

      allocations.push({
        entryId: chosen.entry.id,
        code: chosen.entry.code,
        title: chosen.entry.title,
        units: chosen.entry.units,
        allocatedTo: req.bucket,
        confidence: chosen.candidate.confidence,
        reason: chosen.candidate.reason,
      });
    }
  }

  /**
   * 3. Everything unused becomes general.
   */
  const generalCourses: Allocation[] = entries
    .filter((entry) => !used.has(entry.id))
    .map((entry) => ({
      entryId: entry.id,
      code: entry.code,
      title: entry.title,
      units: entry.units,
      allocatedTo: "general",
      confidence: entry.candidateBuckets.length === 0 ? 1 : 0.7,
      reason:
        entry.manualBucketOverride === "general"
          ? "User manually assigned this course to general units."
          : entry.candidateBuckets.length === 0
            ? "No CPA-specific candidate bucket; counted toward total units only."
            : "Not needed for selected requirements; counted toward total units.",
      isManualOverride: entry.manualBucketOverride === "general",
    }));

  const requirements = ruleset.requirements.map((req) => {
    const completed = progress[req.bucket] || 0;

    return {
      bucket: req.bucket,
      label: req.label,
      requiredUnits: req.requiredUnits,
      completedUnits: completed,
      remainingUnits: Math.max(0, req.requiredUnits - completed),
      percent: Math.min(100, Math.round((completed / req.requiredUnits) * 100)),
    };
  });

  const reviewCourses = entries.filter((entry) => entry.needsReview);

  if (totalUnits < ruleset.totalUnitsRequired) {
    warnings.push(`Missing ${ruleset.totalUnitsRequired - totalUnits} total unit(s).`);
  }

  for (const req of requirements) {
    if (req.remainingUnits > 0) {
      warnings.push(`Missing ${req.remainingUnits} unit(s) for ${req.label}.`);
    }
  }

  if (reviewCourses.length > 0) {
    warnings.push(`${reviewCourses.length} course(s) should be reviewed before relying on this estimate.`);
  }

  const isEligibleEstimate =
    totalUnits >= ruleset.totalUnitsRequired &&
    requirements.every((req) => req.remainingUnits === 0);

  return {
    rulesetId,
    totalUnits,
    totalUnitsRequired: ruleset.totalUnitsRequired,
    totalUnitsPercent: Math.min(100, Math.round((totalUnits / ruleset.totalUnitsRequired) * 100)),
    requirements,
    allocations,
    generalCourses,
    reviewCourses,
    isEligibleEstimate,
    warnings,
  };
}