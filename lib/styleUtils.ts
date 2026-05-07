import type { RequirementBucket } from "./types";

/**
 * Centralized bucket styling configuration.
 * Each bucket has a label, badge color class, and card color class.
 */
export const BUCKET_STYLES: Record<
  RequirementBucket,
  { label: string; badge: string; card: string }
> = {
  accounting: {
    label: "Accounting",
    badge: "bg-red-500 text-white",
    card: "border-red-500/40 bg-red-500/10",
  },
  business: {
    label: "Business",
    badge: "bg-blue-500 text-white",
    card: "border-blue-500/40 bg-blue-500/10",
  },
  ethics: {
    label: "Ethics",
    badge: "bg-amber-300 text-black",
    card: "border-amber-300/40 bg-amber-300/10",
  },
  accounting_study: {
    label: "Accounting Study",
    badge: "bg-purple-500 text-white",
    card: "border-purple-500/40 bg-purple-500/10",
  },
  general: {
    label: "General",
    badge: "bg-emerald-300 text-black",
    card: "border-emerald-300/40 bg-emerald-300/10",
  },
};

/**
 * Get the label for a bucket type.
 */
export function getBucketLabel(bucket: RequirementBucket): string {
  return BUCKET_STYLES[bucket].label;
}

/**
 * Get the badge (pill) color classes for a bucket.
 */
export function getBucketBadgeClass(bucket: RequirementBucket): string {
  return BUCKET_STYLES[bucket].badge;
}

/**
 * Get the card color classes for a bucket.
 */
export function getBucketCardClass(bucket: RequirementBucket): string {
  return BUCKET_STYLES[bucket].card;
}

/**
 * Get all style classes for a bucket.
 */
export function getBucketStyles(bucket: RequirementBucket) {
  return BUCKET_STYLES[bucket];
}
