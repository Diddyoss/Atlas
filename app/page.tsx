import Link from "next/link";
import { EquipmentCard } from "@/components/EquipmentCard";
import { HomeHero } from "@/components/HomeHero";
import { Leaderboard } from "@/components/Leaderboard";
import { Marquee } from "@/components/Marquee";
import { Reveal } from "@/components/Reveal";
import { getBrands, getCatalogue, getItem } from "@/lib/catalogue";
import { MUSCLES, type MuscleId } from "@/lib/muscles";

const MATCHUPS = [
  {
    title: "Pendulum wars",
    blurb: "Four stretch-loaded quad machines, head to head.",
    ids: ["panatta-super-pendulum-squat", "watson-pendulum-squat", "newtech-pendulum-squat", "arsenal-reloaded-pendulum-squat"],
  },
  {
    title: "Hack squat: old vs new",
    blurb: "Panatta's tilting backrest against Cybex and Icarian classics.",
    ids: ["panatta-super-hack-squat", "cybex-plate-loaded-hack-squat", "icarian-hack-squat"],
  },
  {
    title: "Side delt showdown",
    blurb: "Machines that fix the dumbbell lateral raise's dead bottom.",
    ids: ["atlantis-standing-lateral-raise", "newtech-lateral-raise", "atlantis-seated-lateral-raise"],
  },
  {
    title: "The pullover lineage",
    blurb: "Arthur Jones' 1970 original against Newtech's modern take.",
    ids: ["nautilus-pullover-classic", "newtech-pullover"],
  },
];

const MUSCLE_SHORTCUTS: MuscleId[] = ["quads", "glutes", "lats", "chest", "side-delts", "hamstrings", "upper-back", "calves"];

export default function Home() {
  const items = getCatalogue();
  const brands = getBrands();
  const picks = items.filter((i) => i.editorialFavorite);
  const vintagePicks = items.filter((i) => i.vintage && i.editorialFavorite).slice(0, 3);

  return (
    <>
      <HomeHero
        stats={[
          { label: "Machines", value: items.length },
          { label: "Brands", value: brands.length },
          { label: "Vintage", value: items.filter((i) => i.vintage).length },
        ]}
      />
      <Marquee items={brands.map((b) => ({ slug: b.slug, name: b.name, defunct: b.status === "defunct" }))} />

      <div className="mx-auto max-w-7xl space-y-24 px-4 py-20 sm:px-8">
        <section>
          <Reveal>
            <h2 className="stencil text-5xl">Train by function</h2>
            <p className="mt-2 text-ash">Jump straight to machines that hit what you want to grow.</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-px bg-rivet sm:grid-cols-4">
            {MUSCLE_SHORTCUTS.map((m, i) => {
              const count = items.filter((it) => it.primaryMuscles.includes(m)).length;
              return (
                <Reveal key={m} delay={i * 0.04}>
                  <Link
                    href={`/catalogue?muscle=${m}&primary=1`}
                    className="group relative block overflow-hidden bg-ink p-6 transition-colors hover:bg-chalk hover:text-ink"
                  >
                    <p className="label opacity-60">{count} machines</p>
                    <p className="stencil mt-2 text-3xl">{MUSCLES[m].label}</p>
                    <span className="absolute bottom-4 right-4 translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                      →
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section>
          <Reveal>
            <h2 className="stencil text-5xl">Featured matchups</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {MATCHUPS.map((m, i) => (
              <Reveal key={m.title} delay={i * 0.06}>
                <Link
                  href={`/compare?ids=${m.ids.join(",")}`}
                  className="diamond-plate group block border border-rivet p-6 transition-colors hover:border-chalk"
                >
                  <p className="label text-ash">{m.ids.length} machines</p>
                  <p className="stencil mt-2 text-3xl group-hover:underline">{m.title}</p>
                  <p className="mt-2 text-sm text-ash">{m.blurb}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {m.ids.map((id) => {
                      const it = getItem(id);
                      return (
                        it && (
                          <li key={id} className="label border border-rivet bg-ink/70 px-2 py-1 text-[0.6rem]">
                            {it.brand.name} {it.name}
                          </li>
                        )
                      );
                    })}
                  </ul>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <Reveal>
              <h2 className="stencil text-5xl">Community favorites</h2>
              <p className="mt-2 text-ash">Ranked by lifters&apos; votes on this site.</p>
            </Reveal>
            <div className="mt-8">
              <Leaderboard
                fallback={picks.map((p) => ({ slug: p.slug, name: p.name, brand: p.brand.name, vintage: p.vintage }))}
              />
            </div>
          </div>
          <div>
            <Reveal>
              <h2 className="stencil text-5xl">From the vault</h2>
              <p className="mt-2 text-ash">
                Discontinued legends.{" "}
                <Link href="/vintage" className="underline underline-offset-4 hover:text-chalk">
                  Open the vintage section →
                </Link>
              </p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {vintagePicks.map((it, i) => (
                <EquipmentCard key={it.slug} item={it} index={i} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
