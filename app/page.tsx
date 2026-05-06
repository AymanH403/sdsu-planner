"use client";

import { useRouter } from "next/navigation";
import coursesData from "../data/sdsu_courses.json";
import { TranscriptUpload } from "@/components/transcript/TranscriptUpload";
import { normalizeCourses } from "@/lib/courses";
import { usePlannerState } from "@/lib/usePlannerState";
import type { CourseRecord, RawCourse } from "@/lib/types";

const SDSU_COURSES: CourseRecord[] = normalizeCourses(coursesData as RawCourse[]);

export default function UploadPage() {
  const router = useRouter();
  const planner = usePlannerState();

  return (
    <main className="min-h-screen bg-[#050507] px-6 py-16 text-white">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <div className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-zinc-500">
          SDSU CPA Planner
        </div>
        <h1 className="text-5xl font-semibold tracking-tight">
          Start with your unofficial transcript.
        </h1>
        <p className="mt-4 text-zinc-400">
          Upload your PDF transcript to detect courses, semesters, and CPA progress locally.
        </p>
      </div>

      <TranscriptUpload
        catalog={SDSU_COURSES}
        addedCourseCodes={planner.addedCourseCodes}
        onAddCourse={(course, termId) => planner.addCourse(course, termId, "transcript")}
        onImportTerms={() => {}}
        onImportTranscript={planner.importTranscriptCourses}
        landingMode
        onImportComplete={() => router.push("/dashboard")}
      />

      <div className="mt-8 text-center">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-zinc-500 underline hover:text-zinc-300"
        >
          Skip upload and enter courses manually
        </button>
      </div>
    </main>
  );
}