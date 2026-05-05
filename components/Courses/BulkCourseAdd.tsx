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
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());

  const parsed = useMemo(
    () => parseBulkCourseInput(text, catalog),
    [text, catalog],
  );

  const acceptedCourses = parsed.suggestions
    .filter((suggestion) => acceptedSuggestions.has(suggestion.input))
    .map((suggestion) => suggestion.suggestedCourse);

  const allMatches = [...parsed.matched, ...acceptedCourses];

  const newMatches = allMatches.filter(
    (course, index, arr) =>
      !addedCourseCodes.has(course.code) &&
      arr.findIndex((c) => c.code === course.code) === index,
  );

  function addAll() {
    for (const course of newMatches) {
      onAddCourse(course);
    }
  }

  function acceptSuggestion(input: string) {
    setAcceptedSuggestions((prev) => new Set([...prev, input]));
  }

  function rejectSuggestion(input: string) {
    setAcceptedSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(input);
      return next;
    });
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
          <ClipboardList className="h-5 w-5" />
          Bulk Add Courses
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Paste course codes. Spacing is flexible, so ACCTG202 and BA673 can still match.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setAcceptedSuggestions(new Set());
        }}
        placeholder={`ACCTG201\nACCTG202\nBA673\nFIN240\nSTAT119`}
        className="min-h-40 w-full rounded-3xl border border-white/10 bg-black p-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:ring-2 focus:ring-white/20"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">
          {parsed.matched.length} matched · {parsed.suggestions.length} suggestions · {parsed.unmatched.length} unmatched · {newMatches.length} new
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

      {parsed.suggestions.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
          <div className="mb-3 text-sm font-semibold text-amber-200">
            Confirm suggestions
          </div>

          <div className="space-y-3">
            {parsed.suggestions.map((suggestion) => {
              const accepted = acceptedSuggestions.has(suggestion.input);

              return (
                <div
                  key={suggestion.input}
                  className="flex flex-col justify-between gap-3 rounded-2xl bg-black/30 p-3 md:flex-row md:items-center"
                >
                  <div className="text-sm text-zinc-300">
                    Did you mean{" "}
                    <span className="font-semibold text-white">
                      {suggestion.suggestedCourse.code}
                    </span>{" "}
                    — {suggestion.suggestedCourse.title} for{" "}
                    <span className="text-amber-200">{suggestion.input}</span>?
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptSuggestion(suggestion.input)}
                      className={[
                        "rounded-xl px-3 py-1.5 text-xs font-semibold",
                        accepted
                          ? "bg-emerald-300 text-black"
                          : "bg-white text-black",
                      ].join(" ")}
                    >
                      {accepted ? "Accepted" : "Accept"}
                    </button>

                    <button
                      onClick={() => rejectSuggestion(suggestion.input)}
                      className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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