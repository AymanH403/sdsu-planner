"use client";

import { useEffect, useMemo, useState } from "react";
import coursesData from "../data/sdsu_courses.json";
import { CourseSearchPanel } from "@/components/search/CourseSearchPanel";
import { AddedCourses } from "@/components/planner/AddedCourses";
import { AuditResults } from "@/components/planner/AuditResults";
import { classifyCourse } from "@/lib/classifier";
import { matchSdsuCourses, normalizeCourses } from "@/lib/courses";
import { auditPlan } from "@/lib/auditEngine";
import { DEFAULT_RULESET_ID, RULESETS } from "@/lib/rulesets";
import { loadPlanFromStorage, savePlanToStorage } from "@/lib/storage";
import type {
  CourseRecord,
  PlannerEntry,
  RawCourse,
  RulesetId,
} from "@/lib/types";

const SDSU_COURSES: CourseRecord[] = normalizeCourses(coursesData as RawCourse[]);

export default function Page() {
  const [catalogQuery, setCatalogQuery] = useState("");
  const [showRetired, setShowRetired] = useState(true);
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [rulesetId, setRulesetId] = useState<RulesetId>(DEFAULT_RULESET_ID);

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

    const newEntry: PlannerEntry = {
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
    };

    return [newEntry, ...prev];
  });
}

  function removeEntry(entryId: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                SDSU CPA Eligibility Tracker
              </h1>
              <p className="mt-2 max-w-3xl text-slate-600">
                Add courses from the SDSU catalog. The system classifies possible CPA uses and automatically allocates units to the selected California ruleset.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Ruleset
              </label>
              <select
                value={rulesetId}
                onChange={(e) => setRulesetId(e.target.value as RulesetId)}
                className="h-11 rounded-2xl border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              >
                {Object.values(RULESETS).map((ruleset) => (
                  <option key={ruleset.id} value={ruleset.id}>
                    {ruleset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
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

            <AddedCourses
              entries={entries}
              onRemoveEntry={removeEntry}
            />
          </div>

          <AuditResults audit={audit} />
        </div>
      </div>
    </main>
  );
}