"use client";

import { useRef, useState } from "react";
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
  ) => void;
  landingMode?: boolean;
  onImportComplete?: () => void;
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
  const [courseTermMap, setCourseTermMap] = useState<Record<string, string>>({});
  const [transferWarning, setTransferWarning] = useState(false);
  const [transferReasons, setTransferReasons] = useState<string[]>([]);
  const [error, setError] = useState("");

  const newMatches = matched.filter((course) => !addedCourseCodes.has(course.code));

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
    setCourseTermMap({});
    setTransferWarning(false);
    setTransferReasons([]);

    try {
      const result = await parseTranscriptPdf(file, catalog);

      setMatched(result.matched);
      setUnmatchedCount(result.unmatched.length);
      setTerms(result.terms);
      setCourseTermMap(result.courseTermMap);
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

  function importMatched() {
    if (onImportTranscript) {
      onImportTranscript(newMatches, terms, courseTermMap);
    } else {
      onImportTerms(terms);

      for (const course of newMatches) {
        onAddCourse(course, courseTermMap[course.code], "transcript");
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
            Drag and drop your PDF transcript or select a file. Everything is
            parsed locally.
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              inputRef.current?.click();
            }
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
            The parser will detect courses, semesters, and possible transfer or
            test credit warnings.
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
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Transcript Import Preview
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Review detected semesters and matched courses before
                  importing.
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
                      Your transcript may summarize transferred credits instead
                      of listing every course. Verify your SDSU courses, then
                      use the ASSIST lookup later for equivalents.
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

            {terms.length > 0 && (
              <div className="mb-5 rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="mb-3 text-sm font-semibold text-white">
                  Detected semesters
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {terms.map((term) => (
                    <div key={term.id} className="rounded-2xl bg-white/5 p-3">
                      <div className="text-sm font-semibold text-white">
                        {term.name}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {term.courseCodes.map((code) => (
                          <span
                            key={`${term.id}-${code}`}
                            className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="mb-3 text-sm font-semibold text-white">
                Matched courses
              </div>

              {matched.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                  No courses matched the SDSU catalog.
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {matched.map((course) => (
                    <div
                      key={course.code}
                      className="rounded-xl bg-white/5 p-3 text-sm text-zinc-300"
                    >
                      <span className="font-semibold text-white">
                        {course.code}
                      </span>{" "}
                      — {course.title}
                    </div>
                  ))}
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
                disabled={newMatches.length === 0}
                className={[
                  "rounded-2xl px-4 py-2 text-sm font-medium",
                  newMatches.length === 0
                    ? "bg-white/10 text-zinc-600"
                    : "bg-white text-black hover:bg-zinc-200",
                ].join(" ")}
              >
                Import {newMatches.length} new courses
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
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}