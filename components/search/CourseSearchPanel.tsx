import { Search, BookOpen, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { bucketPillClass, bucketTitle } from "@/lib/buckets";
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
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BookOpen className="h-5 w-5" />
          SDSU catalog search
        </CardTitle>
        <CardDescription>
          Search by course code, title, description, or alias.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search intermediate, accounting, ethics, BA 300..."
              className="h-11 rounded-2xl pl-9"
            />
          </div>

          <label className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showRetired}
              onChange={(e) => setShowRetired(e.target.checked)}
              className="h-4 w-4"
            />
            show retired
          </label>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {query.trim()
            ? `${matches.length} matching course${matches.length === 1 ? "" : "s"}`
            : "Start typing to search the SDSU catalog data."}
        </div>

        <ScrollArea className="h-[360px] pr-4">
          <div className="space-y-3">
            {!query.trim() ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                Type a search term to see matching SDSU courses.
              </div>
            ) : matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                No matches found.
              </div>
            ) : (
              matches.map((course) => {
                const alreadyAdded = addedCourseCodes.has(course.code);

                return (
                  <motion.div
                    key={`${course.code}-${course.title}`}
                    layout
                    className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-slate-900">{course.code}</div>
                        {course.status === "retired" && <Badge variant="outline">retired</Badge>}
                        <Badge variant="secondary">{course.units} units</Badge>
                      </div>
                      <div className="mt-1 text-sm text-slate-600">{course.title}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {course.eligibleBuckets.length > 0 ? (
                          course.eligibleBuckets.map((bucket) => (
                            <span
                              key={bucket}
                              className={`rounded-full border px-2.5 py-1 text-xs ${bucketPillClass(bucket)}`}
                            >
                              {bucketTitle(bucket)}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                            no bucket data
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => onAddCourse(course)}
                      disabled={alreadyAdded}
                      variant={alreadyAdded ? "secondary" : "default"}
                      className="ml-4 rounded-2xl"
                    >
                      {alreadyAdded ? "Added" : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add
                        </>
                      )}
                    </Button>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
