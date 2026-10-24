import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogueBrowser } from "@/components/CatalogueBrowser";
import { PageHeader } from "@/components/PageHeader";
import { getBrands, getCatalogue } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Catalogue" };

export default function CataloguePage() {
  const items = getCatalogue();
  const brands = getBrands().map(({ slug, name, status }) => ({ slug, name, status }));
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <PageHeader kicker={`${items.length} machines · ${brands.length} brands`} title="The Catalogue">
        Search by name or brand, or tap the muscles you want to train on the body map.
      </PageHeader>
      <Suspense fallback={<p className="label text-ash">Loading catalogue…</p>}>
        <CatalogueBrowser items={items} brands={brands} />
      </Suspense>
    </div>
  );
}
