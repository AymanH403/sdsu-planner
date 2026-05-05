"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Settings2,
} from "lucide-react";

import coursesData from "../data/sdsu_courses.json";

import { CourseSearchPanel } from "@/components/search/CourseSearchPanel";
import { AddedCourses } from "@/components/planner/AddedCourses";
import { AuditResults } from "@/components/planner/AuditResults";
import { AllocationBoard } from "@/components/planner/AllocationBoard";
import { BulkCourseAdd } from "@/components/courses/BulkCourseAdd";
import { TranscriptUpload } from "@/components/transcript/TranscriptUpload";
import { PlanActions } from "@/components/planner/PlanActions";
import { SemesterPlan } from "@/components/planner/SemesterPlan";

import { classifyCourse } from "@/lib/classifier";
import { matchSdsuCourses, normalizeCourses } from "@/lib/courses";
import { auditPlan } from "@/lib/auditEngine";
import { DEFAULT_RULESET_ID, RULESETS } from "@/lib/rulesets";
import { loadPlanFromStorage, savePlanToStorage } from "@/lib/storage";

import type {
  CourseRecord,
  PlannerEntry,
  PlannerTerm,
  RawCourse,
  RequirementBucket,
  RulesetId,
} from "@/lib/types";
import type { TranscriptParsedTerm } from "@/lib/transcriptPdfParser";

const SDSU_COURSES: CourseRecord[] = normalizeCourses(coursesData as RawCourse[]);

type ActiveTab = "dashboard" | "allocations" | "settings";

function termIdFromName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [showRetired, setShowRetired] = useState(true);
  const [terms, setTerms] = useState<PlannerTerm[]>([]);
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [rulesetId, setRulesetId] = useState<RulesetId>(DEFAULT_RULESET_ID);
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);

  useEffect(() => {
    const snapshot = loadPlanFromStorage();
    if (snapshot?.entries) setEntries(snapshot.entries);
    if (snapshot?.terms) setTerms(snapshot.terms);
    if (snapshot?.rulesetId) setRulesetId(snapshot.rulesetId);
  }, []);

  const snapshot = useMemo(
    () => ({
      version: 2 as const,
      terms,
      entries,
      rulesetId,
    }),
    [terms, entries, rulesetId],
  );

  useEffect(() => {
    savePlanToStorage(snapshot);
  }, [snapshot]);

  const catalogMatches = useMemo(
    () => matchSdsuCourses(SDSU_COURSES, catalogQuery, showRetired),
    [catalogQuery, showRetired],
  );

  const addedCourseCodes = useMemo(
    () => new Set(entries.map((entry) => entry.code)),
    [entries],
  );

  const audit = useMemo(
    () => auditPlan(entries, rulesetId),
    [entries, rulesetId],
  );

  function addSdsuCourse(
    course: CourseRecord,
    termId?: string,
    sourceType: "sdsu" | "transcript" = "sdsu",
  ) {
    setEntries((prev) => {
      if (prev.some((entry) => entry.code === course.code)) return prev;

      const classification = classifyCourse(course);

      const newEntry: PlannerEntry = {
        id: `${course.code}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sourceType,
        code: course.code,
        prefix: course.prefix,
        number: course.number,
        title: course.title,
        units: course.units,
        unitMin: course.unitMin,
        unitMax: course.unitMax,
        variableUnits: course.variableUnits,
        sourceUrl: course.sourceUrl,
        candidateBuckets: classification.candidateBuckets,
        needsReview: classification.needsReview,
        reviewReason: classification.reviewReason,
        termId,
      };

      return [newEntry, ...prev];
    });
  }

  function addManualTerm(season: string, year: string) {
    const cleanSeason = season.trim().toUpperCase();
    const cleanYear = year.trim();

    if (!cleanSeason || !/^\d{4}$/.test(cleanYear)) return;

    const name = `${cleanSeason} ${cleanYear}`;
    const id = termIdFromName(name);

    setTerms((prev) => {
      if (prev.some((term) => term.id === id)) return prev;

      return [
        ...prev,
        {
          id,
          name,
          sortOrder: prev.length,
        },
      ];
    });
  }

  function updateEntryTerm(entryId: string, termId?: string) {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              termId: termId || undefined,
            }
          : entry,
      ),
    );
  }

  function importTranscriptTerms(transcriptTerms: TranscriptParsedTerm[]) {
    setTerms((prev) => {
      const existing = new Set(prev.map((term) => term.id));

      const additions: PlannerTerm[] = transcriptTerms
        .filter((term) => !existing.has(term.id))
        .map((term, index) => ({
          id: term.id,
          name: term.name,
          sortOrder: prev.length + index,
        }));

      return [...prev, ...additions];
    });
  }

  function removeEntry(entryId: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  }

  function moveEntry(entryId: string, bucket: RequirementBucket | "auto") {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? { ...entry, manualBucketOverride: bucket === "auto" ? undefined : bucket }
          : entry,
      ),
    );
  }

  function updateEntryUnits(entryId: string, units: number) {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === entryId ? { ...entry, units } : entry)),
    );
  }

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-black/70 p-6 xl:block">
          <div className="mb-10">
            <div className="text-xl font-semibold tracking-tight">CPA Planner</div>
            <div className="mt-1 text-xs text-zinc-500">SDSU · California audit beta</div>
          </div>

          <nav className="space-y-2">
            <SidebarButton label="Dashboard" icon={LayoutDashboard} active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <SidebarButton label="Courses" icon={BookOpen} active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <SidebarButton label="Audit" icon={Gauge} active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <SidebarButton label="Allocations" icon={ListChecks} active={activeTab === "allocations"} onClick={() => setActiveTab("allocations")} />
            <SidebarButton label="Settings" icon={Settings2} active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          </nav>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Selected ruleset</div>
            <select
              value={rulesetId}
              onChange={(e) => setRulesetId(e.target.value as RulesetId)}
              className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
            >
              {Object.values(RULESETS).map((ruleset) => (
                <option key={ruleset.id} value={ruleset.id}>
                  {ruleset.label}
                </option>
              ))}
            </select>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl xl:px-8">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {activeTab === "allocations"
                ? "Allocation Board"
                : activeTab === "settings"
                  ? "Settings"
                  : "Eligibility Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {activeTab === "allocations"
                ? "Manually move courses between eligible buckets."
                : "Auto-assign courses, group by semester, export plans, and check CPA eligibility."}
            </p>
          </div>

          <div className="space-y-8 p-6 xl:p-8">
            {activeTab === "dashboard" && (
              <>
                <section className="grid gap-6 2xl:grid-cols-[0.85fr_1.15fr]">
                  <div className="space-y-6">
                    <CourseSearchPanel
                      query={catalogQuery}
                      setQuery={setCatalogQuery}
                      matches={catalogMatches}
                      addedCourseCodes={addedCourseCodes}
                      onAddCourse={(course) => addSdsuCourse(course)}
                      showRetired={showRetired}
                      setShowRetired={setShowRetired}
                    />

                    <BulkCourseAdd
                      catalog={SDSU_COURSES}
                      addedCourseCodes={addedCourseCodes}
                      onAddCourse={(course) => addSdsuCourse(course)}
                    />

                    <TranscriptUpload
                      catalog={SDSU_COURSES}
                      addedCourseCodes={addedCourseCodes}
                      onAddCourse={addSdsuCourse}
                      onImportTerms={importTranscriptTerms}
                    />

                    <PlanActions
                      snapshot={snapshot}
                      onImportPlan={(imported) => {
                        setTerms(imported.terms);
                        setEntries(imported.entries);
                        setRulesetId(imported.rulesetId);
                      }}
                    />
                  </div>

                  <AuditResults audit={audit} />
                </section>

                <SemesterPlan
                  terms={terms}
                  entries={entries}
                  audit={audit}
                  onAddTerm={addManualTerm}
                  onUpdateEntryTerm={updateEntryTerm}
                />

                <AddedCourses
                  entries={entries}
                  audit={audit}
                  onRemoveEntry={removeEntry}
                  onUpdateUnits={updateEntryUnits}
                />
              </>
            )}

            {activeTab === "allocations" && (
              <AllocationBoard
                entries={entries}
                audit={audit}
                draggingEntryId={draggingEntryId}
                setDraggingEntryId={setDraggingEntryId}
                onMoveEntry={moveEntry}
              />
            )}

            {activeTab === "settings" && (
              <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
                <h2 className="text-2xl font-semibold">Settings</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Settings page placeholder. Ruleset selection is currently in the sidebar.
                </p>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
        active
          ? "bg-white text-black"
          : "text-zinc-300 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}