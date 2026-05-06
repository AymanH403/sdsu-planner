"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AllocationBoard } from "@/components/planner/AllocationBoard";
import { usePlannerState } from "@/lib/usePlannerState";

export default function AllocationsPage() {
  const planner = usePlannerState();
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl xl:px-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Allocation Board
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manually move courses between eligible CPA buckets.
        </p>
      </div>

      <div className="p-6 xl:p-8">
        <AllocationBoard
          entries={planner.entries}
          audit={planner.audit}
          draggingEntryId={draggingEntryId}
          setDraggingEntryId={setDraggingEntryId}
          onMoveEntry={planner.moveEntry}
        />
      </div>
    </AppShell>
  );
}