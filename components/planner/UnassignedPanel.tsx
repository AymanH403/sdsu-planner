import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { entriesInBucket, canDropIntoBucket } from "@/lib/planner";
import type { PlannerEntry, DropBucket } from "@/lib/types";
import { CourseChip } from "./CourseChip";

type Props = {
  entries: PlannerEntry[];
  draggingEntryId: string | null;
  setDraggingEntryId: (id: string | null) => void;
  onMoveEntry: (entryId: string, bucket: DropBucket) => void;
  onRemoveEntry: (entryId: string) => void;
};

export function UnassignedPanel({
  entries,
  draggingEntryId,
  setDraggingEntryId,
  onMoveEntry,
  onRemoveEntry,
}: Props) {
  const unassignedEntries = entriesInBucket(entries, "unassigned");
  const draggingEntry = entries.find((entry) => entry.id === draggingEntryId);
  const validDrop = canDropIntoBucket(draggingEntry, "unassigned");

  return (
    <Card
      onDragOver={(e) => {
        if (!draggingEntry || !validDrop) return;
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (!draggingEntryId || !validDrop) return;
        onMoveEntry(draggingEntryId, "unassigned");
        setDraggingEntryId(null);
      }}
      className={[
        "rounded-[32px] border-0 bg-white shadow-sm transition-all",
        draggingEntry && validDrop ? "ring-2 ring-slate-300" : "",
      ].join(" ")}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
          Unassigned
        </CardTitle>
        <CardDescription className="text-base text-slate-600">
          Add courses here first, then drag them into the bucket where you want them counted.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="min-h-[180px] rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 p-4">
          {unassignedEntries.length === 0 ? (
            <div className="text-sm text-slate-500">
              Added courses will appear here until you assign them below.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {unassignedEntries.map((entry) => (
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
      </CardContent>
    </Card>
  );
}