"use client";

import { useMemo, useState } from "react";
import { BookOpen, Plus, Search, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { classifyCourse } from "@/lib/classifier";
import { matchSdsuCourses } from "@/lib/courses";
import { parseBulkCourseInput } from "@/lib/bulkCourseParser";
import type { CourseRecord } from "@/lib/types";

type Props = {
  catalog: CourseRecord[];
  addedCourseCodes: Set<string>;
  onAddCourse: (course: CourseRecord) => void;
};

function looksLikeCompleteCourseCode(line: string) {
  return /\d/.test(line);
}

export function CourseEntryPanel({
  catalog,
  addedCourseCodes,
  onAddCourse,
}: Props) {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualUnits, setManualUnits] = useState("3");

  const normalizedLines = input
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);

  const activeSearchQuery =
    normalizedLines.find((line) => !looksLikeCompleteCourseCode(line)) ??
    normalizedLines.at(-1) ??
    input;

  const isBulk =
    normalizedLines.length > 1 &&
    normalizedLines.some((line) => looksLikeCompleteCourseCode(line));

  const searchMatches = useMemo(
    () => matchSdsuCourses(catalog, activeSearchQuery, true),
    [catalog, activeSearchQuery],
  );

  const bulkParsed = useMemo(
    () => parseBulkCourseInput(input, catalog),
    [input, catalog],
  );

  const bulkNewMatches = bulkParsed.matched.filter(
    (course) => !addedCourseCodes.has(course.code),
  );

  const shouldShowManualPrompt =
    activeSearchQuery.trim().length >= 4 &&
    !isBulk &&
    searchMatches.length === 0;

  function addBulk() {
    for (const course of bulkNewMatches) {
      onAddCourse(course);
    }
  }

  function openManualCourse(prefillCode: string) {
    setManualCode(prefillCode.toUpperCase().replace(/\s+/g, " ").trim());
    setManualTitle("");
    setManualUnits("3");
    setManualOpen(true);
  }

  function addManualCourse() {
    const cleanCode = manualCode.toUpperCase().replace(/\s+/g, " ").trim();
    const cleanTitle = manualTitle.trim();
    const units = Number(manualUnits);

    if (!cleanCode || !cleanTitle || !Number.isFinite(units) || units <= 0) {
      return;
    }

    const parts = cleanCode.split(" ");
    const number = parts.at(-1) ?? "";
    const prefix = parts.slice(0, -1).join(" ") || parts[0] || "MANUAL";

    const manualCourse: CourseRecord = {
      code: cleanCode,
      prefix,
      number,
      title: `${cleanTitle} [M]`,
      units,
      unitMin: units,
      unitMax: units,
      variableUnits: false,
      status: "retired",
      aliases: [],
      needsDetailReview: true,
    };

    onAddCourse(manualCourse);
    setManualOpen(false);
    setInput("");
  }

  return (
    <>
      <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
              <BookOpen className="h-5 w-5" />
              Add SDSU Courses
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Search one course or paste multiple course codes.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload PDF
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Search ACCTG202 or paste:\nACCTG 201\nBA673\nFIN240`}
            className="min-h-14 w-full resize-y rounded-2xl border border-white/10 bg-black py-3 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:ring-2 focus:ring-white/20"
          />
        </div>

        {shouldShowManualPrompt && (
          <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
            <div className="font-semibold text-amber-100">
              No matching SDSU course found.
            </div>
            <p className="mt-1 text-sm text-amber-100/80">
              This may be a retired course or a transfer/test-credit course. You
              can manually add it if needed.
            </p>
            <button
              onClick={() => openManualCourse(activeSearchQuery)}
              className="mt-3 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
            >
              Manually add {activeSearchQuery.toUpperCase()}
            </button>
          </div>
        )}

        {isBulk ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-zinc-400">
                {bulkParsed.matched.length} matched ·{" "}
                {bulkParsed.unmatched.length} unmatched
              </div>

              <button
                onClick={addBulk}
                disabled={bulkNewMatches.length === 0}
                className={[
                  "rounded-2xl px-4 py-2 text-sm font-medium",
                  bulkNewMatches.length === 0
                    ? "bg-white/10 text-zinc-600"
                    : "bg-white text-black hover:bg-zinc-200",
                ].join(" ")}
              >
                Add {bulkNewMatches.length}
              </button>
            </div>

            {bulkParsed.matched.length > 0 && (
              <div className="grid gap-2 md:grid-cols-2">
                {bulkParsed.matched.map((course) => (
                  <div
                    key={course.code}
                    className="rounded-xl bg-white/5 p-3 text-sm"
                  >
                    <span className="font-semibold text-white">
                      {course.code}
                    </span>
                    <span className="text-zinc-400"> — {course.title}</span>
                  </div>
                ))}
              </div>
            )}

            {searchMatches.length > 0 && activeSearchQuery.trim() && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-2 text-sm font-semibold text-white">
                  Search results for {activeSearchQuery.toUpperCase()}
                </div>

                <div className="max-h-72 space-y-2 overflow-auto pr-1">
                  {searchMatches.map((course) => {
                    const added = addedCourseCodes.has(course.code);
                    const classified = classifyCourse(course);

                    return (
                      <div
                        key={course.code}
                        className="flex items-start justify-between gap-4 rounded-xl bg-black/40 p-3"
                      >
                        <div>
                          <div className="font-semibold text-white">
                            {course.code}
                          </div>
                          <div className="mt-1 text-sm text-zinc-400">
                            {course.title}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {classified.candidateBuckets.length === 0 ? (
                              <span className="rounded-full bg-emerald-300 px-2.5 py-1 text-xs font-semibold text-black">
                                general
                              </span>
                            ) : (
                              classified.candidateBuckets.map((candidate) => (
                                <span
                                  key={candidate.bucket}
                                  className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300"
                                >
                                  {candidate.bucket.replace("_", " ")}
                                </span>
                              ))
                            )}

                            {course.status === "retired" && (
                              <span className="rounded-full bg-zinc-300 px-2.5 py-1 text-xs font-semibold text-black">
                                R
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          disabled={added}
                          onClick={() => onAddCourse(course)}
                          className={[
                            "inline-flex h-10 items-center rounded-2xl px-4 text-sm font-medium",
                            added
                              ? "bg-white/10 text-zinc-600"
                              : "bg-white text-black hover:bg-zinc-200",
                          ].join(" ")}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {added ? "Added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {bulkParsed.unmatched.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3">
                <div className="mb-2 text-sm font-semibold text-amber-100">
                  Unmatched courses
                </div>

                <div className="space-y-2">
                  {bulkParsed.unmatched.map((code) => (
                    <div
                      key={code}
                      className="flex items-center justify-between gap-3 rounded-xl bg-black/30 px-3 py-2"
                    >
                      <span className="text-sm text-amber-100">{code}</span>

                      <button
                        onClick={() => openManualCourse(code)}
                        className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-black hover:bg-amber-200"
                      >
                        Add manually
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-1">
            {!input.trim() ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">
                Start typing or paste a list.
              </div>
            ) : (
              searchMatches.map((course) => {
                const added = addedCourseCodes.has(course.code);
                const classified = classifyCourse(course);

                return (
                  <div
                    key={course.code}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {course.code}
                      </div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {course.title}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {classified.candidateBuckets.length === 0 ? (
                          <span className="rounded-full bg-emerald-300 px-2.5 py-1 text-xs font-semibold text-black">
                            general
                          </span>
                        ) : (
                          classified.candidateBuckets.map((candidate) => (
                            <span
                              key={candidate.bucket}
                              className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300"
                            >
                              {candidate.bucket.replace("_", " ")}
                            </span>
                          ))
                        )}

                        {course.status === "retired" && (
                          <span className="rounded-full bg-zinc-300 px-2.5 py-1 text-xs font-semibold text-black">
                            R
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      disabled={added}
                      onClick={() => onAddCourse(course)}
                      className={[
                        "inline-flex h-10 items-center rounded-2xl px-4 text-sm font-medium",
                        added
                          ? "bg-white/10 text-zinc-600"
                          : "bg-white text-black hover:bg-zinc-200",
                      ].join(" ")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {added ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="text-2xl font-semibold text-white">
              Manually Add Course
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Use this for retired, transfer, or otherwise missing courses.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm text-zinc-300">Course code</span>
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black px-3 text-sm text-white outline-none"
                  placeholder="ACCTG 505"
                />
              </label>

              <label className="block">
                <span className="text-sm text-zinc-300">Course name</span>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black px-3 text-sm text-white outline-none"
                  placeholder="Fraud Examination"
                />
              </label>

              <label className="block">
                <span className="text-sm text-zinc-300">Units</span>
                <input
                  value={manualUnits}
                  onChange={(e) => setManualUnits(e.target.value)}
                  type="text"
                  inputMode="decimal"
                  className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black px-3 text-sm text-white outline-none"
                  placeholder="3"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setManualOpen(false)}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={addManualCourse}
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
              >
                Add manual course
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}