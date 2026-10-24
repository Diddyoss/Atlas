import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogueBrowser } from "@/components/CatalogueBrowser";
import { PageHeader } from "@/components/PageHeader";
import { getBrands, getCatalogue, toListItem } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Vintage" };

const BASE = { vintage: "only" as const };

export default function VintagePage() {
  const items = getCatalogue()
    .filter((i) => i.vintage)
    .map(toListItem);
  const all = getBrands();
  const defunct = all.filter((b) => b.status === "defunct");
  const brands = all.map(({ slug, name, status }) => ({ slug, name, status }));
  return (
    <div className="grain relative">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <PageHeader kicker="Archive · discontinued lines" title="The Vintage Vault">
          Out-of-business brands and retired lines. These machines built the golden era and still trade hands on the
          used market.
        </PageHeader>

        <div className="scrollbar-none -mx-4 mb-10 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {defunct.map((b) => (
            <Link
              key={b.slug}
              href={`/brands/${b.slug}`}
              className="group min-w-[220px] flex-1 border border-rivet bg-steel p-4 transition-colors hover:border-chalk"
            >
              <p className="label text-weld">
                {b.founded ?? "?"}–{b.defunctYear ?? "?"} · {b.country}
              </p>
              <p className="stencil mt-1 text-2xl group-hover:underline">{b.name}</p>
              <p className="mt-2 line-clamp-2 text-xs text-ash">{b.note}</p>
            </Link>
          ))}
        </div>

        <Suspense fallback={<p className="label text-ash">Opening the vault…</p>}>
          <CatalogueBrowser items={items} brands={brands} base={BASE} />
        </Suspense>
      </div>
    </div>
  );
}
