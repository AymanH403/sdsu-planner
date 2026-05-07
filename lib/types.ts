export type RequirementBucket =
  | "accounting"
  | "business"
  | "ethics"
  | "accounting_study"
  | "general";

export type RulesetId =
  | "CA_EXAM_LEGACY_2026"
  | "CA_LICENSURE_LEGACY_2026_TO_2028"
  | "CA_2027_PLUS";

export type RawCourse = {
  code?: string;
  prefix?: string;
  number?: string;
  title?: string;
  units?: number | null;
  unit_min?: number | null;
  unit_max?: number | null;
  variable_units?: boolean;
  status?: string;
  source_url?: string;
  aliases?: string[];
  needs_detail_review?: boolean;
};

export type CourseRecord = {
  code: string;
  prefix: string;
  number: string;
  title: string;
  units: number;
  unitMin: number;
  unitMax: number;
  variableUnits: boolean;
  status: "active" | "retired";
  sourceUrl?: string;
  aliases: string[];
  needsDetailReview: boolean;
};

export type CandidateBucket = {
  bucket: RequirementBucket;
  confidence: number;
  reason: string;
};

export type PlannerTerm = {
  id: string;
  name: string;
  sortOrder: number;
};

export type PlannerEntry = {
  id: string;
  sourceType: "sdsu" | "transfer" | "manual" | "transcript";
  code: string;
  prefix: string;
  number: string;
  title: string;
  units: number;
  unitMin: number;
  unitMax: number;
  variableUnits: boolean;
  sourceUrl?: string;
  candidateBuckets: CandidateBucket[];
  needsReview: boolean;
  reviewReason?: string;
  manualBucketOverride?: RequirementBucket;
  termId?: string;
};

export type Allocation = {
  entryId: string;
  code: string;
  title: string;
  units: number;
  allocatedTo: RequirementBucket;
  confidence: number;
  reason: string;
  isManualOverride?: boolean;
};

export type AuditLogEntry = {
  timestamp: number;
  code: string;
  title: string;
  units: number;
  fromBucket?: RequirementBucket;
  toBucket: RequirementBucket;
  reason: string;
  isReallocation: boolean;
};

export type RequirementResult = {
  bucket: RequirementBucket;
  label: string;
  requiredUnits: number;
  completedUnits: number;
  remainingUnits: number;
  percent: number;
};

export type AuditResult = {
  rulesetId: RulesetId;
  totalUnits: number;
  totalUnitsRequired: number;
  totalUnitsPercent: number;
  requirements: RequirementResult[];
  allocations: Allocation[];
  generalCourses: Allocation[];
  auditLog: AuditLogEntry[];
  reviewCourses: PlannerEntry[];
  isEligibleEstimate: boolean;
  warnings: string[];
};

export type PlanSnapshot = {
  version: 2;
  exportedAt?: string;
  terms: PlannerTerm[];
  entries: PlannerEntry[];
  rulesetId: RulesetId;
};