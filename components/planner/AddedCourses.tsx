import { Trash2 } from "lucide-react";
import type { PlannerEntry } from "@/lib/types";

type Props = {
  entries: PlannerEntry[];
  onRemoveEntry: (id: string) => void;
};

export function AddedCourses({ entries, onRemoveEntry }: Props) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Added Courses
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          These courses are automatically classified and allocated by the audit engine.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          No courses added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4"
            >
              <div>
                <div className="font-semibold text-slate-900">
                  {entry.code}
                </div>
                <div className="text-sm text-slate-600">{entry.title}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">
                    {entry.units} units
                  </span>
                  {entry.candidateBuckets.length === 0 ? (
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">
                      general only
                    </span>
                  ) : (
                    entry.candidateBuckets.map((candidate) => (
                      <span
                        key={candidate.bucket}
                        className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600"
                      >
                        {candidate.bucket.replace("_", " ")}
                      </span>
                    ))
                  )}
                  {entry.needsReview && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700">
                      needs review
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onRemoveEntry(entry.id)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}