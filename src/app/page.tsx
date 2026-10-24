import Form from "next/form";
import Link from "next/link";
import { BRANDS } from "@/data/brands";
import { MACHINE_MAP, MACHINES } from "@/data/machines";
import { Counter } from "@/components/Counter";
import { CurveChart } from "@/components/CurveChart";
import { MachineArt } from "@/components/MachineArt";
import { MachineCard } from "@/components/MachineCard";
import { MuscleJump } from "@/components/MuscleJump";
import { Reveal } from "@/components/Reveal";

const SHOOTOUTS = [
  {
    title: "Pendulum squat shootout",
    ids: ["atlantis-pendulum-squat", "panatta-super-pendulum-squat", "watson-pendulum-squat", "arsenal-reloaded-pendulum-squat"],
  },
  {
    title: "Lateral raise machines",
    ids: ["panatta-super-lateral-raise", "atlantis-standing-lateral-raise", "arsenal-reloaded-lateral-raise", "watson-animal-lateral-raise"],
  },
  {
    title: "Pullover: then vs now",
    ids: ["nautilus-classic-pullover-machine", "medx-avenger-pullover", "nautilus-inspiration-pullover"],
  },
];

export default function Home() {
  const active = BRANDS.filter((b) => b.status === "active");
  const legacy = BRANDS.filter((b) => b.status === "legacy");
  const featured = ["hammer-strength-iso-lateral-incline-press", "panatta-super-lat-machine", "prime-hybrid-seated-leg-curl", "atlantis-pendulum-squat"].map(
    (id) => MACHINE_MAP[id],
  );
  const pendulums = SHOOTOUTS[0].ids.map((id) => MACHINE_MAP[id]);

  return (
    <>
      {/* Hero */}
      <section className="grid-bg relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <p className="label rise">
              <span className="blink mr-2 inline-block h-2 w-2 bg-paper align-middle" />
              Strength machine index · v1
            </p>
            <h1 className="display rise mt-5 text-[clamp(3rem,9vw,7.5rem)] text-paper" style={{ animationDelay: "80ms" }}>
              Every
              <br />
              machine.
              <br />
              <span className="text-transparent [-webkit-text-stroke:2px_var(--paper)]">Weighed.</span>
            </h1>
            <p className="rise mt-6 max-w-lg text-lg text-mute" style={{ animationDelay: "160ms" }}>
              Compare resistance profiles, feel, accessibility and community votes across {active.length} active brands and{" "}
              {legacy.length} vintage lines. Search by brand, machine or the muscle you want to grow.
            </p>
            <Form action="/catalogue" className="rise mt-8 flex max-w-lg border border-line-2 bg-ink focus-within:border-paper" style={{ animationDelay: "240ms" }}>
              <input
                name="q"
                placeholder="Try “pendulum”, “Panatta”, “lats”…"
                className="flex-1 bg-transparent px-4 py-3 text-paper outline-none placeholder:text-mute"
              />
              <button className="bg-paper px-5 font-mono text-xs font-bold uppercase tracking-wider text-ink">Search</button>
            </Form>
          </div>
          <div className="rise relative aspect-square" style={{ animationDelay: "200ms" }}>
            <div className="absolute inset-0 border border-line" />
            <div className="absolute inset-6 border border-dashed border-line-2" />
            <MachineArt movement="squat" load="plate-loaded" live className="absolute inset-10 text-paper" />
            <span className="label absolute bottom-3 left-3">Fig. 01 — Pendulum squat</span>
            <span className="label absolute right-3 top-3">Plate-loaded</span>
          </div>
        </div>
      </section>

      {/* Brand marquee */}
      <section className="overflow-hidden border-b border-line bg-paper py-4 text-ink" aria-label="Brands">
        <div className="marquee flex w-max gap-12 whitespace-nowrap">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <Link key={i} href={`/brands/${b.slug}`} className="display text-2xl hover:underline">
              {b.name}
              <span className="ml-12 opacity-30">✕</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 border-x border-line md:grid-cols-4">
        {[
          { n: MACHINES.length, l: "Machines" },
          { n: active.length, l: "Active brands" },
          { n: legacy.length, l: "Vintage lines" },
          { n: 20, l: "Muscle groups" },
        ].map((s) => (
          <div key={s.l} className="border-b border-r border-line p-6 last:border-r-0">
            <p className="display text-5xl text-paper">
              <Counter to={s.n} />
            </p>
            <p className="label mt-2">{s.l}</p>
          </div>
        ))}
      </section>

      {/* Body map */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <Reveal className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="label">Search by function</p>
            <h2 className="display mt-3 text-5xl text-paper">Pick a muscle.</h2>
            <p className="mt-4 max-w-md text-mute">
              Tap any muscle to see every machine that trains it, ranked with primary movers first. Combine it with brand and
              loading filters in the catalogue.
            </p>
            <Link href="/catalogue" className="mt-6 inline-block border border-paper px-5 py-3 font-mono text-xs uppercase tracking-wider hover:bg-paper hover:text-ink">
              Open catalogue →
            </Link>
          </div>
          <MuscleJump />
        </Reveal>
      </section>

      {/* Curve preview */}
      <section className="border-y border-line bg-ink-2">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label">Resistance profiles</p>
                <h2 className="display mt-3 text-5xl text-paper">Same lift. Different curve.</h2>
              </div>
              <Link href={`/compare?ids=${SHOOTOUTS[0].ids.join(",")}`} className="font-mono text-xs uppercase tracking-wider text-mute hover:text-paper">
                Full comparison →
              </Link>
            </div>
            <div className="panel mt-8 p-6">
              <CurveChart machines={pendulums} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <Reveal>
          <p className="label">Benchmarks</p>
          <h2 className="display mt-3 text-5xl text-paper">Floor legends.</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((m, i) => (
            <MachineCard key={m.id} m={m} index={i} />
          ))}
        </div>
      </section>

      {/* Shootouts */}
      <section className="mx-auto max-w-7xl px-4">
        <Reveal>
          <p className="label">Head to head</p>
          <h2 className="display mt-3 text-5xl text-paper">Shootouts.</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {SHOOTOUTS.map((s, i) => (
            <Reveal key={s.title} delay={i * 100}>
              <Link href={`/compare?ids=${s.ids.join(",")}`} className="card panel block p-6">
                <p className="label">{s.ids.length} machines</p>
                <h3 className="mt-2 text-xl font-bold text-paper">{s.title}</h3>
                <div className="mt-6 flex gap-2">
                  {s.ids.map((id) => (
                    <MachineArt key={id} movement={MACHINE_MAP[id].movement} load={MACHINE_MAP[id].load} className="h-10 w-12 text-bone" />
                  ))}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Vintage teaser */}
      <section className="mx-auto mt-20 max-w-7xl px-4">
        <Reveal>
          <Link href="/vintage" className="card group block border border-line">
            <div className="hazard h-3" />
            <div className="grid gap-6 p-8 md:grid-cols-[2fr_1fr] md:items-end">
              <div>
                <p className="label">The vault</p>
                <h2 className="display mt-3 text-5xl text-paper">Vintage iron.</h2>
                <p className="mt-4 max-w-xl text-mute">
                  Arthur Jones&apos; Nautilus cams, MedX precision, Cybex Eagle, Flex and Icarian. Discontinued machines still
                  worth tracking down, kept separate from the main catalogue.
                </p>
              </div>
              <p className="font-mono text-sm uppercase tracking-wider text-paper transition-transform group-hover:translate-x-2">
                {legacy.map((b) => b.name.split(" ")[0]).join(" · ")} →
              </p>
            </div>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
