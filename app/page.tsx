"use client";

import { useEffect, useMemo, useState } from "react";
import coursesData from "../data/sdsu_courses.json";
import { Header } from "@/components/common/Header";
import { CourseSearchPanel } from "@/components/search/CourseSearchPanel";
import { TransferSearchPanel } from "@/components/search/TransferSearchPanel";
import { BucketBoard } from "@/components/planner/BucketBoard";
import { ProgressSummary } from "@/components/planner/ProgressSummary";
import { UnassignedPanel } from "@/components/planner/UnassignedPanel";
import { normalizeCourses, matchSdsuCourses, normalize } from "@/lib/courses";
import { totalsFromEntries, totalUnitsFromEntries } from "@/lib/planner";
import { loadPlanFromStorage, savePlanToStorage } from "@/lib/storage";
import type { CourseRecord, PlannerEntry, RawCourse, DropBucket } from "@/lib/types";

const SDSU_COURSES: CourseRecord[] = normalizeCourses(coursesData as RawCourse[]);

const ASSIST_EXAMPLES = [
  { fromCollege: "MiraCosta College", fromCourse: "ACCT 201", sdsuEquivalent: "ACCTG 201", confidence: "official articulation" },
  { fromCollege: "San Diego Mesa College", fromCourse: "ACCT 116A", sdsuEquivalent: "ACCTG 201", confidence: "official articulation" },
  { fromCollege: "San Diego Mesa College", fromCourse: "ACCT 116B", sdsuEquivalent: "ACCTG 202", confidence: "official articulation" },
  { fromCollege: "Grossmont College", fromCourse: "BUS 128", sdsuEquivalent: "BA 300", confidence: "needs agreement year check" },
];

function matchAssistExamples(college: string, course: string) {
  const c = normalize(college);
  const q = normalize(course);

  return ASSIST_EXAMPLES.filter((row) => {
    return (!c || normalize(row.fromCollege).includes(c)) &&
      (!q || normalize(row.fromCourse).includes(q));
  });
}

export default function Page() {
  const [catalogQuery, setCatalogQuery] = useState("");
  const [showRetired, setShowRetired] = useState(true);
  const [transferCollege, setTransferCollege] = useState("");
  const [transferCourse, setTransferCourse] = useState("");
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);

  useEffect(() => {
    const snapshot = loadPlanFromStorage();
    if (snapshot?.entries) setEntries(snapshot.entries);
  }, []);

  useEffect(() => {
    savePlanToStorage({ entries });
  }, [entries]);

  const catalogMatches = useMemo(
    () => matchSdsuCourses(SDSU_COURSES, catalogQuery, showRetired),
    [catalogQuery, showRetired],
  );

  const assistMatches = useMemo(
    () => matchAssistExamples(transferCollege, transferCourse),
    [transferCollege, transferCourse],
  );

  const totals = useMemo(() => totalsFromEntries(entries), [entries]);
  const totalUnits = useMemo(() => totalUnitsFromEntries(entries), [entries]);

  const addedCourseCodes = useMemo(
    () => new Set(entries.map((entry) => entry.code)),
    [entries],
  );

  function addSdsuCourse(course: CourseRecord) {
    setEntries((prev) => {
      if (prev.some((entry) => entry.code === course.code)) return prev;

      return [
        {
          id: `${course.code}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sourceType: course.status === "retired" ? "legacy_sdsu" : "sdsu",
          code: course.code,
          title: course.title,
          units: course.units,
          eligibleBuckets: course.eligibleBuckets,
          assignedBucket: "unassigned",
          detail: course.status === "retired" ? "Matched retired SDSU course" : "Matched active SDSU course",
        },
        ...prev,
      ];
    });
  }

  function addTransfer(row: typeof ASSIST_EXAMPLES[number]) {
    const mapped = SDSU_COURSES.find((course) => course.code === row.sdsuEquivalent);
    if (!mapped) return;

    setEntries((prev) => {
      if (prev.some((entry) => entry.code === mapped.code)) return prev;

      return [
        {
          id: `${mapped.code}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sourceType: "transfer",
          code: mapped.code,
          title: mapped.title,
          units: mapped.units,
          eligibleBuckets: mapped.eligibleBuckets,
          assignedBucket: "unassigned",
          detail: `${row.fromCollege} ${row.fromCourse} → ${mapped.code}`,
        },
        ...prev,
      ];
    });
  }

  function moveEntry(entryId: string, bucket: DropBucket) {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, assignedBucket: bucket } : entry
      )
    );
  }

  function removeEntry(entryId: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Header />

        <div className="mx-auto max-w-3xl">
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

        <div className="mx-auto max-w-3xl">
          <UnassignedPanel
            entries={entries}
            draggingEntryId={draggingEntryId}
            setDraggingEntryId={setDraggingEntryId}
            onMoveEntry={moveEntry}
            onRemoveEntry={removeEntry}
          />
        </div>

        <div className="mx-auto max-w-5xl">
          <ProgressSummary totals={totals} totalUnits={totalUnits} />
        </div>

        <div className="mx-auto max-w-7xl">
          <BucketBoard
            entries={entries}
            totals={totals}
            draggingEntryId={draggingEntryId}
            setDraggingEntryId={setDraggingEntryId}
            onMoveEntry={moveEntry}
            onRemoveEntry={removeEntry}
          />
        </div>

        <div className="mx-auto max-w-3xl">
          <TransferSearchPanel
            college={transferCollege}
            setCollege={setTransferCollege}
            course={transferCourse}
            setCourse={setTransferCourse}
            matches={assistMatches}
            addedCourseCodes={addedCourseCodes}
            resolveCourseCode={(row) => row.sdsuEquivalent}
            onAdd={addTransfer}
          />
        </div>
      </div>
    </div>
  );
}