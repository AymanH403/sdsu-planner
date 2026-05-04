import type {
  CandidateBucket,
  CourseRecord,
  RequirementBucket,
} from "./types";

function titleHas(title: string, terms: string[]) {
  const t = title.toLowerCase();
  return terms.some((term) => t.includes(term.toLowerCase()));
}

function addCandidate(
  candidates: CandidateBucket[],
  bucket: RequirementBucket,
  confidence: number,
  reason: string,
) {
  const existing = candidates.find((c) => c.bucket === bucket);

  if (!existing) {
    candidates.push({ bucket, confidence, reason });
    return;
  }

  if (confidence > existing.confidence) {
    existing.confidence = confidence;
    existing.reason = reason;
  }
}

export function classifyCourse(course: CourseRecord): {
  candidateBuckets: CandidateBucket[];
  needsReview: boolean;
  reviewReason?: string;
} {
  const candidates: CandidateBucket[] = [];

  const prefix = course.prefix.toUpperCase();
  const title = course.title.toLowerCase();

  const reviewTerms = [
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
  ];

  let needsReview = course.needsDetailReview || titleHas(title, reviewTerms);
  let reviewReason = needsReview
    ? "Generic, variable, research, internship, extension, or detail-review course."
    : undefined;

  if (course.units === 0) {
    needsReview = true;
    reviewReason = "Zero-unit course. It should not contribute to CPA unit totals.";
  }

  /**
   * Accounting subjects
   */
  if (prefix === "ACCTG") {
    addCandidate(
      candidates,
      "accounting",
      0.97,
      "ACCTG prefix is a strong accounting-subject signal.",
    );

    if (!["201", "202"].includes(course.number)) {
      addCandidate(
        candidates,
        "accounting_study",
        0.9,
        "Advanced or upper-division accounting course can support accounting study planning.",
      );
    }
  }

  if (
    titleHas(title, [
      "accounting",
      "auditing",
      "assurance",
      "taxation",
      "tax",
      "financial reporting",
      "financial statement",
      "cost management",
      "managerial accounting",
      "forensic accounting",
    ])
  ) {
    addCandidate(
      candidates,
      "accounting",
      0.88,
      "Course title contains accounting, audit, tax, reporting, or financial-statement language.",
    );
  }

  /**
   * Business-related subjects
   */
  if (["B A", "FIN", "ECON", "MIS", "MKTG", "STAT", "MGT"].includes(prefix)) {
    addCandidate(
      candidates,
      "business",
      0.94,
      `${prefix} is generally business-related for CPA planning.`,
    );
  }

  if (
    titleHas(title, [
      "business",
      "economics",
      "finance",
      "marketing",
      "management",
      "information systems",
      "data analytics",
      "statistics",
      "business law",
      "legal environment",
      "operations",
      "supply chain",
      "entrepreneurship",
      "organizational behavior",
      "business communication",
    ])
  ) {
    addCandidate(
      candidates,
      "business",
      0.84,
      "Course title contains business-related subject matter.",
    );
  }

  /**
   * Ethics
   */
  if (
    titleHas(title, [
      "ethics",
      "ethical",
      "professional responsibilities",
      "fraud",
      "corporate governance",
      "business law",
      "legal environment",
      "organizational behavior",
      "auditing",
      "assurance",
    ])
  ) {
    addCandidate(
      candidates,
      "ethics",
      titleHas(title, ["ethics", "ethical", "professional responsibilities"]) ? 0.96 : 0.72,
      "Course title suggests ethics, law, fraud, governance, auditing, or professional responsibility content.",
    );
  }

  /**
   * Default fallback handled by audit engine.
   * No candidate buckets means general units only.
   */

  return {
    candidateBuckets: candidates.sort((a, b) => b.confidence - a.confidence),
    needsReview,
    reviewReason,
  };
}