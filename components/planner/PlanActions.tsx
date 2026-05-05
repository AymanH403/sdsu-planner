"use client";

import { Download, Upload } from "lucide-react";
import { exportPlan, importPlanFile } from "@/lib/storage";
import type { PlanSnapshot } from "@/lib/types";

type Props = {
  snapshot: PlanSnapshot;
  onImportPlan: (snapshot: PlanSnapshot) => void;
};

export function PlanActions({ snapshot, onImportPlan }: Props) {
  async function handleImport(file: File | undefined) {
    if (!file) return;

    try {
      const imported = await importPlanFile(file);
      onImportPlan(imported);
    } catch (err) {
      console.error(err);
      alert("Could not import that plan file.");
    }
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
      <h2 className="text-2xl font-semibold tracking-tight text-white">
        Save / Export / Share
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        Export a local JSON plan file. Anyone can import it back into this tracker.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() => exportPlan(snapshot)}
          className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
        >
          <Download className="mr-2 h-4 w-4" />
          Export plan
        </button>

        <label className="inline-flex cursor-pointer items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10">
          <Upload className="mr-2 h-4 w-4" />
          Import plan
          <input
            type="file"
            accept="application/json"
            onChange={(e) => handleImport(e.target.files?.[0])}
            className="hidden"
          />
        </label>
      </div>
    </section>
  );
}