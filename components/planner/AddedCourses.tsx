import { Trash2 } from "lucide-react";
import type { AuditResult, PlannerEntry, RequirementBucket } from "@/lib/types";

type Props = {
  entries: PlannerEntry[];
  audit: AuditResult;
  onRemoveEntry: (id: string) => void;
  onUpdateUnits: (id: string, units: number) => void;
};

function autoBucketFor(entryId: string, audit: AuditResult): RequirementBucket {
  const allocation = audit.allocations.find((a) => a.entryId === entryId);
  if (allocation) return allocation.allocatedTo;

  const general = audit.generalCourses.find((a) => a.entryId === entryId);
  if (general) return "general";

  return "general";
}

function bucketFor(entry: PlannerEntry, audit: AuditResult): RequirementBucket {
  return entry.manualBucketOverride ?? autoBucketFor(entry.id, audit);
}

function bucketClass(bucket: RequirementBucket) {
  if (bucket === "accounting") return "bg-red-500 text-white";
  if (bucket === "business") return "bg-blue-500 text-white";
  if (bucket === "ethics") return "bg-amber-300 text-black";
  if (bucket === "accounting_study") return "bg-purple-500 text-white";
  return "bg-emerald-300 text-black";
}

function borderClass(bucket: RequirementBucket) {
  if (bucket === "accounting") return "border-red-500/40 bg-red-500/10";
  if (bucket === "business") return "border-blue-500/40 bg-blue-500/10";
  if (bucket === "ethics") return "border-amber-300/40 bg-amber-300/10";
  if (bucket === "accounting_study") return "border-purple-500/40 bg-purple-500/10";
  return "border-emerald-300/40 bg-emerald-300/10";
}

export function AddedCourses({ entries, audit, onRemoveEntry, onUpdateUnits }: Props) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Added Courses
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Course cards show current assignment, units, and review status.
          </p>
        </div>

        <div className="rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-300">
          {entries.length} courses
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">
          No courses added yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {entries.map((entry) => {
            const bucket = bucketFor(entry, audit);

            return (
              <div
                key={entry.id}
                className={[
                  "relative flex min-h-[190px] flex-col justify-between rounded-[28px] border p-5 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl",
                  borderClass(bucket),
                ].join(" ")}
              >
                <button
                  onClick={() => onRemoveEntry(entry.id)}
                  className="absolute right-4 top-4 rounded-xl p-2 text-zinc-500 hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="pr-10">
                  <div className="text-xl font-semibold tracking-tight text-white">
                    {entry.code}
                  </div>

                  <div className="mt-2 line-clamp-2 text-base font-medium leading-6 text-zinc-200">
                    {entry.title}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-sm font-medium text-zinc-200">
                      {entry.units} units
                    </span>

                    <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${bucketClass(bucket)}`}>
                      {bucket.replace("_", " ")}
                    </span>

                    {entry.needsReview && (
                      <span
                        title={entry.reviewReason}
                        className="rounded-full bg-amber-300 px-4 py-1.5 text-sm font-semibold text-black"
                      >
                        review
                      </span>
                    )}

                    {entry.manualBucketOverride && (
                      <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-zinc-300">
                        manual
                      </span>
                    )}
                  </div>

                  {entry.variableUnits && (
                    <label className="flex items-center gap-2 rounded-2xl bg-black/30 px-3 py-2 text-xs text-zinc-300">
                      units
                      <input
                        type="number"
                        min={entry.unitMin}
                        max={entry.unitMax}
                        step={0.5}
                        value={entry.units}
                        onChange={(e) => onUpdateUnits(entry.id, Number(e.target.value))}
                        className="w-16 rounded-lg border border-white/10 bg-black px-2 py-1 text-white outline-none"
                      />
                      <span className="text-zinc-500">
                        range {entry.unitMin}-{entry.unitMax}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}