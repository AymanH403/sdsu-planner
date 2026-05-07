"use client";

import type { AuditResult, PlannerEntry, PlannerTerm } from "@/lib/types";

type Props = {
  audit: AuditResult;
  entries: PlannerEntry[];
  terms: PlannerTerm[];
  onClose: () => void;
};

function allocationFor(entryId: string, audit: AuditResult) {
  return (
    audit.allocations.find((allocation) => allocation.entryId === entryId) ??
    audit.generalCourses.find((allocation) => allocation.entryId === entryId)
  );
}

function termNameFor(termId: string | undefined, terms: PlannerTerm[]) {
  if (!termId) return "Unassigned";
  return terms.find((term) => term.id === termId)?.name ?? "Unassigned";
}

export function EligibilityReport({ audit, entries, terms, onClose }: Props) {
  const today = new Date().toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/80 p-6 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl print:border-0 print:bg-white print:text-black">
        <div className="mb-6 flex items-start justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-2xl font-semibold text-white">CPA Eligibility Report</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Printable worksheet-style report based on your current planner.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
            >
              Print / Save PDF
            </button>

            <button
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>

        <article className="rounded-3xl bg-white p-8 text-black">
          <header className="border-b border-zinc-300 pb-5">
            <h1 className="text-3xl font-bold">CPA Eligibility Self-Assessment Report</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Generated on {today}. This is an unofficial planning report and should be verified against CBA guidance and advisor review.
            </p>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-4">
            <SummaryBox label="Total Units" value={`${audit.totalUnits} / ${audit.totalUnitsRequired}`} />
            {audit.requirements.map((req) => (
              <SummaryBox
                key={req.bucket}
                label={req.label}
                value={`${req.completedUnits} / ${req.requiredUnits}`}
              />
            ))}
          </section>

          {audit.warnings.length > 0 && (
            <section className="mt-6 rounded-2xl border border-amber-400 bg-amber-50 p-4">
              <h2 className="font-bold">Warnings / Review Notes</h2>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {audit.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold">Requirement Worksheet</h2>

            <div className="overflow-hidden rounded-2xl border border-zinc-300">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-zinc-100">
                  <tr>
                    <th className="border-b border-zinc-300 p-3 text-left">Requirement</th>
                    <th className="border-b border-zinc-300 p-3 text-left">Required</th>
                    <th className="border-b border-zinc-300 p-3 text-left">Completed</th>
                    <th className="border-b border-zinc-300 p-3 text-left">Remaining</th>
                    <th className="border-b border-zinc-300 p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-zinc-200 p-3">Total Units</td>
                    <td className="border-b border-zinc-200 p-3">{audit.totalUnitsRequired}</td>
                    <td className="border-b border-zinc-200 p-3">{audit.totalUnits}</td>
                    <td className="border-b border-zinc-200 p-3">
                      {Math.max(0, audit.totalUnitsRequired - audit.totalUnits)}
                    </td>
                    <td className="border-b border-zinc-200 p-3">
                      {audit.totalUnits >= audit.totalUnitsRequired ? "Met" : "Incomplete"}
                    </td>
                  </tr>

                  {audit.requirements.map((req) => (
                    <tr key={req.bucket}>
                      <td className="border-b border-zinc-200 p-3">{req.label}</td>
                      <td className="border-b border-zinc-200 p-3">{req.requiredUnits}</td>
                      <td className="border-b border-zinc-200 p-3">{req.completedUnits}</td>
                      <td className="border-b border-zinc-200 p-3">{req.remainingUnits}</td>
                      <td className="border-b border-zinc-200 p-3">
                        {req.remainingUnits <= 0 ? "Met" : "Incomplete"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold">Course Allocation Detail</h2>

            <div className="overflow-hidden rounded-2xl border border-zinc-300">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-zinc-100">
                  <tr>
                    <th className="border-b border-zinc-300 p-3 text-left">Term</th>
                    <th className="border-b border-zinc-300 p-3 text-left">Course</th>
                    <th className="border-b border-zinc-300 p-3 text-left">Title</th>
                    <th className="border-b border-zinc-300 p-3 text-left">Units</th>
                    <th className="border-b border-zinc-300 p-3 text-left">Allocated To</th>
                    <th className="border-b border-zinc-300 p-3 text-left">Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => {
                    const allocation = allocationFor(entry.id, audit);

                    return (
                      <tr key={entry.id}>
                        <td className="border-b border-zinc-200 p-3">
                          {termNameFor(entry.termId, terms)}
                        </td>
                        <td className="border-b border-zinc-200 p-3 font-semibold">{entry.code}</td>
                        <td className="border-b border-zinc-200 p-3">{entry.title}</td>
                        <td className="border-b border-zinc-200 p-3">{entry.units}</td>
                        <td className="border-b border-zinc-200 p-3">
                          {allocation?.allocatedTo?.replace("_", " ") ?? "General"}
                        </td>
                        <td className="border-b border-zinc-200 p-3">
                          {entry.manualBucketOverride ? "Manual override. " : ""}
                          {entry.needsReview ? "Needs review. " : ""}
                          {allocation?.reason ?? ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="mt-8 border-t border-zinc-300 pt-4 text-xs text-zinc-600">
            This report is not an official determination of CPA eligibility. Final evaluation should be verified using California Board of Accountancy materials and official transcripts.
          </footer>
        </article>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-300 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}