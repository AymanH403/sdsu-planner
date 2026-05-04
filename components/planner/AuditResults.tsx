import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { AuditResult } from "@/lib/types";

type Props = {
  audit: AuditResult;
};

function barWidth(percent: number) {
  return `${Math.max(0, Math.min(100, percent))}%`;
}

export function AuditResults({ audit }: Props) {
  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Automatic Audit Result
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Units are allocated automatically based on the selected ruleset.
            </p>
          </div>

          <div
            className={[
              "rounded-2xl px-4 py-2 text-sm font-medium",
              audit.isExamEligibleEstimate
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800",
            ].join(" ")}
          >
            {audit.isExamEligibleEstimate ? "Looks eligible" : "Not complete yet"}
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-slate-800">Total Units</span>
              <span className="text-slate-500">
                {audit.totalUnits} / {audit.totalUnitsRequired}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{ width: barWidth(audit.totalUnitsPercent) }}
              />
            </div>
          </div>

          {audit.requirements.map((req) => (
            <div key={req.bucket}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-800">{req.label}</span>
                <span className="text-slate-500">
                  {req.completedUnits} / {req.requiredUnits}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: barWidth(req.percent) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {audit.warnings.length > 0 && (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            Warnings
          </div>
          <div className="space-y-2 text-sm text-amber-800">
            {audit.warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            System Allocations
          </h3>
          {audit.allocations.length === 0 ? (
            <div className="text-sm text-slate-500">No requirement allocations yet.</div>
          ) : (
            <div className="space-y-3">
              {audit.allocations.map((allocation) => (
                <div key={`${allocation.entryId}-${allocation.allocatedTo}`} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="font-medium text-slate-900">
                        {allocation.code} → {allocation.allocatedTo.replace("_", " ")}
                      </div>
                      <div className="text-sm text-slate-600">{allocation.title}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {allocation.units} units · {Math.round(allocation.confidence * 100)}% confidence
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{allocation.reason}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            General / Total-Only Courses
          </h3>
          {audit.generalCourses.length === 0 ? (
            <div className="text-sm text-slate-500">No general courses yet.</div>
          ) : (
            <div className="space-y-3">
              {audit.generalCourses.map((allocation) => (
                <div key={allocation.entryId} className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-medium text-slate-900">{allocation.code}</div>
                  <div className="text-sm text-slate-600">{allocation.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {allocation.units} units · {allocation.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {audit.reviewCourses.length > 0 && (
        <div className="rounded-[28px] border border-amber-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Needs Manual Review
          </h3>
          <div className="space-y-3">
            {audit.reviewCourses.map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-amber-50 p-4">
                <div className="font-medium text-amber-900">{entry.code}</div>
                <div className="text-sm text-amber-800">{entry.title}</div>
                <div className="mt-1 text-xs text-amber-700">{entry.reviewReason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}