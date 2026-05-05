import type { PlanSnapshot } from "./types";

const STORAGE_KEY = "sdsu-planner-auto-audit-v2";

export function savePlanToStorage(snapshot: PlanSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadPlanFromStorage(): PlanSnapshot | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    return {
      version: 2,
      terms: Array.isArray(parsed.terms) ? parsed.terms : [],
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      rulesetId: parsed.rulesetId,
    };
  } catch {
    return null;
  }
}

export function exportPlan(snapshot: PlanSnapshot) {
  const payload: PlanSnapshot = {
    ...snapshot,
    version: 2,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `cpa-plan-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

export async function importPlanFile(file: File): Promise<PlanSnapshot> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  if (!Array.isArray(parsed.entries)) {
    throw new Error("Invalid plan file: missing entries.");
  }

  return {
    version: 2,
    terms: Array.isArray(parsed.terms) ? parsed.terms : [],
    entries: parsed.entries,
    rulesetId: parsed.rulesetId,
  };
}