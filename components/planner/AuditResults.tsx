import { AlertTriangle } from "lucide-react";
import type { AuditResult } from "@/lib/types";

type Props = {
  audit: AuditResult;
};

function barWidth(percent: number) {
  return `${Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))}%`;
}

function bucketColor(bucket: string) {
  if (bucket === "accounting") return "bg-red-500";
  if (bucket === "business") return "bg-blue-500";
  if (bucket === "ethics") return "bg-amber-300";
  if (bucket === "accounting_study") return "bg-purple-500";
  return "bg-emerald-300";
}

export function AuditResults({ audit }: Props) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Progress
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Courses auto-assign first. Manual overrides update these bars.
          </p>
        </div>

        <div
          className={[
            "rounded-2xl px-4 py-2 text-sm font-medium",
            audit.isEligibleEstimate
              ? "bg-emerald-300 text-black"
              : "bg-amber-300 text-black",
          ].join(" ")}
        >
          {audit.isEligibleEstimate ? "Looks eligible" : "Not complete yet"}
        </div>
      </div>

      <div className="mt-7 space-y-7">
        <ProgressBar
          label="Total Units"
          current={audit.totalUnits}
          target={audit.totalUnitsRequired}
          percent={audit.totalUnitsPercent}
          color="bg-emerald-300"
        />

        {audit.requirements.map((req) => (
          <ProgressBar
            key={req.bucket}
            label={req.label}
            current={req.completedUnits}
            target={req.requiredUnits}
            percent={req.percent}
            color={bucketColor(req.bucket)}
          />
        ))}
      </div>
    </section>
  );
}

export function AuditWarnings({ audit }: Props) {
  if (audit.warnings.length === 0) return null;

  return (
    <section className="rounded-[28px] border border-amber-300/30 bg-amber-300/10 p-5">
      <div className="mb-3 flex items-center gap-2 font-semibold text-amber-200">
        <AlertTriangle className="h-5 w-5" />
        Warnings
      </div>

      <div className="space-y-2 text-sm text-amber-100/90">
        {audit.warnings.map((warning) => (
          <div key={warning}>{warning}</div>
        ))}
      </div>

      {audit.reviewCourses.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-300/20 bg-black/20 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200">
            Needs review
          </div>

          <div className="flex flex-wrap gap-2">
            {audit.reviewCourses.map((course) => (
              <span
                key={course.id}
                title={course.reviewReason}
                className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-black"
              >
                {course.code}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ProgressBar({
  label,
  current,
  target,
  percent,
  color,
}: {
  label: string;
  current: number;
  target: number;
  percent: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium text-zinc-200">{label}</span>
      </div>

      <div className="relative h-12 overflow-hidden rounded-2xl bg-white/10">
        <div
          className={`absolute inset-y-0 left-0 rounded-2xl transition-all ${color}`}
          style={{ width: barWidth(percent) }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xl font-black tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          {current} / {target}
        </div>
      </div>
    </div>
  );
}