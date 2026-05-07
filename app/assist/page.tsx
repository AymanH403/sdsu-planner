"use client";

import { ExternalLink, Lock, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { openUrl } from "@tauri-apps/plugin-opener";

export default function AssistPage() {
  return (
    <AppShell>
      <div className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl xl:px-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          ASSIST Lookup
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Planned transfer-equivalency lookup for California students.
        </p>
      </div>

      <div className="space-y-6 p-6 xl:p-8">
        <section className="rounded-[32px] border border-amber-300/30 bg-amber-300/10 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-300 p-3 text-black">
              <Lock className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-amber-100">
                ASSIST integration coming soon
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-100/80">
                This feature will connect to ASSIST data once API access is available.
                For now, use ASSIST directly to verify transfer equivalents, then manually
                add the SDSU equivalent course in the dashboard.
              </p>

             <button
               type="button"
              onClick={async () => {
              try {
             await openUrl("https://www.assist.org");
              } catch (error) {
            console.error("Failed to open ASSIST:", error);
            window.location.href = "https://www.assist.org";
              }
            }}
                  className="mt-4 inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
                  >
                Visit ASSIST.org
               <ExternalLink className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 opacity-45 2xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Transfer Course Search
            </h2>

            <div className="mt-5 space-y-4">
              <input disabled placeholder="Source institution" className="h-11 w-full rounded-2xl border border-white/10 bg-black px-3 text-sm text-white" />
              <input disabled placeholder="Academic year" className="h-11 w-full rounded-2xl border border-white/10 bg-black px-3 text-sm text-white" />
              <input disabled placeholder="Transfer course, e.g. ACCT 116A" className="h-11 w-full rounded-2xl border border-white/10 bg-black px-3 text-sm text-white" />

              <button disabled className="inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black">
                <Search className="mr-2 h-4 w-4" />
                Search ASSIST
              </button>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Equivalent SDSU Course
            </h2>

            <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-black/40 p-6">
              <div className="text-sm font-semibold text-white">Example result</div>

              <div className="mt-4 rounded-2xl bg-white/5 p-4">
                <div className="text-lg font-semibold text-white">ACCTG 201</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Financial Accounting Fundamentals
                </div>

                <button disabled className="mt-4 inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black">
                  <Plus className="mr-2 h-4 w-4" />
                  Add equivalent
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}