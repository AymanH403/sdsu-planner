import { Badge } from "@/components/ui/badge";
import { bucketRowClass, bucketTitle } from "@/lib/buckets";
import { canDropIntoBucket, entriesInBucket } from "@/lib/planner";
import type { BucketKey, DropBucket, PlannerEntry } from "@/lib/types";
import { CourseChip } from "./CourseChip";

type Props = {
  bucket: DropBucket;
  entries: PlannerEntry[];
  totals: Record<BucketKey, number>;
  draggingEntryId: string | null;
  setDraggingEntryId: (id: string | null) => void;
  onMoveEntry: (entryId: string, bucket: DropBucket) => void;
  onRemoveEntry: (entryId: string) => void;
  compact?: boolean;
};

export function BucketRow({
  bucket,
  entries,
  draggingEntryId,
  setDraggingEntryId,
  onMoveEntry,
  onRemoveEntry,
  compact = false,
}: Props) {
  const bucketEntries = entriesInBucket(entries, bucket);
  const draggingEntry = entries.find((entry) => entry.id === draggingEntryId);
  const isDragging = Boolean(draggingEntry);
  const validDrop = canDropIntoBucket(draggingEntry, bucket);

  return (
    <div
      onDragOver={(e) => {
        if (!draggingEntry || !validDrop) return;
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (!draggingEntryId || !validDrop) return;
        onMoveEntry(draggingEntryId, bucket);
        setDraggingEntryId(null);
      }}
      className={[
        "rounded-[28px] border bg-white/90 shadow-sm transition-all",
        bucketRowClass(bucket),
        compact ? "p-4" : "p-5",
        isDragging && !validDrop ? "opacity-40 grayscale-[0.15]" : "",
        isDragging && validDrop ? "ring-2 ring-slate-300 shadow-md" : "",
      ].join(" ")}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold tracking-tight text-slate-900">
            {bucketTitle(bucket)}
          </div>
        </div>

        <Badge variant="secondary" className="rounded-full px-3 py-1">
          {bucketEntries.length}
        </Badge>
      </div>

      <div className="min-h-[180px] rounded-[22px] border border-dashed border-slate-300/80 bg-slate-50/70 p-3">
        {bucketEntries.length === 0 ? (
          <div className="text-sm text-slate-500">
            {draggingEntry && !validDrop
              ? "Not eligible here."
              : "Drop course cards here."}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {bucketEntries.map((entry) => (
              <CourseChip
                key={entry.id}
                entry={entry}
                setDraggingEntryId={setDraggingEntryId}
                onRemoveEntry={onRemoveEntry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}