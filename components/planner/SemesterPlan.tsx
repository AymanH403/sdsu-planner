"use client";

import { useState } from "react";
import type {
  AuditResult,
  PlannerEntry,
  PlannerTerm,
  RequirementBucket,
} from "@/lib/types";

type Props = {
  terms: PlannerTerm[];
  entries: PlannerEntry[];
  audit: AuditResult;
  onAddTerm: (season: string, year: string) => void;
  onUpdateEntryTerm: (entryId: string, termId?: string) => void;
};

const SEASONS = ["FALL", "SPRING", "SUMMER", "WINTER"];

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

export function SemesterPlan({
  terms,
  entries,
  audit,
  onAddTerm,
  onUpdateEntryTerm,
}: Props) {
  const [season, setSeason] = useState("FALL");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);

  const sortedTerms = [...terms].sort((a, b) => a.sortOrder - b.sortOrder);
  const unassigned = entries.filter((entry) => !entry.termId);

  function createTerm() {
    onAddTerm(season, year);
  }

  function allowDrop(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(termId?: string) {
    if (!draggingEntryId) return;
    onUpdateEntryTerm(draggingEntryId, termId);
    setDraggingEntryId(null);
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
      <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Semester Plan
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Drag course cards between terms. Create new terms manually or import them from a transcript.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-black px-3 text-sm text-white outline-none"
          >
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2027"
            inputMode="numeric"
            className="h-11 w-28 rounded-2xl border border-white/10 bg-black px-3 text-sm text-white outline-none"
          />

          <button
            onClick={createTerm}
            className="h-11 rounded-2xl bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Add term
          </button>
        </div>
      </div>

      {sortedTerms.length === 0 && entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">
          No terms or courses yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {sortedTerms.map((term) => {
            const termEntries = entries.filter((entry) => entry.termId === term.id);
            const units = termEntries.reduce((sum, entry) => sum + entry.units, 0);

            return (
              <TermColumn
                key={term.id}
                title={term.name}
                units={units}
                entries={termEntries}
                audit={audit}
                draggingEntryId={draggingEntryId}
                setDraggingEntryId={setDraggingEntryId}
                onDragOver={allowDrop}
                onDrop={() => handleDrop(term.id)}
              />
            );
          })}

          {unassigned.length > 0 && (
            <TermColumn
              title="Unassigned Term"
              units={unassigned.reduce((sum, entry) => sum + entry.units, 0)}
              entries={unassigned}
              audit={audit}
              draggingEntryId={draggingEntryId}
              setDraggingEntryId={setDraggingEntryId}
              onDragOver={allowDrop}
              onDrop={() => handleDrop(undefined)}
            />
          )}
        </div>
      )}
    </section>
  );
}

function TermColumn({
  title,
  units,
  entries,
  audit,
  draggingEntryId,
  setDraggingEntryId,
  onDragOver,
  onDrop,
}: {
  title: string;
  units: number;
  entries: PlannerEntry[];
  audit: AuditResult;
  draggingEntryId: string | null;
  setDraggingEntryId: (id: string | null) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        "min-h-[260px] rounded-3xl border border-white/10 bg-black/40 p-4 transition",
        draggingEntryId ? "ring-1 ring-white/20" : "",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold text-white">{title}</div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
          {units} units
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-600">
          Drop courses here.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <CourseCard
              key={entry.id}
              entry={entry}
              audit={audit}
              setDraggingEntryId={setDraggingEntryId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  entry,
  audit,
  setDraggingEntryId,
}: {
  entry: PlannerEntry;
  audit: AuditResult;
  setDraggingEntryId: (id: string | null) => void;
}) {
  const bucket = bucketFor(entry, audit);

  return (
    <div
      draggable
      onDragStart={() => setDraggingEntryId(entry.id)}
      onDragEnd={() => setDraggingEntryId(null)}
      className="cursor-grab rounded-2xl bg-white/5 p-4 shadow-lg transition hover:-translate-y-0.5 hover:bg-white/10 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{entry.code}</div>
          <div className="mt-1 text-sm text-zinc-500">{entry.title}</div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${bucketClass(bucket)}`}
        >
          {bucket.replace("_", " ")}
        </span>
      </div>

      <div className="mt-3 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300">
        {entry.units}u
      </div>
    </div>
  );
}