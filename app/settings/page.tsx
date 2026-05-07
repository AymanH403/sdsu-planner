"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PlanActions } from "@/components/planner/PlanActions";
import { RULESETS } from "@/lib/rulesets";
import { usePlannerState } from "@/lib/usePlannerState";
import type { RulesetId } from "@/lib/types";

export default function SettingsPage() {
  const planner = usePlannerState();
  const [showHistoricalRules, setShowHistoricalRules] = useState(() => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("show-legacy-rules") === "true";
});

  const visibleRulesets = Object.values(RULESETS).filter(
    (ruleset) => showHistoricalRules || ruleset.id === "CA_2027_PLUS",
  );

  return (
    <AppShell>
      <div className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl xl:px-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Export/import plans and configure rulesets.
        </p>
      </div>

      <div className="space-y-6 p-6 xl:p-8">
        <section className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white">Ruleset</h2>

          <select
            value={planner.rulesetId}
            onChange={(e) => planner.setRulesetId(e.target.value as RulesetId)}
            className="mt-4 h-11 rounded-2xl border border-white/10 bg-black px-3 text-sm text-white"
          >
            {visibleRulesets.map((ruleset) => (
              <option key={ruleset.id} value={ruleset.id}>
                {ruleset.label}
              </option>
            ))}
          </select>

          <label className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={showHistoricalRules}
              onChange={(e) => {
              const checked = e.target.checked;

              setShowHistoricalRules(checked);
              window.localStorage.setItem("show-legacy-rules", String(checked));

                if (!checked && planner.rulesetId !== "CA_2027_PLUS") {
                planner.setRulesetId("CA_2027_PLUS");
              }
            }}
            />
            Show legacy rules
          </label>
        </section>

        <PlanActions
          snapshot={planner.snapshot}
          onImportPlan={(imported) => {
            planner.setTerms(imported.terms);
            planner.setEntries(imported.entries);
            planner.setRulesetId(imported.rulesetId);
          }}
        />
      </div>
    </AppShell>
  );
}