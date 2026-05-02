import type { BucketKey, DropBucket } from "./types";

export const TARGETS: Record<Exclude<BucketKey, "general">, number> = {
  accounting: 24,
  business: 24,
  ethics: 3,
  accounting_study: 20,
};

export const BUCKET_META: Record<BucketKey, { label: string; short: string }> = {
  accounting: { label: "Accounting", short: "ACCTG" },
  business: { label: "Business", short: "BUS" },
  ethics: { label: "Ethics", short: "Ethics" },
  accounting_study: { label: "Accounting Study", short: "Acct Study" },
  general: { label: "General", short: "General" },
};

export function bucketTitle(bucket: DropBucket) {
  return bucket === "unassigned" ? "Unassigned" : BUCKET_META[bucket].label;
}

export function isBucketKey(value: string): value is BucketKey {
  return (
    value === "accounting" ||
    value === "business" ||
    value === "ethics" ||
    value === "accounting_study" ||
    value === "general"
  );
}

export function bucketPillClass(bucket: BucketKey) {
  if (bucket === "accounting") return "bg-sky-100 text-sky-800 border-sky-200";
  if (bucket === "business") return "bg-violet-100 text-violet-800 border-violet-200";
  if (bucket === "ethics") return "bg-amber-100 text-amber-800 border-amber-200";
  if (bucket === "accounting_study") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function bucketRowClass(bucket: DropBucket) {
  if (bucket === "unassigned") return "border-slate-200 bg-slate-50";
  if (bucket === "general") return "border-stone-200 bg-stone-50/60";
  if (bucket === "accounting") return "border-sky-200 bg-sky-50/60";
  if (bucket === "business") return "border-violet-200 bg-violet-50/60";
  if (bucket === "ethics") return "border-amber-200 bg-amber-50/60";
  return "border-emerald-200 bg-emerald-50/60";
}