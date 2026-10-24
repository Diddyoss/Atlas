"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { scoreGym, suggestAdditions, type BuildLine } from "@/lib/gym-score";
import { MUSCLES } from "@/lib/muscles";
import { formatSgd } from "@/lib/pricing";
import { createIndex } from "@/lib/search";
import { MOVEMENT_LABELS, MOVEMENTS, type CatalogueItem, type Movement } from "@/lib/types";

const PRESETS = [
  { label: "Garage", budget: 40_000, blurb: "A serious home setup" },
  { label: "Studio", budget: 150_000, blurb: "Boutique PT studio" },
  { label: "Hardcore", budget: 400_000, blurb: "Bodybuilding gym" },
  { label: "Flagship", budget: 1_000_000, blurb: "Money no object" },
];

type Saved = { budget: number; lines: { slug: string; qty: number }[] };
const KEY = "ironatlas:build:v1";
const DEFAULT: Saved = { budget: 150_000, lines: [] };

function load(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (s && typeof s.budget === "number" && Array.isArray(s.lines)) return s;
  } catch {
    // ignore unreadable storage
  }
  return DEFAULT;
}

const fromParams = (p: URLSearchParams): Saved | null => {
  const m = p.get("m");
  const b = Number(p.get("budget"));
  if (!m && !b) return null;
  return {
    budget: b > 0 ? b : DEFAULT.budget,
    lines: (m ?? "")
      .split(",")
      .filter(Boolean)
      .map((s) => {
        const [slug, qty] = s.split("*");
        return { slug, qty: Math.max(1, Math.min(10, Number(qty) || 1)) };
      }),
  };
};

const toParams = (s: Saved) => {
  const q = new URLSearchParams({ budget: String(s.budget) });
  if (s.lines.length) q.set("m", s.lines.map((l) => (l.qty > 1 ? `${l.slug}*${l.qty}` : l.slug)).join(","));
  return q.toString();
};

const imgSrc = (src: string) => (src.startsWith("/") ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${src}` : src);

export function GymBuilder({ items }: { items: CatalogueItem[] }) {
  const params = useSearchParams();
  const bySlug = useMemo(() => new Map(items.map((i) => [i.slug, i])), [items]);
  const [saved, setSaved] = useState<Saved>(DEFAULT);
  const [ready, setReady] = useState(false);

  // Restore from the share link, else from this browser; `?add=` drops a machine in from its page
  useEffect(() => {
    const base = fromParams(new URLSearchParams(params.toString())) ?? load();
    const add = params.get("add");
    const lines = base.lines.filter((l) => bySlug.has(l.slug));
    if (add && bySlug.has(add) && !lines.some((l) => l.slug === add)) lines.push({ slug: add, qty: 1 });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from URL/storage after mount
    setSaved({ budget: base.budget, lines });
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      // storage unavailable; the share link still works
    }
    window.history.replaceState(null, "", `${window.location.pathname}?${toParams(saved)}`);
  }, [saved, ready]);

  const lines: BuildLine[] = saved.lines.flatMap((l) => {
    const item = bySlug.get(l.slug);
    return item ? [{ item, qty: l.qty }] : [];
  });
  const score = useMemo(() => scoreGym(lines, saved.budget), [lines, saved.budget]);
  const remaining = saved.budget - score.spent;

  const setQty = (slug: string, qty: number) =>
    setSaved((s) => ({
      ...s,
      lines: qty <= 0 ? s.lines.filter((l) => l.slug !== slug) : s.lines.map((l) => (l.slug === slug ? { ...l, qty } : l)),
    }));
  const add = (slug: string) =>
    setSaved((s) =>
      s.lines.some((l) => l.slug === slug)
        ? { ...s, lines: s.lines.map((l) => (l.slug === slug ? { ...l, qty: Math.min(10, l.qty + 1) } : l)) }
        : { ...s, lines: [...s.lines, { slug, qty: 1 }] },
    );

  const inBuild = new Set(saved.lines.map((l) => l.slug));
  const suggestions = suggestAdditions(items, score, remaining, inBuild);

  return (
    // Faded until the saved build is restored, so the server-rendered default doesn't flash as real
    <div className={`space-y-8 transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-40"}`}>
      <BudgetBar budget={saved.budget} spent={score.spent} onBudget={(budget) => setSaved((s) => ({ ...s, budget }))} />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rivets border border-rivet bg-steel p-5 pt-7">
            <div className="mb-4 flex items-baseline justify-between border-b border-rivet pb-2">
              <h2 className="label text-chalk">Your gym floor</h2>
              <span className="label text-weld">
                {score.machines} machine{score.machines === 1 ? "" : "s"} · {formatSgd(score.spent)}
              </span>
            </div>
            {lines.length === 0 ? (
              <div className="diamond-plate border border-dashed border-rivet p-10 text-center">
                <p className="stencil text-3xl text-ash">Empty floor</p>
                <p className="mt-2 text-sm text-weld">Add machines from the list below. Every machine has a Singapore price.</p>
              </div>
            ) : (
              <ul className="divide-y divide-rivet">
                <AnimatePresence initial={false}>
                  {lines.map(({ item, qty }) => (
                    <motion.li
                      key={item.slug}
                      layout
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24, height: 0 }}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <Thumb item={item} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/equipment/${item.slug}`} className="block truncate text-sm hover:underline">
                          {item.name}
                        </Link>
                        <p className="label truncate text-[0.58rem] text-weld">
                          {item.brand.name} · {MOVEMENT_LABELS[item.movement]}
                          {item.vintage ? " · vintage" : ""}
                        </p>
                      </div>
                      <div className="flex items-center border border-rivet">
                        <button onClick={() => setQty(item.slug, qty - 1)} className="px-2 py-1 text-ash hover:text-chalk" aria-label={`One fewer ${item.name}`}>
                          −
                        </button>
                        <span className="w-6 text-center font-mono text-sm">{qty}</span>
                        <button
                          onClick={() => setQty(item.slug, Math.min(10, qty + 1))}
                          disabled={item.price.sgd > remaining}
                          className="px-2 py-1 text-ash hover:text-chalk disabled:text-rivet"
                          aria-label={`One more ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="w-24 text-right font-mono text-sm">{formatSgd(item.price.sgd * qty)}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
            {lines.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  className="label border border-rivet px-3 py-2 text-ash hover:border-chalk hover:text-chalk"
                >
                  Copy share link
                </button>
                <button onClick={() => setSaved((s) => ({ ...s, lines: [] }))} className="label px-3 py-2 text-weld hover:text-chalk">
                  Clear floor
                </button>
              </div>
            )}
          </section>

          <Picker items={items} remaining={remaining} inBuild={inBuild} onAdd={add} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <ScoreCard score={score} />
          {suggestions.muscle && suggestions.items.length > 0 && (
            <section className="border border-rivet bg-steel p-5">
              <h3 className="label mb-3 text-chalk">
                Best value for {MUSCLES[suggestions.muscle].label.toLowerCase()}
              </h3>
              <ul className="space-y-2">
                {suggestions.items.map((i) => (
                  <li key={i.slug} className="flex items-center gap-3">
                    <Thumb item={i} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{i.name}</p>
                      <p className="label text-[0.58rem] text-weld">
                        {i.brand.name} · {formatSgd(i.price.sgd)}
                      </p>
                    </div>
                    <button onClick={() => add(i.slug)} className="label border border-chalk px-2 py-1 text-[0.6rem] hover:bg-chalk hover:text-ink">
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Thumb({ item }: { item: CatalogueItem }) {
  const img = item.images[0];
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-rivet bg-chalk">
      {img ? (
        <Image src={imgSrc(img.src)} alt="" fill sizes="48px" className="object-contain p-0.5 grayscale" />
      ) : (
        <div className="grid h-full place-items-center bg-plate font-mono text-[0.5rem] text-weld">NO PHOTO</div>
      )}
    </div>
  );
}

function BudgetBar({ budget, spent, onBudget }: { budget: number; spent: number; onBudget: (b: number) => void }) {
  const used = budget > 0 ? spent / budget : 0;
  const over = spent > budget;
  const [custom, setCustom] = useState("");
  return (
    <section className="border border-rivet bg-steel p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-weld">Fictional budget</p>
          <p className="stencil text-5xl">
            <CountUp value={budget} prefix="S$" />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onBudget(p.budget)}
              title={p.blurb}
              className={`label relative border px-3 py-2 ${budget === p.budget ? "border-chalk text-ink" : "border-rivet text-ash hover:border-chalk hover:text-chalk"}`}
            >
              {budget === p.budget && <motion.span layoutId="budget-preset" className="absolute inset-0 bg-chalk" />}
              <span className="relative">
                {p.label} · S${p.budget >= 1e6 ? `${p.budget / 1e6}M` : `${p.budget / 1e3}k`}
              </span>
            </button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = Math.round(Number(custom.replace(/[^\d.]/g, "")));
              if (v >= 1000) onBudget(Math.min(v, 50_000_000));
            }}
            className="flex border border-rivet"
          >
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Custom S$"
              inputMode="numeric"
              className="w-28 bg-transparent px-3 py-2 font-mono text-sm focus:outline-none"
            />
            <button className="label border-l border-rivet px-3 text-ash hover:text-chalk">Set</button>
          </form>
        </div>
      </div>
      <div className="mt-5">
        <div className="relative h-5 overflow-hidden border border-rivet bg-ink">
          <motion.div
            className={`h-full ${over ? "hazard" : "bg-chalk"}`}
            initial={false}
            animate={{ width: `${Math.min(100, used * 100)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
          {[25, 50, 75].map((t) => (
            <span key={t} className="absolute top-0 h-full w-px bg-rivet" style={{ left: `${t}%` }} />
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs">
          <span className="text-ash">Spent {formatSgd(spent)}</span>
          <span className={over ? "text-chalk" : "text-ash"}>
            {over ? `Over by ${formatSgd(spent - budget)}` : `${formatSgd(budget - spent)} left`}
          </span>
        </div>
      </div>
    </section>
  );
}

function ScoreCard({ score }: { score: ReturnType<typeof scoreGym> }) {
  return (
    <section className="rivets border-2 border-chalk bg-steel p-5 pt-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="label text-weld">Gym score</p>
          <p className="stencil text-7xl leading-none">
            <CountUp value={score.total} />
          </p>
          <p className="label mt-2 text-ash">{score.character}</p>
        </div>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score.grade}
            initial={{ scale: 2.4, rotate: -25, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 16 }}
            className="stencil grid h-20 w-20 place-items-center border-4 border-chalk text-6xl"
          >
            {score.grade}
          </motion.span>
        </AnimatePresence>
      </div>
      <ul className="mt-6 space-y-3">
        {score.categories.map((c) => (
          <li key={c.key}>
            <div className="flex justify-between text-xs">
              <span className="label text-ash">{c.label}</span>
              <span className="font-mono">
                {Math.round(c.value * c.weight)}/{c.weight}
              </span>
            </div>
            <div className="mt-1 h-1.5 bg-rivet">
              <motion.div className="h-full bg-chalk" initial={false} animate={{ width: `${c.value * 100}%` }} transition={{ duration: 0.6 }} />
            </div>
            <p className="mt-0.5 font-mono text-[0.62rem] text-weld">{c.detail}</p>
          </li>
        ))}
        {score.penalty > 0 && (
          <li className="flex justify-between text-xs">
            <span className="label text-ash">Redundancy penalty</span>
            <span className="font-mono">−{score.penalty}</span>
          </li>
        )}
      </ul>
      {score.tips.length > 0 && (
        <ul className="mt-6 space-y-2 border-t border-rivet pt-4">
          {score.tips.map((t) => (
            <li key={t} className="flex gap-2 text-sm text-ash">
              <span className="text-chalk">›</span>
              {t}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Picker({
  items,
  remaining,
  inBuild,
  onAdd,
}: {
  items: CatalogueItem[];
  remaining: number;
  inBuild: Set<string>;
  onAdd: (slug: string) => void;
}) {
  const [q, setQ] = useState("");
  const [movement, setMovement] = useState<Movement | "">("");
  const [era, setEra] = useState<"all" | "current" | "vintage">("all");
  const [affordable, setAffordable] = useState(false);
  const [shown, setShown] = useState(30);
  const index = useMemo(() => createIndex(items), [items]);

  const results = useMemo(() => {
    const pool = q.trim() ? index.search(q).map((r) => r.item.item) : [...items].sort((a, b) => Number(!!b.images.length) - Number(!!a.images.length));
    return pool.filter(
      (i) =>
        (!movement || i.movement === movement) &&
        (era === "all" || (era === "vintage") === i.vintage) &&
        (!affordable || i.price.sgd <= remaining),
    );
  }, [q, movement, era, affordable, remaining, items, index]);

  return (
    <section className="border border-rivet bg-steel p-5">
      <h2 className="label mb-4 border-b border-rivet pb-2 text-chalk">Add machines</h2>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShown(30);
          }}
          placeholder="Search brand, machine, muscle…"
          className="border border-rivet bg-ink px-3 py-2.5 font-mono text-sm focus:border-chalk focus:outline-none"
        />
        <select
          value={movement}
          onChange={(e) => setMovement(e.target.value as Movement | "")}
          className="border border-rivet bg-ink px-3 py-2.5 font-mono text-xs text-ash"
          aria-label="Movement"
        >
          <option value="">All movements</option>
          {MOVEMENTS.map((m) => (
            <option key={m} value={m}>
              {MOVEMENT_LABELS[m]}
            </option>
          ))}
        </select>
        <select
          value={era}
          onChange={(e) => setEra(e.target.value as typeof era)}
          className="border border-rivet bg-ink px-3 py-2.5 font-mono text-xs text-ash"
          aria-label="Era"
        >
          <option value="all">New & vintage</option>
          <option value="current">Current only</option>
          <option value="vintage">Vintage only</option>
        </select>
      </div>
      <label className="label mt-3 flex cursor-pointer items-center gap-2 text-ash">
        <input type="checkbox" checked={affordable} onChange={(e) => setAffordable(e.target.checked)} className="accent-chalk" />
        Only what I can still afford
      </label>
      <p className="label mt-3 text-weld">{results.length} machines</p>
      <ul className="mt-2 divide-y divide-rivet">
        {results.slice(0, shown).map((i) => {
          const tooDear = i.price.sgd > remaining;
          return (
            <li key={i.slug} className="flex items-center gap-3 py-2">
              <Thumb item={i} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{i.name}</p>
                <p className="label truncate text-[0.58rem] text-weld">
                  {i.brand.name}
                  {i.series ? ` · ${i.series}` : ""} · {MOVEMENT_LABELS[i.movement]}
                </p>
              </div>
              <span className="text-right font-mono text-xs">
                {formatSgd(i.price.sgd)}
                <span className="block text-[0.55rem] uppercase text-weld">{i.price.basis === "estimate" ? "est." : i.price.basis === "resale" ? "used" : "listed"}</span>
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onAdd(i.slug)}
                disabled={tooDear}
                className="label w-16 border border-chalk py-1.5 text-[0.6rem] hover:bg-chalk hover:text-ink disabled:cursor-not-allowed disabled:border-rivet disabled:text-weld disabled:hover:bg-transparent"
              >
                {tooDear ? "Over" : inBuild.has(i.slug) ? "+1" : "Add"}
              </motion.button>
            </li>
          );
        })}
      </ul>
      {results.length > shown && (
        <button onClick={() => setShown((s) => s + 30)} className="label mt-3 w-full border border-rivet py-3 text-ash hover:border-chalk hover:text-chalk">
          Show more · {results.length - shown} left
        </button>
      )}
    </section>
  );
}

function CountUp({ value, prefix = "" }: { value: number; prefix?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.7, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => controls.stop();
  }, [value, mv, reduce]);
  return (
    <span className="tabular-nums">
      {prefix}
      {(reduce ? value : display).toLocaleString("en-US")}
    </span>
  );
}
