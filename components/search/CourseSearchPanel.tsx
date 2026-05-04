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
    <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
          <BookOpen className="h-5 w-5" />
          Add SDSU Courses
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Search the SDSU catalog. Courses auto-classify when added.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ACCTG 331, B A 300, FIN, STAT..."
            className="h-11 w-full rounded-2xl border border-white/10 bg-black pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:ring-2 focus:ring-white/20"
          />
        </div>

        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-zinc-300">
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
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">
            Start typing to search.
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">
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
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{course.code}</span>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-300">
                      {course.units} units
                    </span>
                    {course.variableUnits && (
                      <span className="rounded-full bg-amber-300/15 px-2 py-1 text-xs text-amber-200">
                        variable
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">{course.title}</div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {classified.candidateBuckets.length === 0 ? (
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200">
                        general
                      </span>
                    ) : (
                      classified.candidateBuckets.map((candidate) => (
                        <span
                          key={candidate.bucket}
                          className={[
                            "rounded-full border px-2.5 py-1 text-xs",
                            candidate.bucket === "accounting"
                              ? "border-red-500/30 bg-red-500/10 text-red-200"
                              : candidate.bucket === "business"
                                ? "border-blue-500/30 bg-blue-500/10 text-blue-200"
                                : candidate.bucket === "general"
                                  ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                                  : "border-white/10 bg-white/5 text-zinc-300",
                          ].join(" ")}
                        >
                          {candidate.bucket.replace("_", " ")} · {Math.round(candidate.confidence * 100)}%
                        </span>
                      ))
                    )}

                    {classified.needsReview && (
                      <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-xs text-amber-200">
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
                      ? "bg-white/10 text-zinc-500"
                      : "bg-white text-black hover:bg-zinc-200",
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