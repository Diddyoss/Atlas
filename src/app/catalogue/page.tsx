import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalogue } from "@/components/Catalogue";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Catalogue" };

export default function CataloguePage() {
  return (
    <>
      <PageHead kicker="Catalogue" title="Find your machine." sub="Search by brand, name or the muscle you want to train, then add up to four machines to compare." />
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 label">Loading catalogue…</div>}>
        <Catalogue />
      </Suspense>
    </>
  );
}
