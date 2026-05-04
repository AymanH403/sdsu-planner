"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { parseBulkCourseInput } from "@/lib/bulkCourseParser";
import type { CourseRecord } from "@/lib/types";

type Props = {
  catalog: CourseRecord[];
  addedCourseCodes: Set<string>;
  onAddCourse: (course: CourseRecord) => void;
};

export function BulkCourseAdd({ catalog, addedCourseCodes, onAddCourse }: Props) {
  const [text, setText] = useState("");

  const parsed = useMemo(
    () => parseBulkCourseInput(text, catalog),
    [text, catalog],
  );

  const newMatches = parsed.matched.filter(
    (course) => !addedCourseCodes.has(course.code),
  );

  function addAll() {
    for (const course of newMatches) {
      onAddCourse(course);
    }
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
          <ClipboardList className="h-5 w-5" />
          Bulk Add Courses
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Paste course codes, one per line. Example: ACCTG 201, B A 323, FIN 240.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`ACCTG 201\nACCTG 202\nB A 323\nFIN 240\nSTAT 119`}
        className="min-h-40 w-full rounded-3xl border border-white/10 bg-black p-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:ring-2 focus:ring-white/20"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">
          {parsed.matched.length} matched · {parsed.unmatched.length} unmatched · {newMatches.length} new
        </div>

        <button
          onClick={addAll}
          disabled={newMatches.length === 0}
          className={[
            "inline-flex items-center rounded-2xl px-4 py-2 text-sm font-medium transition",
            newMatches.length === 0
              ? "bg-white/10 text-zinc-600"
              : "bg-white text-black hover:bg-zinc-200",
          ].join(" ")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add matched
        </button>
      </div>

      {(parsed.matched.length > 0 || parsed.unmatched.length > 0) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-2 text-sm font-semibold text-white">Matched</div>
            <div className="space-y-2 text-sm text-zinc-300">
              {parsed.matched.slice(0, 12).map((course) => (
                <div key={course.code}>
                  {course.code} — {course.title}
                </div>
              ))}
              {parsed.matched.length > 12 && (
                <div className="text-zinc-500">+ {parsed.matched.length - 12} more</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-2 text-sm font-semibold text-white">Unmatched</div>
            <div className="space-y-2 text-sm text-zinc-400">
              {parsed.unmatched.length === 0 ? (
                <div className="text-zinc-600">None</div>
              ) : (
                parsed.unmatched.slice(0, 12).map((code) => (
                  <div key={code}>{code}</div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}