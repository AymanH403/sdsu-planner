import type { PlanSnapshot } from "./types";

const STORAGE_KEY = "sdsu-planner-auto-audit-v1";

export function savePlanToStorage(snapshot: PlanSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadPlanFromStorage(): PlanSnapshot | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PlanSnapshot;
  } catch {
    return null;
  }
}