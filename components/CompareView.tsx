"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MUSCLES } from "@/lib/muscles";
import {
  accessAverage,
  bestIndexes,
  feelAverage,
  MAX_COMPARE,
  parseCompareIds,
  rowDiffers,
  stretchBias,
  toCompareEntry,
  type Row,
} from "@/lib/compare";
import { useCompare } from "@/lib/compare-store";
import { createIndex } from "@/lib/search";
import { FEEL_LABELS, LOADING_LABELS, MOVEMENT_LABELS, type CatalogueItem, type FeelKey } from "@/lib/types";
import { useCommunity } from "@/lib/use-community";
import { EquipmentVisual } from "./EquipmentVisual";
import { FeelRadar } from "./FeelRadar";
import { ResistanceCurve, SERIES_STYLES } from "./ResistanceCurve";

export function CompareView({ items }: { items: CatalogueItem[] }) {
  const params = useSearchParams();
  const store = useCompare();
  const urlIds = parseCompareIds(params.get("ids"));
  const bySlug = useMemo(() => new Map(items.map((i) => [i.slug, i])), [items]);
  const ids = (urlIds.length ? urlIds : store.ids).filter((id) => bySlug.has(id));
  const selected = ids.map((id) => bySlug.get(id)!);
  const [diffOnly, setDiffOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data: community } = useCommunity(ids);

  // Keep the URL and the tray in sync with whatever is on screen
  const key = ids.join(",");
  useEffect(() => {
    const qs = key ? `?ids=${key}` : "";
    if (window.location.search !== qs) window.history.replaceState(null, "", `${window.location.pathname}${qs}`);
    if (store.ids.join(",") !== key) store.set(key ? key.split(",").map((s) => toCompareEntry(bySlug.get(s)!)) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setIds = (next: string[]) => {
    const qs = next.length ? `?ids=${next.join(",")}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${qs}`);
    store.set(next.map((s) => toCompareEntry(bySlug.get(s)!)));
  };

  const sections = useMemo(() => buildSections(selected, community), [selected, community]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <label className="label flex cursor-pointer items-center gap-3 border border-rivet px-4 py-2.5 text-ash">
          <span className={`relative h-4 w-8 border border-ash transition-colors ${diffOnly ? "bg-chalk" : ""}`}>
            <motion.span
              className={`absolute top-0.5 h-2.5 w-2.5 ${diffOnly ? "bg-ink" : "bg-ash"}`}
              animate={{ left: diffOnly ? 18 : 2 }}
            />
          </span>
          <input type="checkbox" className="sr-only" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} />
          Show only differences
        </label>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          disabled={!ids.length}
          className="label border border-rivet px-4 py-2.5 text-ash hover:border-chalk hover:text-chalk disabled:opacity-40"
        >
          {copied ? "✓ Link copied" : "Copy share link"}
        </button>
        {ids.length > 0 && (
          <button onClick={() => setIds([])} className="label px-2 py-2.5 text-weld hover:text-chalk">
            Clear all
          </button>
        )}
      </div>

      {/* Machine columns */}
      <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="grid min-w-[640px] gap-3" style={{ gridTemplateColumns: `180px repeat(${MAX_COMPARE}, 1fr)` }}>
          <div className="label self-end pb-2 text-weld">
            {selected.length}/{MAX_COMPARE} machines
          </div>
          {Array.from({ length: MAX_COMPARE }, (_, col) => {
            const item = selected[col];
            return (
              <div key={col} className="min-h-[260px]">
                <AnimatePresence mode="wait">
                  {item ? (
                    <motion.div
                      key={item.slug}
                      initial={{ opacity: 0, y: 30, rotateX: -25 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 220, damping: 22, delay: col * 0.06 }}
                      className="group relative border border-rivet bg-plate"
                    >
                      <EquipmentVisual item={item} className="aspect-[4/3]" sizes="25vw" />
                      <div className="absolute left-2 top-2 flex items-center gap-2 bg-ink/80 px-2 py-1">
                        <svg width="22" height="6" aria-hidden>
                          <line
                            x1="0"
                            x2="22"
                            y1="3"
                            y2="3"
                            stroke={SERIES_STYLES[col].stroke}
                            strokeWidth="2.5"
                            strokeDasharray={SERIES_STYLES[col].dash}
                          />
                        </svg>
                      </div>
                      <button
                        onClick={() => setIds(ids.filter((s) => s !== item.slug))}
                        aria-label={`Remove ${item.name}`}
                        className="label absolute right-2 top-2 bg-ink/80 px-2 py-1 text-ash hover:text-chalk"
                      >
                        ×
                      </button>
                      <Link href={`/equipment/${item.slug}`} className="block p-3">
                        <p className="label text-[0.6rem] text-ash">{item.brand.name}</p>
                        <p className="stencil text-xl leading-none group-hover:underline">{item.name}</p>
                      </Link>
                    </motion.div>
                  ) : (
                    <Picker
                      key={`empty-${col}`}
                      items={items}
                      exclude={ids}
                      hint={selected[0]?.movement}
                      onPick={(slug) => setIds([...ids, slug])}
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="mt-6 border border-dashed border-rivet p-12 text-center">
          <p className="stencil text-3xl text-ash">Load the bar</p>
          <p className="mt-2 text-sm text-weld">
            Add machines with the slots above, or from the{" "}
            <Link href="/catalogue" className="underline">
              catalogue
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="rivets border border-rivet bg-steel p-5 pt-7">
              <h2 className="label mb-4 border-b border-rivet pb-2">Resistance profiles · overlaid</h2>
              <ResistanceCurve
                key={key}
                series={selected.map((i) => ({ label: `${i.brand.name} ${i.name}`, curve: i.resistanceProfile.curve }))}
              />
              {selected.some((i) => i.resistanceProfile.variants) && (
                <p className="mt-3 text-xs text-weld">
                  Machines with adjustable cams show their default setting. Open a machine to see every variant.
                </p>
              )}
            </section>
            <section className="rivets border border-rivet bg-steel p-5 pt-7">
              <h2 className="label mb-4 border-b border-rivet pb-2">Feel · overlaid</h2>
              <FeelRadar key={key} items={selected.map((i) => ({ label: i.name, feel: i.feel }))} />
            </section>
          </div>

          <div className="scrollbar-none -mx-4 mt-10 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[640px]">
              {sections.map((sec) => {
                const rows = diffOnly ? sec.rows.filter(rowDiffers) : sec.rows;
                if (!rows.length) return null;
                return (
                  <section key={sec.title} className="mb-8">
                    <h3 className="stencil mb-2 border-b-2 border-chalk pb-1 text-2xl">{sec.title}</h3>
                    <AnimatePresence initial={false}>
                      {rows.map((row) => (
                        <CompareRow key={row.key} row={row} cols={selected.length} />
                      ))}
                    </AnimatePresence>
                  </section>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CompareRow({ row, cols }: { row: Row; cols: number }) {
  const best = bestIndexes(row);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="grid items-center gap-3 border-b border-rivet py-2.5"
      style={{ gridTemplateColumns: `180px repeat(${MAX_COMPARE}, 1fr)` }}
    >
      <span className="label text-ash">{row.label}</span>
      {Array.from({ length: MAX_COMPARE }, (_, i) => {
        if (i >= cols) return <span key={i} />;
        const v = row.values[i];
        const win = best.includes(i);
        const text = row.format ? row.format(v) : v === undefined ? "—" : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);
        return (
          <span key={i} className={`flex items-center gap-2 text-sm ${win ? "font-semibold text-chalk" : "text-ash"}`}>
            {typeof v === "number" && row.better && (
              <span className="hidden h-1.5 w-12 bg-rivet sm:block">
                <motion.span
                  className={`block h-full ${win ? "bg-chalk" : "bg-weld"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (v / (row.key.startsWith("community-fav") ? Math.max(1, ...row.values.map(Number)) : 10)) * 100)}%` }}
                  transition={{ duration: 0.6 }}
                />
              </span>
            )}
            <span>{text}</span>
            {win && <span className="label bg-chalk px-1 text-[0.55rem] text-ink">Best</span>}
          </span>
        );
      })}
    </motion.div>
  );
}

function buildSections(items: CatalogueItem[], community: ReturnType<typeof useCommunity>["data"]) {
  const v = <T,>(fn: (i: CatalogueItem) => T) => items.map(fn);
  const feelKeys = Object.keys(FEEL_LABELS) as FeelKey[];
  const peakAt = (c: number[]) => `${c.indexOf(Math.max(...c)) * 10}% ROM`;
  const muscles = (list: string[]) => list.map((m) => MUSCLES[m as keyof typeof MUSCLES].label).join(", ") || "—";

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: "Overview",
      rows: [
        { key: "brand", label: "Brand", values: v((i) => i.brand.name) },
        { key: "series", label: "Series", values: v((i) => i.series) },
        { key: "movement", label: "Movement", values: v((i) => MOVEMENT_LABELS[i.movement]) },
        { key: "loading", label: "Loading", values: v((i) => LOADING_LABELS[i.loading]) },
        { key: "iso", label: "Iso-lateral", values: v((i) => i.isoLateral) },
        { key: "era", label: "Era", values: v((i) => (i.vintage ? `Vintage${i.years ? ` · ${i.years}` : ""}` : "Current")) },
        { key: "price", label: "Price band", values: v((i) => i.specs.priceBand) },
        { key: "pick", label: "Editorial pick", values: v((i) => i.editorialFavorite), better: "high" },
      ],
    },
    {
      title: "Resistance profile",
      rows: [
        { key: "shape", label: "Shape", values: v((i) => i.resistanceProfile.shape) },
        { key: "peak", label: "Peak load at", values: v((i) => peakAt(i.resistanceProfile.curve)) },
        {
          key: "bias",
          label: "Stretch bias",
          values: v((i) => stretchBias(i.resistanceProfile.curve)),
          better: "high",
          format: (x) => (typeof x === "number" ? (x > 0 ? `+${x}` : String(x)) : "—"),
        },
        { key: "adjustable", label: "Adjustable cam", values: v((i) => Boolean(i.resistanceProfile.variants)), better: "high" },
      ],
    },
    {
      title: "Feel",
      rows: [
        ...feelKeys.map((k) => ({ key: `feel-${k}`, label: FEEL_LABELS[k], values: v((i) => i.feel[k]), better: "high" as const })),
        { key: "feel-avg", label: "Average", values: v(feelAverage), better: "high" },
      ],
    },
    {
      title: "Accessibility",
      rows: [
        { key: "acc-entry", label: "Entry / exit", values: v((i) => i.accessibility.entry), better: "high" },
        { key: "acc-adj", label: "Adjustment ease", values: v((i) => i.accessibility.adjustment), better: "high" },
        { key: "acc-beg", label: "Beginner friendly", values: v((i) => i.accessibility.beginner), better: "high" },
        {
          key: "acc-start",
          label: "Starting resistance",
          values: v((i) => i.accessibility.startingResistanceKg),
          better: "low",
          format: (x) => `${x} kg`,
        },
        { key: "acc-transfer", label: "Wheelchair transfer", values: v((i) => i.accessibility.transferFriendly), better: "high" },
        { key: "acc-avg", label: "Average", values: v(accessAverage), better: "high" },
      ],
    },
    {
      title: "Muscles",
      rows: [
        { key: "m-primary", label: "Primary", values: v((i) => muscles(i.primaryMuscles)) },
        { key: "m-secondary", label: "Secondary", values: v((i) => muscles(i.secondaryMuscles)) },
      ],
    },
    {
      title: "Community",
      rows: [
        { key: "community-fav", label: "Favorites", values: v((i) => community[i.slug]?.favorites), better: "high" },
        { key: "community-count", label: "Feel ratings", values: v((i) => community[i.slug]?.ratings.count) },
        {
          key: "community-avg",
          label: "Community feel avg",
          values: v((i) => {
            const a = community[i.slug]?.ratings.avg;
            if (!a) return undefined;
            const vals = Object.values(a);
            return Math.round((vals.reduce((x, y) => x + y, 0) / vals.length) * 10) / 10;
          }),
          better: "high",
        },
      ],
    },
    {
      title: "Specs",
      rows: [
        { key: "max", label: "Max load", values: v((i) => i.specs.maxLoad) },
        { key: "weight", label: "Machine weight", values: v((i) => i.specs.weightKg), format: (x) => (x ? `${x} kg` : "—") },
        { key: "footprint", label: "Footprint", values: v((i) => i.specs.footprint) },
      ],
    },
  ];
  return sections;
}

function Picker({
  items,
  exclude,
  hint,
  onPick,
}: {
  items: CatalogueItem[];
  exclude: string[];
  hint?: CatalogueItem["movement"];
  onPick: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const index = useMemo(() => createIndex(items), [items]);
  const pool = q.trim()
    ? index.search(q).map((r) => r.item.item)
    : [...items].sort((a, b) => Number(b.movement === hint) - Number(a.movement === hint));
  const results = pool.filter((i) => !exclude.includes(i.slug)).slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative h-full min-h-[260px] border border-dashed border-rivet"
    >
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="group flex h-full w-full flex-col items-center justify-center gap-2 text-ash hover:text-chalk"
        >
          <span className="stencil text-5xl transition-transform group-hover:rotate-90">+</span>
          <span className="label">Add machine</span>
        </button>
      ) : (
        <div className="flex h-full flex-col p-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            placeholder="Search…"
            className="mb-2 w-full border border-rivet bg-ink px-3 py-2 font-mono text-xs focus:border-chalk focus:outline-none"
          />
          <ul className="flex-1 overflow-y-auto">
            {results.map((r) => (
              <li key={r.slug}>
                <button
                  onClick={() => onPick(r.slug)}
                  className="w-full border-b border-rivet px-2 py-1.5 text-left hover:bg-rivet"
                >
                  <span className="label block text-[0.55rem] text-weld">{r.brand.name}</span>
                  <span className="text-xs">{r.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setOpen(false)} className="label mt-1 text-[0.6rem] text-weld hover:text-chalk">
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
}
