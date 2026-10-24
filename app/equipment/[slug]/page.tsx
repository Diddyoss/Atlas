import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BodyMap } from "@/components/BodyMap";
import { CompareButton } from "@/components/CompareButton";
import { EquipmentCard } from "@/components/EquipmentCard";
import { EquipmentVisual } from "@/components/EquipmentVisual";
import { FeelRadar } from "@/components/FeelRadar";
import { ProfileViewer } from "@/components/ProfileViewer";
import { ScoreBar } from "@/components/ScoreBar";
import { VoteWidget } from "@/components/VoteWidget";
import { getCatalogue, getItem } from "@/lib/catalogue";
import { accessAverage, feelAverage, toCompareEntry } from "@/lib/compare";
import { MUSCLES } from "@/lib/muscles";
import { FEEL_LABELS, LOADING_LABELS, MOVEMENT_LABELS, type FeelKey } from "@/lib/types";

export function generateStaticParams() {
  return getCatalogue().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: PageProps<"/equipment/[slug]">): Promise<Metadata> {
  const item = getItem((await params).slug);
  return item ? { title: `${item.brand.name} ${item.name}`, description: item.editorialNote } : {};
}

export default function EquipmentPage({ params }: PageProps<"/equipment/[slug]">) {
  return (
    <Suspense fallback={<div className="label p-10 text-ash">Loading machine…</div>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/equipment/[slug]">, "params">) {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) notFound();

  // Same movement from other brands; reviewed machines with photos first
  const rank = (i: typeof item) => Number(!i.estimated) * 2 + Number(i.images.length > 0);
  const similar = getCatalogue()
    .filter((i) => i.movement === item.movement && i.brandSlug !== item.brandSlug)
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <nav className="label mb-6 flex flex-wrap gap-2 text-weld">
        <Link href="/catalogue" className="hover:text-chalk">
          Catalogue
        </Link>
        /
        <Link href={`/brands/${item.brand.slug}`} className="hover:text-chalk">
          {item.brand.name}
        </Link>
        /<span className="text-ash">{item.name}</span>
      </nav>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative border border-rivet">
          <EquipmentVisual item={item} className="aspect-[4/3]" sizes="(max-width: 1024px) 100vw, 55vw" priority />
          {item.vintage && (
            <span className="stencil absolute right-4 top-4 z-10 -rotate-6 border-4 border-chalk bg-ink/90 px-4 py-1 text-2xl text-chalk sm:text-3xl">
              Discontinued
            </span>
          )}
          {item.images[0] && (
            <a
              href={item.images[0].sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="label absolute bottom-2 left-2 z-10 max-w-[calc(100%-1rem)] truncate bg-ink/85 px-2 py-1 text-[0.6rem] text-ash hover:text-chalk"
            >
              Image: {item.images[0].credit} ↗
            </a>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="label text-ash">
              {item.brand.name}
              {item.series ? ` · ${item.series}` : ""}
              {item.years ? ` · ${item.years}` : ""}
            </p>
            <h1 className="stencil mt-2 text-5xl sm:text-6xl">{item.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              MOVEMENT_LABELS[item.movement],
              LOADING_LABELS[item.loading],
              item.isoLateral && "Iso-lateral",
              item.specs.priceBand,
              item.estimated && "Estimated profile",
            ]
              .filter(Boolean)
              .map((t) => (
                <span key={String(t)} className="label border border-rivet px-2 py-1 text-ash">
                  {t}
                </span>
              ))}
          </div>
          <p className="text-lg leading-relaxed">{item.editorialNote}</p>
          <div className="grid grid-cols-3 border border-rivet">
            <Big label="Feel avg" value={feelAverage(item)} />
            <Big label="Access avg" value={accessAverage(item)} />
            <Big label="Start load" value={`${item.accessibility.startingResistanceKg}kg`} />
          </div>
          <div className="flex flex-wrap gap-3">
            <CompareButton entry={toCompareEntry(item)} />
            <Link
              href={`/compare?ids=${[item.slug, ...similar.map((s) => s.slug)].slice(0, 3).join(",")}`}
              className="label border-2 border-rivet px-5 py-3 text-ash hover:border-chalk hover:text-chalk"
            >
              Compare with similar →
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <Panel title="Resistance profile" className="lg:col-span-2">
          <ProfileViewer profile={item.resistanceProfile} />
        </Panel>
        <Panel title="Muscles">
          <BodyMap selected={item.primaryMuscles} secondary={item.secondaryMuscles} compact />
          <div className="mt-4 space-y-1 text-sm">
            <p>
              <span className="label mr-2 text-chalk">Primary</span>
              {item.primaryMuscles.map((m) => MUSCLES[m].label).join(", ")}
            </p>
            {item.secondaryMuscles.length > 0 && (
              <p className="text-ash">
                <span className="label mr-2">Secondary</span>
                {item.secondaryMuscles.map((m) => MUSCLES[m].label).join(", ")}
              </p>
            )}
          </div>
        </Panel>

        <Panel title={item.estimated ? "Feel (estimated from movement type)" : "Feel (editorial)"}>
          <FeelRadar items={[{ label: item.name, feel: item.feel }]} />
          <div className="mt-4 space-y-3">
            {(Object.keys(FEEL_LABELS) as FeelKey[]).map((k) => (
              <ScoreBar key={k} label={FEEL_LABELS[k]} value={item.feel[k]} />
            ))}
          </div>
        </Panel>

        <Panel title="Accessibility">
          <div className="space-y-3">
            <ScoreBar label="Entry / exit" value={item.accessibility.entry} />
            <ScoreBar label="Adjustment ease" value={item.accessibility.adjustment} />
            <ScoreBar label="Beginner friendly" value={item.accessibility.beginner} />
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            <Spec k="Starting resistance" v={`${item.accessibility.startingResistanceKg} kg`} />
            <Spec k="Wheelchair transfer" v={item.accessibility.transferFriendly ? "Friendly" : "Not designed for"} />
            <Spec k="Max load" v={item.specs.maxLoad} />
            <Spec k="Footprint" v={item.specs.footprint} />
            <Spec k="Machine weight" v={item.specs.weightKg ? `${item.specs.weightKg} kg` : undefined} />
            <Spec k="Price band" v={item.specs.priceBand} />
          </dl>
        </Panel>

        <Panel title="Community">
          <VoteWidget item={item} />
        </Panel>

        {item.pros.length > 0 && (
          <Panel title="Pros">
            <ul className="space-y-2">
              {item.pros.map((p) => (
                <li key={p} className="flex gap-3 text-sm">
                  <span className="text-chalk">+</span>
                  {p}
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {item.cons.length > 0 && (
          <Panel title="Cons">
            <ul className="space-y-2">
              {item.cons.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-ash">
                  <span>−</span>
                  {p}
                </li>
              ))}
            </ul>
          </Panel>
        )}
        <Panel title="Sources">
          {item.sources.length ? (
            <ul className="space-y-2">
              {item.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-sm underline decoration-weld underline-offset-4 hover:decoration-chalk">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-weld">No source pages yet. Run the scraper to collect them.</p>
          )}
        </Panel>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="stencil mb-6 text-4xl">Same movement, other iron</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s, i) => (
              <EquipmentCard key={s.slug} item={s} index={i} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rivets border border-rivet bg-steel p-5 pt-7 ${className}`}>
      <h2 className="label mb-4 border-b border-rivet pb-2 text-chalk">{title}</h2>
      {children}
    </section>
  );
}

function Big({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-r border-rivet p-3 last:border-r-0">
      <p className="stencil text-3xl">{value}</p>
      <p className="label text-weld">{label}</p>
    </div>
  );
}

function Spec({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-rivet/60 pb-1">
      <dt className="text-ash">{k}</dt>
      <dd className="font-mono">{v}</dd>
    </div>
  );
}
