import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/CompareView";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage() {
  return (
    <>
      <PageHead
        kicker="Compare"
        title="Head to head."
        sub="Compare up to four machines on resistance profile, feel, accessibility, specs and community votes. Share the URL to share the comparison."
      />
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 label">Loading comparison…</div>}>
        <CompareView />
      </Suspense>
    </>
  );
}
