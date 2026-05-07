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
  sourceType: "sdsu" | "transcript" | "manual" = "sdsu",
  unitOverride?: number,
): PlannerEntry {
  const classification = classifyCourse(course);
  const units =
    Number.isFinite(unitOverride) && unitOverride ? unitOverride : course.units;

  return {
    id: `${course.code}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceType,
    code: course.code,
    prefix: course.prefix,
    number: course.number,
    title: course.title,
    units,
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
  const [terms, setTermsState] = useState<PlannerTerm[]>([]);
  const [entries, setEntriesState] = useState<PlannerEntry[]>([]);
  const [rulesetId, setRulesetIdState] = useState<RulesetId>(DEFAULT_RULESET_ID);

  useEffect(() => {
    const snapshot = loadPlanFromStorage();

    if (snapshot) {
      setTermsState(snapshot.terms ?? []);
      setEntriesState(snapshot.entries ?? []);
      setRulesetIdState(snapshot.rulesetId ?? DEFAULT_RULESET_ID);
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

  const audit = useMemo(
    () => auditPlan(entries, rulesetId),
    [entries, rulesetId],
  );

  const addedCourseCodes = useMemo(
    () => new Set(entries.map((entry) => entry.code)),
    [entries],
  );

  function persist(nextTerms: PlannerTerm[], nextEntries: PlannerEntry[], nextRulesetId: RulesetId) {
    savePlanToStorage({
      version: 2,
      terms: nextTerms,
      entries: nextEntries,
      rulesetId: nextRulesetId,
    });
  }

  function setRulesetId(nextRulesetId: RulesetId) {
    setRulesetIdState(nextRulesetId);
    persist(terms, entries, nextRulesetId);
  }

  function setTerms(nextTerms: PlannerTerm[]) {
    setTermsState(nextTerms);
    persist(nextTerms, entries, rulesetId);
  }

  function setEntries(nextEntries: PlannerEntry[]) {
    setEntriesState(nextEntries);
    persist(terms, nextEntries, rulesetId);
  }

  function addCourse(
    course: CourseRecord,
    termId?: string,
    sourceType: "sdsu" | "transcript" | "manual" = "sdsu",
  ) {
    setEntriesState((currentEntries) => {
      if (currentEntries.some((entry) => entry.code === course.code)) {
        return currentEntries;
      }

      const nextEntries = [makeEntry(course, termId, sourceType), ...currentEntries];
      persist(terms, nextEntries, rulesetId);
      return nextEntries;
    });
  }

  function importTranscriptCourses(
    courses: CourseRecord[],
    transcriptTerms: TranscriptParsedTerm[],
    courseTermMap: Record<string, string>,
    courseUnitMap: Record<string, number> = {},
  ) {
    setTermsState((currentTerms) => {
      const existingTermIds = new Set(currentTerms.map((term) => term.id));

      const newTerms: PlannerTerm[] = transcriptTerms
        .filter((term) => !existingTermIds.has(term.id))
        .map((term, index) => ({
          id: term.id,
          name: term.name,
          sortOrder: currentTerms.length + index,
        }));

      const mergedTerms = [...currentTerms, ...newTerms];

      setEntriesState((currentEntries) => {
        const existingCourseCodes = new Set(
          currentEntries.map((entry) => entry.code),
        );

        const newEntries = courses
          .filter((course) => !existingCourseCodes.has(course.code))
          .map((course) =>
            makeEntry(
              course,
              courseTermMap[course.code],
              "transcript",
              courseUnitMap[course.code],
            ),
          );

        const mergedEntries = [...newEntries, ...currentEntries];
        persist(mergedTerms, mergedEntries, rulesetId);

        return mergedEntries;
      });

      return mergedTerms;
    });
  }

  function addManualTerm(season: string, year: string) {
    const name = `${season.trim().toUpperCase()} ${year.trim()}`;
    if (!/^(FALL|SPRING|SUMMER|WINTER)\s+\d{4}$/.test(name)) return;

    const id = termIdFromName(name);

    setTermsState((currentTerms) => {
      if (currentTerms.some((term) => term.id === id)) return currentTerms;

      const nextTerms = [...currentTerms, { id, name, sortOrder: currentTerms.length }];
      persist(nextTerms, entries, rulesetId);
      return nextTerms;
    });
  }

  function deleteTerm(termId: string) {
    const nextTerms = terms.filter((term) => term.id !== termId);
    const nextEntries = entries.map((entry) =>
      entry.termId === termId ? { ...entry, termId: undefined } : entry,
    );

    setTermsState(nextTerms);
    setEntriesState(nextEntries);
    persist(nextTerms, nextEntries, rulesetId);
  }

  function updateEntryTerm(entryId: string, termId?: string) {
    setEntriesState((currentEntries) => {
      const nextEntries = currentEntries.map((entry) =>
        entry.id === entryId ? { ...entry, termId: termId || undefined } : entry,
      );

      persist(terms, nextEntries, rulesetId);
      return nextEntries;
    });
  }

  function updateEntryUnits(entryId: string, units: number) {
    setEntriesState((currentEntries) => {
      const nextEntries = currentEntries.map((entry) =>
        entry.id === entryId ? { ...entry, units } : entry,
      );

      persist(terms, nextEntries, rulesetId);
      return nextEntries;
    });
  }

  function removeEntry(entryId: string) {
    setEntriesState((currentEntries) => {
      const nextEntries = currentEntries.filter((entry) => entry.id !== entryId);
      persist(terms, nextEntries, rulesetId);
      return nextEntries;
    });
  }

  function moveEntry(entryId: string, bucket: RequirementBucket | "auto") {
    setEntriesState((currentEntries) => {
      const nextEntries = currentEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              manualBucketOverride: bucket === "auto" ? undefined : bucket,
            }
          : entry,
      );

      persist(terms, nextEntries, rulesetId);
      return nextEntries;
    });
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