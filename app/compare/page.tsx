import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/CompareView";
import { PageHeader } from "@/components/PageHeader";
import { getCatalogue, toListItem } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <PageHeader kicker="Head to head · up to 4" title="Compare Machines">
        Overlay resistance curves, feel and accessibility. The best value in each row is marked.
      </PageHeader>
      <Suspense fallback={<p className="label text-ash">Racking up…</p>}>
        <CompareView items={getCatalogue().map(toListItem)} />
      </Suspense>
    </div>
  );
}
