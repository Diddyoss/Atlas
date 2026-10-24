"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LINKS } from "@/lib/nav";

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`label relative px-3 py-2 transition-colors ${active ? "text-ink" : "text-ash hover:text-chalk"}`}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 bg-chalk"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
