import type { Metadata } from "next";
import { Suspense } from "react";
import { GymBuilder } from "@/components/GymBuilder";
import { PageHeader } from "@/components/PageHeader";
import { getCatalogue, toListItem } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Build your gym" };

export default function BuildPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <PageHeader kicker="Fictional budget · Singapore prices" title="Build Your Gym">
        Pick a budget and fill the floor. Prices are what each machine would roughly cost landed in Singapore: freight,
        distributor margin, specialist-import premium and 9% GST included. Vintage machines use used-market prices. The
        score rates coverage, balance, variety, quality and how well you use the money.
      </PageHeader>
      <Suspense fallback={<p className="label text-ash">Unloading the truck…</p>}>
        <GymBuilder items={getCatalogue().map(toListItem)} />
      </Suspense>
    </div>
  );
}
