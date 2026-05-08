import type { AuditResult, PlannerEntry, RequirementBucket } from "@/lib/types";
import { BUCKET_STYLES, getBucketLabel, getBucketCardClass } from "@/lib/styleUtils";
import {
  autoBucketFor,
  effectiveBucket,
  canDrop,
} from "@/lib/componentHelpers";

type Props = {
  entries: PlannerEntry[];
  audit: AuditResult;
  draggingEntryId: string | null;
  setDraggingEntryId: (id: string | null) => void;
  onMoveEntry: (entryId: string, bucket: RequirementBucket | "auto") => void;
};

export function AllocationBoard({
  entries,
  audit,
  draggingEntryId,
  setDraggingEntryId,
  onMoveEntry,
}: Props) {
  const draggingEntry = entries.find((entry) => entry.id === draggingEntryId);

  const visibleBuckets = [
    ...audit.requirements.map((req) => req.bucket),
    "general" as RequirementBucket,
  ].filter((bucket, index, arr) => arr.indexOf(bucket) === index);

  return (
    <section className="rounded-[36px] border border-white/10 bg-zinc-950/90 p-6 shadow-2xl">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            allocation workspace
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Bucket Board
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Buckets shown here match the selected ruleset.
          </p>
        </div>

        <button
          onClick={() => entries.forEach((entry) => onMoveEntry(entry.id, "auto"))}
          className="rounded-2xl border border-white/10 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          Reset all to auto
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {visibleBuckets.map((bucket) => {
          const validDrop = canDrop(draggingEntry, bucket);
          const bucketEntries = entries.filter(
            (entry) => effectiveBucket(entry, audit) === bucket,
          );
          const total = bucketEntries.reduce((sum, entry) => sum + entry.units, 0);
          
          // Get requirement details for this bucket
          const requirement = audit.requirements.find((req) => req.bucket === bucket);
          const requiredUnits = requirement?.requiredUnits ?? 0;
          const percent = requiredUnits > 0 ? (total / requiredUnits) * 100 : 0;
          const bucketStyles = BUCKET_STYLES[bucket];

          return (
            <div
              key={bucket}
              onDragOver={(e) => {
                e.preventDefault();
                if (!draggingEntry || !validDrop) return;
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!draggingEntry || !validDrop) return;

                const effectiveBucketNow = effectiveBucket(draggingEntry, audit);

                // If already in this bucket, don't change anything
                if (effectiveBucketNow === bucket) {
                  setDraggingEntryId(null);
                  return;
                }

                const currentAutoBucket = autoBucketFor(draggingEntry.id, audit);

                if (bucket === currentAutoBucket) {
                  onMoveEntry(draggingEntry.id, "auto");
                } else {
                  onMoveEntry(draggingEntry.id, bucket);
                }

                setDraggingEntryId(null);
              }}
              className={[
                "min-h-[320px] rounded-[30px] border p-4 transition",
                getBucketCardClass(bucket),
                draggingEntry && !validDrop ? "opacity-35 grayscale" : "",
                draggingEntry && validDrop ? "ring-2 ring-white/40" : "",
              ].join(" ")}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{getBucketLabel(bucket)}</h3>
                  <p className="text-xs text-zinc-400">
                    {bucketEntries.length} courses
                  </p>
                </div>
              </div>

              {requirement && (
                <div className="mb-4">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-zinc-400">Progress</span>
                  </div>
                  <div className="relative h-8 overflow-hidden rounded-xl bg-white/10">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-xl transition-all ${bucketStyles.badge}`}
                      style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xl font-black tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                      {total} / {requiredUnits}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {bucketEntries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                    {draggingEntry && !validDrop ? "Not eligible here." : "Drop courses here."}
                  </div>
                ) : (
                  bucketEntries.map((entry) => (
                    <CourseCard
                      key={entry.id}
                      entry={entry}
                      setDraggingEntryId={setDraggingEntryId}
                      onReset={() => onMoveEntry(entry.id, "auto")}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CourseCard({
  entry,
  setDraggingEntryId,
  onReset,
}: {
  entry: PlannerEntry;
  setDraggingEntryId: (id: string | null) => void;
  onReset: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", entry.id);
        setDraggingEntryId(entry.id);
      }}
      onDragEnd={() => setDraggingEntryId(null)}
      title={entry.title}
      className="group cursor-grab select-none rounded-2xl border border-white/10 bg-black/70 px-3 py-3 shadow-xl transition hover:-translate-y-0.5 hover:border-white/25 active:cursor-grabbing"
      style={{ touchAction: "none" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{entry.code}</div>
          <div className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
            {entry.title}
          </div>
        </div>

        <div className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
          {entry.units}u
        </div>
      </div>

      {entry.manualBucketOverride && (
        <button
          onClick={onReset}
          className="mt-2 text-xs text-blue-300 opacity-80 hover:opacity-100"
        >
          reset to auto
        </button>
      )}
    </div>
  );
}