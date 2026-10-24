import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND_MAP, BRANDS } from "@/data/brands";
import { MACHINES } from "@/data/machines";
import { MachineCard } from "@/components/MachineCard";
import { PageHead } from "@/components/PageHead";
import { RATING_KEYS, RATING_LABELS } from "@/lib/types";

export function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = BRAND_MAP[slug];
  return b ? { title: b.name, description: b.blurb } : {};
}

export default async function BrandPage({ params }: PageProps<"/brands/[slug]">) {
  const { slug } = await params;
  const b = BRAND_MAP[slug];
  if (!b) notFound();
  const machines = MACHINES.filter((m) => m.brand === slug);
  const avg = (k: (typeof RATING_KEYS)[number]) => machines.reduce((s, m) => s + m.ratings[k], 0) / Math.max(1, machines.length);

  return (
    <>
      {b.status === "legacy" && <div className="hazard h-2" aria-hidden />}
      <PageHead kicker={`${b.country} · est. ${b.founded}${b.ceased ? ` · ceased ${b.ceased}` : ""}${b.status === "legacy" ? " · Vintage" : ""}`} title={b.name} sub={b.blurb}>
        <div className="rise mt-8 grid grid-cols-3 gap-px border border-line bg-line sm:grid-cols-6" style={{ animationDelay: "180ms" }}>
          {RATING_KEYS.map((k) => (
            <div key={k} className="bg-ink p-3">
              <p className="label">{RATING_LABELS[k]}</p>
              <p className="mt-1 font-mono text-xl text-paper">{avg(k).toFixed(1)}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-4 font-mono text-xs uppercase tracking-wider">
          <a href={b.url} target="_blank" rel="noreferrer" className="text-mute hover:text-paper">Official site ↗</a>
          <Link href={`/catalogue?brands=${b.slug}${b.status === "legacy" ? "&era=legacy" : ""}`} className="text-mute hover:text-paper">
            Filter in catalogue →
          </Link>
        </div>
      </PageHead>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {machines.map((m, i) => (
          <MachineCard key={m.id} m={m} index={i} />
        ))}
      </div>
    </>
  );
}
