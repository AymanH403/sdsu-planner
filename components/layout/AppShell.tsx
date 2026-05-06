"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Settings2 } from "lucide-react";

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
            <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} active={pathname === "/dashboard"} />
            <NavLink href="/allocations" label="Allocations" icon={ListChecks} active={pathname === "/allocations"} />
            <NavLink href="/settings" label="Settings" icon={Settings2} active={pathname === "/settings"} />
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