import Link from "next/link";
import { Suspense } from "react";
import { LINKS } from "@/lib/nav";
import { NavLinks } from "./NavLinks";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-rivet bg-ink/85 backdrop-blur">
      <div className="hazard h-1 w-full opacity-80" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Logo />
          <span className="stencil text-2xl tracking-wide">
            Iron<span className="text-ash transition-colors group-hover:text-chalk">Atlas</span>
          </span>
        </Link>
        <Suspense
          fallback={
            <nav className="flex gap-1">
              {LINKS.map((l) => (
                <span key={l.href} className="label px-3 py-2 text-ash">
                  {l.label}
                </span>
              ))}
            </nav>
          }
        >
          <NavLinks />
        </Suspense>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8 transition-transform duration-700 group-hover:rotate-180" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="20" cy="20" r="4" fill="currentColor" />
    </svg>
  );
}
