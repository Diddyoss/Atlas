import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogueBrowser } from "@/components/CatalogueBrowser";
import { PageHeader } from "@/components/PageHeader";
import { getBrands, getCatalogue, toListItem } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Free weights" };

export default function FreeWeightsPage() {
  const items = getCatalogue()
    .filter((i) => i.loading === "free-weight")
    .map(toListItem);
  const brands = getBrands()
    .filter((b) => items.some((i) => i.brandSlug === b.slug))
    .map(({ slug, name, status }) => ({ slug, name, status }));
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <PageHeader kicker={`${items.length} sets · dumbbells, fixed barbells, bars, plates`} title="Free Weights">
        Dumbbell sets, fixed barbells, Olympic bars and plate kits, priced as complete sets landed in Singapore. Plate
        kits are what load your plate-loaded machines.
      </PageHeader>
      <Suspense fallback={<p className="label text-ash">Racking the plates…</p>}>
        <CatalogueBrowser items={items} brands={brands} />
      </Suspense>
    </div>
  );
}
