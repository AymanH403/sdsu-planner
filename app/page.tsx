"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Gauge, LayoutDashboard, ListChecks, Settings2 } from "lucide-react";
import coursesData from "../data/sdsu_courses.json";
import { CourseSearchPanel } from "@/components/search/CourseSearchPanel";
import { AddedCourses } from "@/components/planner/AddedCourses";
import { AuditResults } from "@/components/planner/AuditResults";
import { AllocationBoard } from "@/components/planner/AllocationBoard";
import { classifyCourse } from "@/lib/classifier";
import { matchSdsuCourses, normalizeCourses } from "@/lib/courses";
import { auditPlan } from "@/lib/auditEngine";
import { DEFAULT_RULESET_ID, RULESETS } from "@/lib/rulesets";
import { loadPlanFromStorage, savePlanToStorage } from "@/lib/storage";
import type {
  CourseRecord,
  PlannerEntry,
  RawCourse,
  RequirementBucket,
  RulesetId,
} from "@/lib/types";

const SDSU_COURSES: CourseRecord[] = normalizeCourses(coursesData as RawCourse[]);

type ActiveTab = "dashboard" | "allocations" | "settings";

export default function Page() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [showRetired, setShowRetired] = useState(true);
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [rulesetId, setRulesetId] = useState<RulesetId>(DEFAULT_RULESET_ID);
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);

  useEffect(() => {
    const snapshot = loadPlanFromStorage();
    if (snapshot?.entries) setEntries(snapshot.entries);
    if (snapshot?.rulesetId) setRulesetId(snapshot.rulesetId);
  }, []);

  useEffect(() => {
    savePlanToStorage({ entries, rulesetId });
  }, [entries, rulesetId]);

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

  function addSdsuCourse(course: CourseRecord) {
    setEntries((prev) => {
      if (prev.some((entry) => entry.code === course.code)) return prev;

      const classification = classifyCourse(course);

      return [
        {
          id: `${course.code}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sourceType: "sdsu",
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
        },
        ...prev,
      ];
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
            <SidebarButton
              label="Dashboard"
              icon={LayoutDashboard}
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <SidebarButton
              label="Courses"
              icon={BookOpen}
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <SidebarButton
              label="Audit"
              icon={Gauge}
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <SidebarButton
              label="Allocations"
              icon={ListChecks}
              active={activeTab === "allocations"}
              onClick={() => setActiveTab("allocations")}
            />
            <SidebarButton
              label="Settings"
              icon={Settings2}
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
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
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {activeTab === "allocations" ? "Allocation Board" : activeTab === "settings" ? "Settings" : "Eligibility Dashboard"}
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  {activeTab === "allocations"
                    ? "Manually move courses between eligible buckets."
                    : "Auto-assign courses, review audit results, and override allocations when needed."}
                </p>
              </div>

              <div className="xl:hidden">
                <select
                  value={rulesetId}
                  onChange={(e) => setRulesetId(e.target.value as RulesetId)}
                  className="h-11 rounded-2xl border border-white/10 bg-black px-3 text-sm text-white outline-none"
                >
                  {Object.values(RULESETS).map((ruleset) => (
                    <option key={ruleset.id} value={ruleset.id}>
                      {ruleset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
                      onAddCourse={addSdsuCourse}
                      showRetired={showRetired}
                      setShowRetired={setShowRetired}
                    />
                  </div>

                  <AuditResults audit={audit} />
                </section>

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