"use client";

import { useMemo, useState } from "react";
import { Trash2, X } from "lucide-react";
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
  onDeleteTerm: (termId: string) => void;
  onUpdateEntryTerm: (entryId: string, termId?: string) => void;
  onUpdateUnits: (entryId: string, units: number) => void;
  onRemoveEntry: (entryId: string) => void;
};

const SEASONS = ["FALL", "SPRING", "SUMMER", "WINTER"];
const SEASON_RANK: Record<string, number> = {
  WINTER: 0,
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
};

function parseTerm(term: PlannerTerm) {
  const [seasonRaw, yearRaw] = term.name.toUpperCase().split(/\s+/);
  const season = seasonRaw || "TERM";
  const year = yearRaw || "UNKNOWN";

  return {
    season,
    year,
    sortValue: Number(year) * 10 + (SEASON_RANK[season] ?? 9),
  };
}

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

function cardClass(bucket: RequirementBucket) {
  if (bucket === "accounting") return "border-red-500/40 bg-red-500/10";
  if (bucket === "business") return "border-blue-500/40 bg-blue-500/10";
  if (bucket === "ethics") return "border-amber-300/40 bg-amber-300/10";
  if (bucket === "accounting_study") return "border-purple-500/40 bg-purple-500/10";
  return "border-emerald-300/40 bg-emerald-300/10";
}

export function SemesterPlan({
  terms,
  entries,
  audit,
  onAddTerm,
  onDeleteTerm,
  onUpdateEntryTerm,
  onUpdateUnits,
  onRemoveEntry,
}: Props) {
  const [season, setSeason] = useState("FALL");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);
  const [unitModalTitle, setUnitModalTitle] = useState("");
  const [unitModalEntries, setUnitModalEntries] = useState<PlannerEntry[]>([]);

  const sortedTerms = useMemo(
    () => [...terms].sort((a, b) => parseTerm(a).sortValue - parseTerm(b).sortValue),
    [terms],
  );

  const termsByYear = useMemo(() => {
    const groups: Record<string, PlannerTerm[]> = {};

    for (const term of sortedTerms) {
      const { year } = parseTerm(term);
      groups[year] ??= [];
      groups[year].push(term);
    }

    return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
  }, [sortedTerms]);

  const unassigned = entries.filter((entry) => !entry.termId);

  function handleDrop(termId?: string) {
    if (!draggingEntryId) return;
    onUpdateEntryTerm(draggingEntryId, termId);
    setDraggingEntryId(null);
  }

  function openUnitsModal(title: string, modalEntries: PlannerEntry[]) {
    setUnitModalTitle(title);
    setUnitModalEntries(modalEntries);
  }

  function closeUnitsModal() {
    setUnitModalTitle("");
    setUnitModalEntries([]);
  }

  return (
    <>
      <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-5 shadow-2xl">
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Semester Plan
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Terms are grouped by year. Drag courses between terms.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="h-10 rounded-2xl border border-white/10 bg-black px-3 text-sm text-white"
            >
              {SEASONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-10 w-28 rounded-2xl border border-white/10 bg-black px-3 text-sm text-white"
            />

            <button
              onClick={() => onAddTerm(season, year)}
              className="h-10 rounded-2xl bg-white px-4 text-sm font-medium text-black hover:bg-zinc-200"
            >
              Add term
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {termsByYear.map(([yearLabel, yearTerms]) => (
            <div key={yearLabel} className="rounded-[28px] border border-white/10 bg-black/25 p-4">
              <h3 className="mb-4 text-lg font-semibold text-white">{yearLabel}</h3>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {yearTerms.map((term) => {
                  const termEntries = entries.filter((entry) => entry.termId === term.id);
                  const units = termEntries.reduce((sum, entry) => sum + entry.units, 0);
                  const { season } = parseTerm(term);

                  return (
                    <TermColumn
                      key={term.id}
                      title={season}
                      termId={term.id}
                      units={units}
                      entries={termEntries}
                      audit={audit}
                      draggingEntryId={draggingEntryId}
                      setDraggingEntryId={setDraggingEntryId}
                      onDrop={() => handleDrop(term.id)}
                      onDeleteTerm={onDeleteTerm}
                      onRemoveEntry={onRemoveEntry}
                      onOpenUnits={() => openUnitsModal(term.name, termEntries)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {unassigned.length > 0 && (
            <div className="rounded-[28px] border border-white/10 bg-black/25 p-4">
              <h3 className="mb-4 text-lg font-semibold text-white">Unassigned</h3>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <TermColumn
                  title="No Term"
                  units={unassigned.reduce((sum, entry) => sum + entry.units, 0)}
                  entries={unassigned}
                  audit={audit}
                  draggingEntryId={draggingEntryId}
                  setDraggingEntryId={setDraggingEntryId}
                  onDrop={() => handleDrop(undefined)}
                  onRemoveEntry={onRemoveEntry}
                  onOpenUnits={() => openUnitsModal("Unassigned", unassigned)}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {unitModalEntries.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Edit Units
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {unitModalTitle}
                </p>
              </div>

              <button
                onClick={closeUnitsModal}
                className="rounded-xl p-2 text-zinc-500 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {unitModalEntries.map((entry) => {
                const editable = entry.variableUnits;

                return (
                  <div
                    key={entry.id}
                    className={[
                      "grid gap-3 rounded-2xl border border-white/10 p-4 md:grid-cols-[1fr_120px]",
                      editable ? "bg-black/40" : "bg-white/[0.03] opacity-60",
                    ].join(" ")}
                  >
                    <div>
                      <div className="font-semibold text-white">{entry.code}</div>
                      <div className="mt-1 text-sm text-zinc-400">{entry.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {editable
                          ? `Variable units: ${entry.unitMin}-${entry.unitMax}`
                          : "Fixed-unit course"}
                      </div>
                    </div>

                    <input
                      type="number"
                      min={entry.unitMin}
                      max={entry.unitMax}
                      step={0.5}
                      value={entry.units}
                      disabled={!editable}
                      onChange={(e) => onUpdateUnits(entry.id, Number(e.target.value))}
                      className={[
                        "h-11 rounded-2xl border border-white/10 px-3 text-sm outline-none",
                        editable
                          ? "bg-black text-white"
                          : "cursor-not-allowed bg-white/5 text-zinc-500",
                      ].join(" ")}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeUnitsModal}
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TermColumn({
  title,
  termId,
  units,
  entries,
  audit,
  draggingEntryId,
  setDraggingEntryId,
  onDrop,
  onDeleteTerm,
  onRemoveEntry,
  onOpenUnits,
}: {
  title: string;
  termId?: string;
  units: number;
  entries: PlannerEntry[];
  audit: AuditResult;
  draggingEntryId: string | null;
  setDraggingEntryId: (id: string | null) => void;
  onDrop: () => void;
  onDeleteTerm?: (termId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onOpenUnits: () => void;
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={[
        "min-h-[150px] rounded-3xl border border-white/10 bg-black/45 p-3 transition",
        draggingEntryId ? "ring-1 ring-white/20" : "",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">{title}</div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUnits}
            className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/20 hover:text-white"
          >
            {units}u
          </button>

          {termId && onDeleteTerm && (
            <button
              onClick={() => onDeleteTerm(termId)}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/20 hover:text-red-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-3 text-xs text-zinc-600">
          Drop here.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <CourseCard
              key={entry.id}
              entry={entry}
              audit={audit}
              setDraggingEntryId={setDraggingEntryId}
              onRemoveEntry={onRemoveEntry}
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
  onRemoveEntry,
}: {
  entry: PlannerEntry;
  audit: AuditResult;
  setDraggingEntryId: (id: string | null) => void;
  onRemoveEntry: (entryId: string) => void;
}) {
  const bucket = bucketFor(entry, audit);

  return (
    <div
      draggable
      onDragStart={() => setDraggingEntryId(entry.id)}
      onDragEnd={() => setDraggingEntryId(null)}
      className={[
        "cursor-grab rounded-2xl border p-3 transition hover:bg-white/10",
        cardClass(bucket),
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{entry.code}</div>
          <div className="line-clamp-1 text-xs text-zinc-400">{entry.title}</div>
        </div>

        <button
          onClick={() => onRemoveEntry(entry.id)}
          className="text-zinc-500 hover:text-red-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-zinc-200">
          {entry.units}u
        </span>

        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${bucketClass(bucket)}`}>
          {bucket.replace("_", " ")}
        </span>

        {entry.needsReview && (
          <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-semibold text-black">
            review
          </span>
        )}
      </div>
    </div>
  );
}