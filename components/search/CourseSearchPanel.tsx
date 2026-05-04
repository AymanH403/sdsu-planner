import { BookOpen, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { classifyCourse } from "@/lib/classifier";
import type { CourseRecord } from "@/lib/types";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  matches: CourseRecord[];
  addedCourseCodes: Set<string>;
  onAddCourse: (course: CourseRecord) => void;
  showRetired: boolean;
  setShowRetired: (v: boolean) => void;
};

export function CourseSearchPanel({
  query,
  setQuery,
  matches,
  addedCourseCodes,
  onAddCourse,
  showRetired,
  setShowRetired,
}: Props) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
          <BookOpen className="h-5 w-5" />
          Add SDSU Courses
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Search the SDSU catalog. The app classifies and allocates units automatically.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ACCTG 331, auditing, marketing, world history..."
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <label className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showRetired}
            onChange={(e) => setShowRetired(e.target.checked)}
          />
          retired
        </label>
      </div>

      <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-1">
        {!query.trim() ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Start typing to search.
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            No matches found.
          </div>
        ) : (
          matches.map((course) => {
            const added = addedCourseCodes.has(course.code);
            const classified = classifyCourse(course);

            return (
              <motion.div
                key={course.code}
                layout
                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{course.code}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600">
                      {course.units} units
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-slate-600">{course.title}</div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {classified.candidateBuckets.length === 0 ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
                        general only
                      </span>
                    ) : (
                      classified.candidateBuckets.map((candidate) => (
                        <span
                          key={candidate.bucket}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
                        >
                          {candidate.bucket.replace("_", " ")} · {Math.round(candidate.confidence * 100)}%
                        </span>
                      ))
                    )}

                    {classified.needsReview && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                        review
                      </span>
                    )}
                  </div>
                </div>

                <button
                  disabled={added}
                  onClick={() => onAddCourse(course)}
                  className={[
                    "inline-flex h-10 items-center rounded-2xl px-4 text-sm font-medium transition",
                    added
                      ? "bg-slate-200 text-slate-500"
                      : "bg-slate-900 text-white hover:bg-slate-800",
                  ].join(" ")}
                >
                  {added ? "Added" : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </>
                  )}
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}