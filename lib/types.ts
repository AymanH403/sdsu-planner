export type BucketKey =
  | "accounting"
  | "business"
  | "ethics"
  | "accounting_study"
  | "general";

export type DropBucket = BucketKey | "unassigned";

export type RawCourse = {
  code?: string;
  title?: string;
  units?: number;
  status?: string;
  aliases?: string[];
  buckets?: string[];
  eligible_buckets?: string[];
};

export type CourseRecord = {
  code: string;
  title: string;
  units: number;
  status: "active" | "retired";
  aliases: string[];
  eligibleBuckets: BucketKey[];
};

export type PlannerEntry = {
  id: string;
  sourceType: "sdsu" | "transfer" | "legacy_sdsu";
  code: string;
  title: string;
  units: number;
  eligibleBuckets: BucketKey[];
  assignedBucket: DropBucket;
  detail: string;
};

export type PlanSnapshot = {
  entries: PlannerEntry[];
};