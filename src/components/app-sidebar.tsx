"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/material-icon";
import { NAV_ITEMS, isActive } from "@/components/nav-items";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col gap-8 border-r border-white/12 bg-surface-container-low/60 p-6 shadow-[0_0_40px_rgba(16,185,129,0.1)] backdrop-blur-3xl md:flex">
      {/* Brand */}
      <Link href="/dashboard" className="flex flex-col gap-1 px-2 pt-1">
        <div className="flex items-center gap-3">
          <MaterialIcon name="map" fill className="text-primary text-2xl" />
          <span className="font-display text-2xl font-bold tracking-tight text-primary">
            RoadFolio
          </span>
        </div>
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          Learning Explorer
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 active:scale-[0.98]",
                active
                  ? "border border-primary/20 bg-primary-container/20 font-semibold text-primary"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
              )}
            >
              <MaterialIcon name={item.icon} fill={active} />
              <span className="font-body-md text-body-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Import CTA */}
      <Link
        href="/roadmaps/import"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 font-body-md text-body-md font-semibold text-on-primary shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all hover:bg-primary active:scale-[0.98]"
      >
        <MaterialIcon name="add" className="text-[18px]" />
        Import roadmap
      </Link>
    </aside>
  );
}
