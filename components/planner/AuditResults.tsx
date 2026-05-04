"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";
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
  const [showDetails, setShowDetails] = useState(false);
  const [showSystemAllocations, setShowSystemAllocations] = useState(false);

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
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

        <div className="mt-6 space-y-5">
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
      </div>

      {audit.warnings.length > 0 && (
        <div className="rounded-[28px] border border-amber-300/30 bg-amber-300/10 p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold text-amber-200">
            <AlertTriangle className="h-5 w-5" />
            Warnings
          </div>
          <div className="space-y-2 text-sm text-amber-100/90">
            {audit.warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-white/10 bg-zinc-950 p-5 shadow-2xl">
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <h3 className="text-lg font-semibold text-white">Audit Details</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Hidden by default to keep the main page clean.
            </p>
          </div>

          <ChevronDown
            className={[
              "h-5 w-5 text-zinc-400 transition",
              showDetails ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>

        {showDetails && (
          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={showSystemAllocations}
                onChange={(e) => setShowSystemAllocations(e.target.checked)}
              />
              Show system allocations
            </label>

            {showSystemAllocations && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
                  <h4 className="mb-4 font-semibold text-white">System Allocations</h4>

                  {audit.allocations.length === 0 ? (
                    <div className="text-sm text-zinc-500">No requirement allocations yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {audit.allocations.map((allocation) => (
                        <div
                          key={`${allocation.entryId}-${allocation.allocatedTo}`}
                          className="rounded-2xl bg-white/5 p-4"
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                            <div>
                              <div className="font-medium text-white">
                                {allocation.code} → {allocation.allocatedTo.replace("_", " ")}
                              </div>
                              <div className="text-sm text-zinc-400">{allocation.title}</div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {allocation.units} units · {Math.round(allocation.confidence * 100)}%
                              </div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {allocation.reason}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
                  <h4 className="mb-4 font-semibold text-white">General / Total-Only</h4>

                  {audit.generalCourses.length === 0 ? (
                    <div className="text-sm text-zinc-500">No general courses yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {audit.generalCourses.map((allocation) => (
                        <div key={allocation.entryId} className="rounded-2xl bg-white/5 p-4">
                          <div className="font-medium text-white">{allocation.code}</div>
                          <div className="text-sm text-zinc-400">{allocation.title}</div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {allocation.units} units · {allocation.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
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

      <div className="relative h-8 overflow-hidden rounded-full bg-white/10">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${color}`}
          style={{ width: barWidth(percent) }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white mix-blend-difference">
          {current} / {target}
        </div>
      </div>
    </div>
  );
}