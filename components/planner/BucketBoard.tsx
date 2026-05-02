import { BucketRow } from "./BucketRow";
import type { BucketKey, DropBucket, PlannerEntry } from "@/lib/types";

type Props = {
  entries: PlannerEntry[];
  totals: Record<BucketKey, number>;
  draggingEntryId: string | null;
  setDraggingEntryId: (id: string | null) => void;
  onMoveEntry: (entryId: string, bucket: DropBucket) => void;
  onRemoveEntry: (entryId: string) => void;
};

const DISPLAY_ORDER: DropBucket[] = [
  "accounting",
  "business",
  "ethics",
  "accounting_study",
  "general",
];

export function BucketBoard(props: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {DISPLAY_ORDER.map((bucket) => (
        <BucketRow key={bucket} bucket={bucket} compact {...props} />
      ))}
    </div>
  );
}