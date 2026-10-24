import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BRANDS } from "@/data/brands";
import { Catalogue } from "@/components/Catalogue";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Vintage" };

export default function VintagePage() {
  const legacy = BRANDS.filter((b) => b.status === "legacy");
  return (
    <>
      <div className="hazard h-2" aria-hidden />
      <PageHead
        kicker="The vault · discontinued & legacy lines"
        title="Vintage iron."
        sub="Machines that are out of production or from brands that no longer make them. You'll mostly find these second-hand or in old-school gyms."
      >
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {legacy.map((b, i) => (
            <Link key={b.slug} href={`/brands/${b.slug}`} className="card rise panel block p-4" style={{ animationDelay: `${150 + i * 60}ms` }}>
              <p className="label">
                {b.founded}
                {b.ceased ? `–${b.ceased}` : ""} · {b.country}
              </p>
              <p className="mt-1 font-bold text-paper">{b.name}</p>
            </Link>
          ))}
        </div>
      </PageHead>
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 label">Loading…</div>}>
        <Catalogue fixedEra="legacy" />
      </Suspense>
    </>
  );
}
