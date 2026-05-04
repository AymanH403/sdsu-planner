import type { RequirementBucket, RulesetId } from "./types";

export type Ruleset = {
  id: RulesetId;
  label: string;
  totalUnitsRequired: number;
  requirements: {
    bucket: Exclude<RequirementBucket, "general">;
    label: string;
    requiredUnits: number;
  }[];
};

export const RULESETS: Record<RulesetId, Ruleset> = {
  CA_EXAM_LEGACY_2026: {
    id: "CA_EXAM_LEGACY_2026",
    label: "California CPA Exam Eligibility",
    totalUnitsRequired: 120,
    requirements: [
      { bucket: "accounting", label: "Accounting Subjects", requiredUnits: 24 },
      { bucket: "business", label: "Business-Related Subjects", requiredUnits: 24 },
    ],
  },

  CA_LICENSURE_LEGACY_2026_TO_2028: {
    id: "CA_LICENSURE_LEGACY_2026_TO_2028",
    label: "California Legacy Licensure Planning",
    totalUnitsRequired: 150,
    requirements: [
      { bucket: "accounting", label: "Accounting Subjects", requiredUnits: 24 },
      { bucket: "business", label: "Business-Related Subjects", requiredUnits: 24 },
      { bucket: "accounting_study", label: "Accounting Study", requiredUnits: 20 },
      { bucket: "ethics", label: "Ethics Study", requiredUnits: 10 },
    ],
  },

  CA_2027_PLUS: {
    id: "CA_2027_PLUS",
    label: "California 2027+ Planning",
    totalUnitsRequired: 120,
    requirements: [
      { bucket: "accounting", label: "Accounting Subjects", requiredUnits: 24 },
      { bucket: "business", label: "Business-Related Subjects", requiredUnits: 24 },
      { bucket: "ethics", label: "Ethics", requiredUnits: 3 },
    ],
  },
};

export const DEFAULT_RULESET_ID: RulesetId = "CA_EXAM_LEGACY_2026";