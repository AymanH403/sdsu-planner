"use client";

import { useEffect, useMemo, useState } from "react";
import { classifyCourse } from "@/lib/classifier";
import { auditPlan } from "@/lib/auditEngine";
import { DEFAULT_RULESET_ID } from "@/lib/rulesets";
import { loadPlanFromStorage, savePlanToStorage } from "@/lib/storage";
import type {
  CourseRecord,
  PlannerEntry,
  PlannerTerm,
  RequirementBucket,
  RulesetId,
} from "@/lib/types";
import type { TranscriptParsedTerm } from "@/lib/transcriptPdfParser";

function termIdFromName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeEntry(
  course: CourseRecord,
  termId?: string,
  sourceType: "sdsu" | "transcript" = "sdsu",
): PlannerEntry {
  const classification = classifyCourse(course);

  return {
    id: `${course.code}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceType,
    code: course.code,
    prefix: course.prefix,
    number: course.number,
    title: course.title,
    units: course.units,
    unitMin: course.unitMin,
    unitMax: course.unitMax,
    variableUnits: course.variableUnits,
    sourceUrl: course.sourceUrl,
    candidateBuckets: classification.candidateBuckets,
    needsReview: classification.needsReview,
    reviewReason: classification.reviewReason,
    termId,
  };
}

export function usePlannerState() {
  const [hydrated, setHydrated] = useState(false);

  const [terms, setTerms] = useState<PlannerTerm[]>([]);
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [rulesetId, setRulesetId] = useState<RulesetId>(DEFAULT_RULESET_ID);

  useEffect(() => {
    const snapshot = loadPlanFromStorage();

    if (snapshot) {
      setTerms(snapshot.terms ?? []);
      setEntries(snapshot.entries ?? []);
      setRulesetId(snapshot.rulesetId ?? DEFAULT_RULESET_ID);
    }

    setHydrated(true);
  }, []);

  const snapshot = useMemo(
    () => ({
      version: 2 as const,
      terms,
      entries,
      rulesetId,
    }),
    [terms, entries, rulesetId],
  );

  useEffect(() => {
    if (!hydrated) return;
    savePlanToStorage(snapshot);
  }, [hydrated, snapshot]);

  const audit = useMemo(() => auditPlan(entries, rulesetId), [entries, rulesetId]);

  const addedCourseCodes = useMemo(
    () => new Set(entries.map((entry) => entry.code)),
    [entries],
  );

  function addCourse(
    course: CourseRecord,
    termId?: string,
    sourceType: "sdsu" | "transcript" = "sdsu",
  ) {
    setEntries((prev) => {
      if (prev.some((entry) => entry.code === course.code)) return prev;
      return [makeEntry(course, termId, sourceType), ...prev];
    });
  }

  function importTranscriptCourses(
    courses: CourseRecord[],
    transcriptTerms: TranscriptParsedTerm[],
    courseTermMap: Record<string, string>,
  ) {
    setTerms((currentTerms) => {
      const existingTermIds = new Set(currentTerms.map((term) => term.id));

      const newTerms: PlannerTerm[] = transcriptTerms
        .filter((term) => !existingTermIds.has(term.id))
        .map((term, index) => ({
          id: term.id,
          name: term.name,
          sortOrder: currentTerms.length + index,
        }));

      const mergedTerms = [...currentTerms, ...newTerms];

      setEntries((currentEntries) => {
        const existingCourseCodes = new Set(currentEntries.map((entry) => entry.code));

        const newEntries = courses
          .filter((course) => !existingCourseCodes.has(course.code))
          .map((course) => makeEntry(course, courseTermMap[course.code], "transcript"));

        const mergedEntries = [...newEntries, ...currentEntries];

        savePlanToStorage({
          version: 2,
          terms: mergedTerms,
          entries: mergedEntries,
          rulesetId,
        });

        return mergedEntries;
      });

      return mergedTerms;
    });
  }

  function addManualTerm(season: string, year: string) {
    const name = `${season.trim().toUpperCase()} ${year.trim()}`;
    if (!/^(FALL|SPRING|SUMMER|WINTER)\s+\d{4}$/.test(name)) return;

    const id = termIdFromName(name);

    setTerms((prev) => {
      if (prev.some((term) => term.id === id)) return prev;
      return [...prev, { id, name, sortOrder: prev.length }];
    });
  }

  function deleteTerm(termId: string) {
    setTerms((prev) => prev.filter((term) => term.id !== termId));

    setEntries((prev) =>
      prev.map((entry) =>
        entry.termId === termId ? { ...entry, termId: undefined } : entry,
      ),
    );
  }

  function updateEntryTerm(entryId: string, termId?: string) {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, termId: termId || undefined } : entry,
      ),
    );
  }

  function updateEntryUnits(entryId: string, units: number) {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === entryId ? { ...entry, units } : entry)),
    );
  }

  function removeEntry(entryId: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  }

  function moveEntry(entryId: string, bucket: RequirementBucket | "auto") {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? { ...entry, manualBucketOverride: bucket === "auto" ? undefined : bucket }
          : entry,
      ),
    );
  }

  return {
    hydrated,
    terms,
    entries,
    rulesetId,
    setTerms,
    setEntries,
    setRulesetId,
    snapshot,
    audit,
    addedCourseCodes,
    addCourse,
    importTranscriptCourses,
    addManualTerm,
    deleteTerm,
    updateEntryTerm,
    updateEntryUnits,
    removeEntry,
    moveEntry,
  };
}