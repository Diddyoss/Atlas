import Link from "next/link";
import { BRAND_MAP } from "@/data/brands";
import { MACHINES } from "@/data/machines";
import { BodyMap } from "./BodyMap";
import { CompareButton } from "./CompareButton";
import { CurveChart } from "./CurveChart";
import { MachineCard } from "./MachineCard";
import { MachineVisual } from "./MachineVisual";
import { RadarChart } from "./RadarChart";
import { Reveal } from "./Reveal";
import { VoteWidget } from "./VoteWidget";
import { describeCurve, resistanceCurve } from "@/lib/curve";
import { type Machine, CURVE_LABELS, LOAD_LABELS, MOVEMENT_LABELS, MUSCLE_LABELS, RATING_HINTS, RATING_KEYS, RATING_LABELS } from "@/lib/types";

export function MachineDetail({ m }: { m: Machine }) {
  const brand = BRAND_MAP[m.brand];
  const curve = describeCurve(resistanceCurve(m));
  const similar = MACHINES.filter((x) => x.id !== m.id && x.movement === m.movement).slice(0, 4);
  const alternatives =
    similar.length >= 2 ? similar : MACHINES.filter((x) => x.id !== m.id && x.primary.some((p) => m.primary.includes(p))).slice(0, 4);

  const specRows: [string, string][] = [
    ["Movement", MOVEMENT_LABELS[m.movement]],
    ["Loading", LOAD_LABELS[m.load]],
    ["Independent arms", m.unilateral ? "Yes" : "No"],
    ["Weight", `≈ ${m.specs.weightKg} kg`],
    ["Footprint", `≈ ${m.specs.dimensionsCm.join(" × ")} cm`],
    ...(m.specs.stackKg ? ([["Weight stack", `${m.specs.stackKg} kg`]] as [string, string][]) : []),
    ...(m.specs.maxLoadKg ? ([["Max plate load", `≈ ${m.specs.maxLoadKg} kg`]] as [string, string][]) : []),
    ["Starting resistance", `≈ ${m.specs.startingResistanceKg} kg`],
    ["Adjustments", m.specs.adjustments.join(", ")],
    ["Price tier", "$".repeat(m.priceTier)],
    ...(m.years ? ([["Production", `${m.years[0]}–${m.years[1] ?? "?"}`]] as [string, string][]) : []),
  ];

  return (
    <article>
      <section className="grid-bg border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
          <div className="rise relative aspect-[4/3] border border-line bg-ink p-8">
            <MachineVisual m={m} live />
            <span className="label absolute bottom-3 left-3">{m.image ? m.imageCredit ?? "Manufacturer photo" : "Illustration · photo pending"}</span>
            {brand.status === "legacy" && <span className="label absolute right-3 top-3 bg-hazard px-2 py-0.5 text-ink">Vintage</span>}
          </div>
          <div className="flex flex-col">
            <nav className="label rise">
              <Link href="/catalogue" className="hover:text-paper">Catalogue</Link> /{" "}
              <Link href={`/brands/${brand.slug}`} className="hover:text-paper">{brand.name}</Link>
            </nav>
            <h1 className="display rise mt-4 text-[clamp(2.2rem,5vw,4rem)] text-paper" style={{ animationDelay: "60ms" }}>
              {m.name}
            </h1>
            <p className="rise mt-2 font-mono text-sm uppercase tracking-wider text-mute" style={{ animationDelay: "100ms" }}>
              {brand.name}
              {m.line ? ` · ${m.line}` : ""}
            </p>
            <p className="rise mt-6 max-w-xl text-lg text-bone" style={{ animationDelay: "140ms" }}>
              {m.description}
            </p>
            <div className="rise mt-6 flex flex-wrap gap-2" style={{ animationDelay: "180ms" }}>
              {m.primary.map((x) => (
                <Link key={x} href={`/catalogue?muscles=${x}`} className="bg-paper px-2 py-1 text-xs font-bold text-ink">
                  {MUSCLE_LABELS[x]}
                </Link>
              ))}
              {m.secondary.map((x) => (
                <Link key={x} href={`/catalogue?muscles=${x}`} className="border border-line-2 px-2 py-1 text-xs text-bone hover:border-paper">
                  {MUSCLE_LABELS[x]}
                </Link>
              ))}
            </div>
            <div className="rise mt-auto flex flex-wrap gap-3 pt-8" style={{ animationDelay: "220ms" }}>
              <CompareButton id={m.id} size="lg" />
              <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="border border-line-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider hover:border-paper">
                Brand site ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 lg:grid-cols-[1.4fr_1fr]">
        <Reveal className="panel p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="display text-2xl text-paper">Resistance profile</h2>
            <p className="label">{CURVE_LABELS[m.curve]}</p>
          </div>
          <p className="mt-1 text-sm text-mute">{curve.label}. Modelled from the lever and cam geometry, normalised to the machine&apos;s own peak.</p>
          <div className="mt-6">
            <CurveChart machines={[m]} />
          </div>
        </Reveal>
        <Reveal className="panel p-6" delay={100}>
          <h2 className="display text-2xl text-paper">Muscles</h2>
          <div className="mt-6">
            <BodyMap selected={m.primary} secondary={m.secondary} />
          </div>
          <p className="label mt-4 text-center">
            <span className="mr-1 inline-block h-2 w-2 bg-paper" /> Primary
            <span className="ml-4 mr-1 inline-block h-2 w-2 bg-mute" /> Secondary
          </p>
        </Reveal>

        <Reveal className="panel p-6">
          <h2 className="display text-2xl text-paper">Scores</h2>
          <p className="label mt-1">Editorial estimate · 1–10</p>
          <div className="mt-4 grid items-center gap-6 sm:grid-cols-2">
            <RadarChart machines={[m]} size={300} />
            <ul className="space-y-3">
              {RATING_KEYS.map((k, i) => (
                <li key={k} title={RATING_HINTS[k]}>
                  <div className="flex justify-between text-sm">
                    <span>{RATING_LABELS[k]}</span>
                    <span className="font-mono text-paper">{m.ratings[k].toFixed(1)}</span>
                  </div>
                  <div className="mt-1 h-1 bg-ink-3">
                    <div className="rise h-full origin-left bg-paper" style={{ width: `${m.ratings[k] * 10}%`, animationDelay: `${i * 80}ms` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal className="panel p-6" delay={100}>
          <h2 className="display text-2xl text-paper">Specs</h2>
          <p className="label mt-1">Approximate · check the brand sheet</p>
          <dl className="mt-4 divide-y divide-line">
            {specRows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[1fr_1.4fr] gap-3 py-2 text-sm">
                <dt className="text-mute">{k}</dt>
                <dd className="text-paper">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="lg:col-span-2">
          <Reveal>
            <VoteWidget m={m} />
          </Reveal>
        </div>
      </div>

      {alternatives.length > 0 && (
        <section className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="display text-3xl text-paper">Alternatives</h2>
            <Link
              href={`/compare?ids=${[m.id, ...alternatives.slice(0, 3).map((a) => a.id)].join(",")}`}
              className="font-mono text-xs uppercase tracking-wider text-mute hover:text-paper"
            >
              Compare all →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {alternatives.map((a, i) => (
              <MachineCard key={a.id} m={a} index={i} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
