import { motion } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";
import { bucketTitle } from "@/lib/buckets";
import type { PlannerEntry } from "@/lib/types";

type Props = {
  entry: PlannerEntry;
  setDraggingEntryId: (id: string | null) => void;
  onRemoveEntry: (id: string) => void;
};

export function CourseChip({ entry, setDraggingEntryId, onRemoveEntry }: Props) {
  return (
    <motion.div
      layout
      draggable
      onDragStart={() => setDraggingEntryId(entry.id)}
      onDragEnd={() => setDraggingEntryId(null)}
      title={`${entry.code} — ${entry.title}
${entry.units} units
Eligible: ${
  entry.eligibleBuckets.length > 0
    ? entry.eligibleBuckets.map((b) => bucketTitle(b)).join(", ")
    : "Any bucket"
}
${entry.detail}`}
      className="group inline-flex cursor-grab items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:-translate-y-[1px] hover:shadow-md active:cursor-grabbing"
    >
      <GripVertical className="h-3.5 w-3.5 text-slate-400" />
      <span className="font-medium text-slate-900">{entry.code}</span>
      <button
        type="button"
        aria-label={`Remove ${entry.code}`}
        onClick={(e) => {
          e.stopPropagation();
          onRemoveEntry(entry.id);
        }}
        className="rounded-md p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}