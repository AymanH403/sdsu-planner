"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { parseTranscriptPdf, type TranscriptParsedTerm } from "@/lib/transcriptPdfParser";
import type { CourseRecord } from "@/lib/types";

type Props = {
  catalog: CourseRecord[];
  addedCourseCodes: Set<string>;
  onAddCourse: (course: CourseRecord, termId?: string, sourceType?: "transcript") => void;
  onImportTerms: (terms: TranscriptParsedTerm[]) => void;
};

export function TranscriptUpload({
  catalog,
  addedCourseCodes,
  onAddCourse,
  onImportTerms,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [matched, setMatched] = useState<CourseRecord[]>([]);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [terms, setTerms] = useState<TranscriptParsedTerm[]>([]);
  const [courseTermMap, setCourseTermMap] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const newMatches = matched.filter((course) => !addedCourseCodes.has(course.code));

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setError("");
    setLoading(true);
    setMatched([]);
    setUnmatched([]);
    setTerms([]);
    setCourseTermMap({});

    try {
      const result = await parseTranscriptPdf(file, catalog);
      setMatched(result.matched);
      setUnmatched(result.unmatched);
      setTerms(result.terms);
      setCourseTermMap(result.courseTermMap);
    } catch (err) {
      console.error(err);
      setError("Could not read this PDF. It may be scanned/image-only or formatted in a way the parser cannot read yet.");
    } finally {
      setLoading(false);
    }
  }

  function addAll() {
    onImportTerms(terms);

    for (const course of newMatches) {
      onAddCourse(course, courseTermMap[course.code], "transcript");
    }
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
          <FileText className="h-5 w-5" />
          Transcript PDF Import
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Upload a machine-readable PDF. If semesters are detected, courses will be grouped by term.
        </p>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="block w-full rounded-2xl border border-white/10 bg-black p-3 text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
      />

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

      {(matched.length > 0 || unmatched.length > 0) && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-400">
              {matched.length} matched · {unmatched.length} unmatched · {terms.length} terms detected
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

          {terms.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="mb-3 text-sm font-semibold text-white">Detected semesters</div>
              <div className="space-y-3">
                {terms.map((term) => (
                  <div key={term.id}>
                    <div className="text-sm font-medium text-zinc-200">{term.name}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {term.courseCodes.map((code) => (
                        <span key={code} className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="mb-2 text-sm font-semibold text-white">Matched</div>
              <div className="max-h-64 space-y-2 overflow-auto text-sm text-zinc-300">
                {matched.map((course) => (
                  <div key={course.code}>
                    {course.code} — {course.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="mb-2 text-sm font-semibold text-white">Unmatched</div>
              <div className="max-h-64 space-y-2 overflow-auto text-sm text-zinc-400">
                {unmatched.length === 0 ? (
                  <div className="text-zinc-600">None</div>
                ) : (
                  unmatched.map((code) => <div key={code}>{code}</div>)
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}