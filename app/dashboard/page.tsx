"use client";

import { useState } from "react";
import coursesData from "../../data/sdsu_courses.json";
import { AppShell } from "@/components/layout/AppShell";
import { CourseEntryPanel } from "@/components/courses/CourseEntryPanel";
import { AuditResults, AuditWarnings } from "@/components/planner/AuditResults";
import { SemesterPlan } from "@/components/planner/SemesterPlan";
import { normalizeCourses } from "@/lib/courses";
import { usePlannerState } from "@/lib/usePlannerState";
import type { CourseRecord, RawCourse } from "@/lib/types";

const SDSU_COURSES: CourseRecord[] = normalizeCourses(coursesData as RawCourse[]);

export default function DashboardPage() {
  const planner = usePlannerState();
  const [auditLogOpen, setAuditLogOpen] = useState(false);

  return (
    <AppShell>
      <div className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl xl:px-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Add courses, organize semesters, and check CPA eligibility.
        </p>
      </div>

      <div className="space-y-8 p-6 xl:p-8">
        <section className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
          <CourseEntryPanel
            catalog={SDSU_COURSES}
            addedCourseCodes={planner.addedCourseCodes}
            onAddCourse={(course) => planner.addCourse(course, undefined, "manual")}
          />

          <AuditResults audit={planner.audit} />
        </section>

        <AuditWarnings audit={planner.audit} />

        <SemesterPlan
          terms={planner.terms}
          entries={planner.entries}
          audit={planner.audit}
          onAddTerm={planner.addManualTerm}
          onDeleteTerm={planner.deleteTerm}
          onUpdateEntryTerm={planner.updateEntryTerm}
          onUpdateUnits={planner.updateEntryUnits}
          onRemoveEntry={planner.removeEntry}
        />

        <button
          onClick={() => setAuditLogOpen(true)}
          className="fixed bottom-6 right-6 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-2xl hover:bg-zinc-200"
        >
          View Audit Log
        </button>

        {auditLogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[32px] border border-white/10 bg-black p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">Audit Log</h2>
                <button
                  onClick={() => setAuditLogOpen(false)}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              <AuditLog audit={planner.audit} />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function AuditLog({ audit }: { audit: ReturnType<typeof usePlannerState>["audit"] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Requirement Allocations
        </h3>

        {audit.allocations.length === 0 ? (
          <div className="text-sm text-zinc-500">No CPA-specific allocations yet.</div>
        ) : (
          <div className="space-y-3">
            {audit.allocations.map((allocation) => (
              <div
                key={`${allocation.entryId}-${allocation.allocatedTo}`}
                className="rounded-2xl bg-white/5 p-4"
              >
                <div className="font-semibold text-white">
                  {allocation.code} → {allocation.allocatedTo.replace("_", " ")}
                </div>
                <div className="mt-1 text-sm text-zinc-400">{allocation.title}</div>
                <div className="mt-2 text-xs text-zinc-500">
                  {allocation.units} units · {Math.round(allocation.confidence * 100)}% confidence
                </div>
                <div className="mt-2 text-xs text-zinc-500">{allocation.reason}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">
          General / Total-Only Courses
        </h3>

        {audit.generalCourses.length === 0 ? (
          <div className="text-sm text-zinc-500">No general courses yet.</div>
        ) : (
          <div className="space-y-3">
            {audit.generalCourses.map((allocation) => (
              <div key={allocation.entryId} className="rounded-2xl bg-white/5 p-4">
                <div className="font-semibold text-white">{allocation.code}</div>
                <div className="mt-1 text-sm text-zinc-400">{allocation.title}</div>
                <div className="mt-2 text-xs text-zinc-500">
                  {allocation.units} units · {allocation.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}