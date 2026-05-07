"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, FileText, UploadCloud, X } from "lucide-react";
import {
  parseTranscriptPdf,
  type TranscriptParsedTerm,
} from "@/lib/transcriptPdfParser";
import type { CourseRecord } from "@/lib/types";

type Props = {
  catalog: CourseRecord[];
  addedCourseCodes: Set<string>;
  onAddCourse: (
    course: CourseRecord,
    termId?: string,
    sourceType?: "transcript",
  ) => void;
  onImportTerms: (terms: TranscriptParsedTerm[]) => void;
  onImportTranscript?: (
    courses: CourseRecord[],
    terms: TranscriptParsedTerm[],
    courseTermMap: Record<string, string>,
    courseUnitMap: Record<string, number>,
  ) => void;
  landingMode?: boolean;
  onImportComplete?: () => void;
};

type ReviewRow = {
  code: string;
  include: boolean;
  units: string;
  termId: string;
};

export function TranscriptUpload({
  catalog,
  addedCourseCodes,
  onAddCourse,
  onImportTerms,
  onImportTranscript,
  landingMode = false,
  onImportComplete,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [matched, setMatched] = useState<CourseRecord[]>([]);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [terms, setTerms] = useState<TranscriptParsedTerm[]>([]);
  const [reviewRows, setReviewRows] = useState<Record<string, ReviewRow>>({});
  const [transferWarning, setTransferWarning] = useState(false);
  const [transferReasons, setTransferReasons] = useState<string[]>([]);
  const [error, setError] = useState("");

  const includedCourses = useMemo(
    () =>
      matched.filter(
        (course) =>
          reviewRows[course.code]?.include &&
          !addedCourseCodes.has(course.code),
      ),
    [matched, reviewRows, addedCourseCodes],
  );

  const reviewedCourseTermMap = useMemo(() => {
    const map: Record<string, string> = {};

    for (const course of includedCourses) {
      const termId = reviewRows[course.code]?.termId;
      if (termId) map[course.code] = termId;
    }

    return map;
  }, [includedCourses, reviewRows]);

  const reviewedCourseUnitMap = useMemo(() => {
    const map: Record<string, number> = {};

    for (const course of includedCourses) {
      const raw = reviewRows[course.code]?.units;
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        map[course.code] = parsed;
      }
    }

    return map;
  }, [includedCourses, reviewRows]);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setError("");
    setLoading(true);
    setMatched([]);
    setUnmatchedCount(0);
    setTerms([]);
    setReviewRows({});
    setTransferWarning(false);
    setTransferReasons([]);

    try {
      const result = await parseTranscriptPdf(file, catalog);

      const initialRows: Record<string, ReviewRow> = {};
      for (const course of result.matched) {
        initialRows[course.code] = {
          code: course.code,
          include: !addedCourseCodes.has(course.code),
          units: String(result.courseUnitMap[course.code] ?? course.units),
          termId: result.courseTermMap[course.code] ?? "",
        };
      }

      setMatched(result.matched);
      setUnmatchedCount(result.unmatched.length);
      setTerms(result.terms);
      setReviewRows(initialRows);
      setTransferWarning(result.transferWarning);
      setTransferReasons(result.transferWarningReasons);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      setError(
        "Could not read this PDF. It may be scanned/image-only or formatted in a way the parser cannot read yet.",
      );
    } finally {
      setLoading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function updateRow(code: string, patch: Partial<ReviewRow>) {
    setReviewRows((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        ...patch,
      },
    }));
  }

  function importMatched() {
    if (onImportTranscript) {
      onImportTranscript(
        includedCourses,
        terms,
        reviewedCourseTermMap,
        reviewedCourseUnitMap,
      );
    } else {
      onImportTerms(terms);

      for (const course of includedCourses) {
        onAddCourse(course, reviewedCourseTermMap[course.code], "transcript");
      }
    }

    setModalOpen(false);
    onImportComplete?.();
  }

  return (
    <>
      <section
        className={[
          "rounded-[36px] border border-white/10 bg-zinc-950 p-6 shadow-2xl",
          landingMode ? "mx-auto max-w-3xl p-8" : "",
        ].join(" ")}
      >
        <div className="mb-5 text-center">
          <h2 className="flex items-center justify-center gap-2 text-3xl font-semibold tracking-tight text-white">
            <FileText className="h-7 w-7" />
            Upload Unofficial Transcript
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            Drag and drop your PDF transcript or select a file. Everything is parsed locally.
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={[
            "flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[32px] border border-dashed p-8 text-center transition",
            dragging
              ? "border-emerald-300 bg-emerald-300/10"
              : "border-white/15 bg-black/40 hover:bg-white/5",
          ].join(" ")}
        >
          <UploadCloud className="mb-4 h-14 w-14 text-zinc-300" />

          <div className="text-xl font-semibold text-white">
            Select PDF file or drop it here
          </div>

          <div className="mt-2 max-w-md text-sm text-zinc-500">
            The parser will detect courses, semesters, transcript units, and possible transfer warnings.
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />
        </div>

        {loading && (
          <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-zinc-300">
            Reading transcript...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Transcript Import Review
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Confirm which courses to import. You can edit units and semester before importing.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 text-zinc-500 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <Stat label="Matched" value={matched.length} />
              <Stat label="Unmatched" value={unmatchedCount} />
              <Stat label="Semesters" value={terms.length} />
            </div>

            {transferWarning && (
              <div className="mb-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-200" />

                  <div>
                    <div className="font-semibold text-amber-100">
                      Transfer or test credit may be present.
                    </div>

                    <p className="mt-1 text-sm text-amber-100/80">
                      Your transcript may summarize transferred credits instead of listing every course.
                      Verify SDSU courses, then use ASSIST later for transfer equivalents.
                    </p>

                    {transferReasons.length > 0 && (
                      <div className="mt-2 text-xs text-amber-200">
                        Detected: {transferReasons.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="mb-3 text-sm font-semibold text-white">
                Review matched courses
              </div>

              {matched.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                  No courses matched the SDSU catalog.
                </div>
              ) : (
                <div className="space-y-2">
                  {matched.map((course) => {
                    const row = reviewRows[course.code];

                    return (
                      <div
                        key={course.code}
                        className={[
                          "grid gap-3 rounded-2xl border border-white/10 p-3 md:grid-cols-[44px_1fr_110px_180px]",
                          row?.include ? "bg-white/5" : "bg-white/[0.02] opacity-50",
                        ].join(" ")}
                      >
                        <label className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={Boolean(row?.include)}
                            onChange={(e) =>
                              updateRow(course.code, { include: e.target.checked })
                            }
                          />
                        </label>

                        <div>
                          <div className="font-semibold text-white">{course.code}</div>
                          <div className="mt-1 text-sm text-zinc-400">{course.title}</div>
                          {addedCourseCodes.has(course.code) && (
                            <div className="mt-1 text-xs text-amber-200">
                              Already in plan
                            </div>
                          )}
                        </div>

                        <input
                          type="text"
                          inputMode="decimal"
                          value={row?.units ?? ""}
                          onChange={(e) =>
                            updateRow(course.code, { units: e.target.value })
                          }
                          className="h-11 rounded-2xl border border-white/10 bg-black px-3 text-sm text-white outline-none"
                        />

                        <select
                          value={row?.termId ?? ""}
                          onChange={(e) =>
                            updateRow(course.code, { termId: e.target.value })
                          }
                          className="h-11 rounded-2xl border border-white/10 bg-black px-3 text-sm text-white outline-none"
                        >
                          <option value="">Unassigned</option>
                          {terms.map((term) => (
                            <option key={term.id} value={term.id}>
                              {term.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                onClick={importMatched}
                disabled={includedCourses.length === 0}
                className={[
                  "rounded-2xl px-4 py-2 text-sm font-medium",
                  includedCourses.length === 0
                    ? "bg-white/10 text-zinc-600"
                    : "bg-white text-black hover:bg-zinc-200",
                ].join(" ")}
              >
                Import {includedCourses.length} courses
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}