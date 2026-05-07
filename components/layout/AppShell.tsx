"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe2,
  LayoutDashboard,
  ListChecks,
  Network,
  Settings2,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-black/70 p-6 xl:block">
          <div className="mb-10">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              CPA Planner
            </Link>
            <div className="mt-1 text-xs text-zinc-500">
              SDSU · California audit beta
            </div>
          </div>

          <nav className="space-y-2">
            <NavLink
              href="/dashboard"
              label="Dashboard"
              icon={LayoutDashboard}
              active={pathname === "/dashboard"}
            />

            <NavLink
              href="/allocations"
              label="Allocations"
              icon={ListChecks}
              active={pathname === "/allocations"}
            />

            <NavLink
              href="/settings"
              label="Settings"
              icon={Settings2}
              active={pathname === "/settings"}
            />

            <div className="pt-8">
              <div className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                In development
              </div>

              <div className="space-y-2">
                <NavLink
                  href="/assist"
                  label="ASSIST Lookup"
                  icon={Network}
                  active={pathname === "/assist"}
                />

                <DisabledRoadmapItem
                  label="Other Universities"
                  icon={Globe2}
                  description="Catalog switching roadmap"
                />
              </div>
            </div>
          </nav>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: any;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
        active
          ? "bg-white text-black"
          : "text-zinc-300 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function DisabledRoadmapItem({
  label,
  icon: Icon,
  description,
}: {
  label: string;
  icon: any;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 px-4 py-3 opacity-45">
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-1 pl-7 text-xs text-zinc-600">{description}</div>
    </div>
  );
}