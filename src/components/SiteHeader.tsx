"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare } from "@/lib/store";

const NAV = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/compare", label: "Compare" },
  { href: "/brands", label: "Brands" },
  { href: "/vintage", label: "Vintage" },
];

export function SiteHeader() {
  const path = usePathname();
  const { ids } = useCompare();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="grid h-7 w-7 place-items-center bg-paper text-ink transition-transform duration-500 group-hover:rotate-90">
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
              <rect x="1" y="8" width="18" height="4" fill="currentColor" />
              <rect x="3" y="4" width="3" height="12" fill="currentColor" />
              <rect x="14" y="4" width="3" height="12" fill="currentColor" />
            </svg>
          </span>
          <span className="display hidden text-lg min-[420px]:inline">Atlas</span>
        </Link>
        <nav className="ml-auto flex h-full min-w-0 items-stretch overflow-x-auto text-xs sm:gap-1 sm:text-sm">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative flex shrink-0 items-center px-2 uppercase tracking-wider transition-colors sm:px-3 ${
                  active ? "text-paper" : "text-mute hover:text-paper"
                }`}
              >
                {n.label}
                {n.href === "/compare" && ids.length > 0 && (
                  <span key={ids.length} className="pop ml-1.5 inline-grid h-4 min-w-4 place-items-center bg-paper px-1 font-mono text-[10px] text-ink">
                    {ids.length}
                  </span>
                )}
                <span
                  className={`absolute inset-x-2 bottom-0 h-px sm:inset-x-3 bg-paper transition-transform duration-300 ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
