import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS } from "@/data/brands";
import { MACHINES } from "@/data/machines";
import { PageHead } from "@/components/PageHead";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = { title: "Brands" };

export default function BrandsPage() {
  const groups = [
    { title: "In production", list: BRANDS.filter((b) => b.status === "active") },
    { title: "Vintage & legacy", list: BRANDS.filter((b) => b.status === "legacy") },
  ];
  return (
    <>
      <PageHead kicker="Brands" title="The makers." sub="Every manufacturer in the index, with country, founding year and how many machines we cover." />
      <div className="mx-auto max-w-7xl px-4 py-10">
        {groups.map((g) => (
          <section key={g.title} className="mb-14">
            <h2 className="label mb-4 text-paper">{g.title}</h2>
            <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {g.list.map((b, i) => {
                const count = MACHINES.filter((m) => m.brand === b.slug).length;
                return (
                  <Reveal key={b.slug} delay={(i % 3) * 80} className="bg-ink">
                    <Link href={`/brands/${b.slug}`} className="group block h-full p-6 transition-colors hover:bg-ink-2">
                      <div className="flex items-start justify-between gap-4">
                        <p className="display text-2xl text-paper">{b.name}</p>
                        <span className="font-mono text-3xl text-line-2 transition-colors group-hover:text-paper">{String(count).padStart(2, "0")}</span>
                      </div>
                      <p className="label mt-2">
                        {b.country} · est. {b.founded}
                        {b.ceased ? ` · ceased ${b.ceased}` : ""}
                      </p>
                      <p className="mt-4 text-sm text-mute">{b.blurb}</p>
                      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-bone transition-transform group-hover:translate-x-1">View machines →</p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
