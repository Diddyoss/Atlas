"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import type { MuscleId } from "@/lib/muscles";
import { MUSCLES } from "@/lib/muscles";
import { createIndex, filterItems, filtersFromParams, filtersToParams, type Filters } from "@/lib/search";
import { LOADING_LABELS, LOADING_TYPES, MOVEMENT_LABELS, MOVEMENTS, type Brand, type CatalogueItem } from "@/lib/types";
import { BodyMap } from "./BodyMap";
import { EquipmentCard } from "./EquipmentCard";

type Props = {
  items: CatalogueItem[];
  brands: Pick<Brand, "slug" | "name" | "status">[];
  base?: Partial<Filters>;
};

export function CatalogueBrowser({ items, brands, base = {} }: Props) {
  const params = useSearchParams();
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString()), base), [params, base]);
  const [query, setQuery] = useState(filters.q);
  const deferredQuery = useDeferredValue(query);
  const [railOpen, setRailOpen] = useState(false);
  const index = useMemo(() => createIndex(items), [items]);

  const results = useMemo(
    () => filterItems(items, { ...filters, q: deferredQuery }, index),
    [items, filters, deferredQuery, index],
  );

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, q: query, ...patch };
    const qs = filtersToParams(next, base).toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  const toggle = <K extends "brands" | "muscles" | "movements" | "loading">(key: K, value: Filters[K][number]) => {
    const list = filters[key] as string[];
    update({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] } as Partial<Filters>);
  };

  const activeCount =
    filters.brands.length + filters.muscles.length + filters.movements.length + filters.loading.length + Number(filters.iso);

  const vintageLocked = base.vintage === "only";
  const usedMovements = MOVEMENTS.filter((m) => items.some((i) => i.movement === m));
  const usedLoading = LOADING_TYPES.filter((l) => items.some((i) => i.loading === l));
  const brandGroups = vintageLocked
    ? [{ title: "Brand", list: brands.filter((b) => items.some((i) => i.brandSlug === b.slug)) }]
    : [
        { title: "Active brands", list: brands.filter((b) => b.status === "active") },
        { title: "Vintage brands", list: brands.filter((b) => b.status === "defunct") },
      ];

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className={`${railOpen ? "block" : "hidden"} lg:block`}>
        <div className="space-y-6 border border-rivet bg-steel p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <Section title="Target muscle">
            <div className="mx-auto max-w-[280px]">
              <BodyMap selected={filters.muscles} onToggle={(m: MuscleId) => toggle("muscles", m)} />
            </div>
            <label className="label mt-3 flex cursor-pointer items-center gap-2 text-ash">
              <input
                type="checkbox"
                checked={filters.primaryOnly}
                onChange={(e) => update({ primaryOnly: e.target.checked })}
                className="accent-chalk"
              />
              Primary movers only
            </label>
          </Section>

          {!vintageLocked && (
            <Section title="Era">
              <div className="grid grid-cols-3 border border-rivet">
                {(["all", "exclude", "only"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => update({ vintage: v })}
                    className={`label relative py-2 ${filters.vintage === v ? "text-ink" : "text-ash hover:text-chalk"}`}
                  >
                    {filters.vintage === v && <motion.span layoutId="era" className="absolute inset-0 bg-chalk" />}
                    <span className="relative">{v === "all" ? "All" : v === "exclude" ? "Current" : "Vintage"}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {brandGroups.map((g) => (
            <Section key={g.title} title={g.title}>
              <Chips
                options={g.list.map((b) => ({ value: b.slug, label: b.name }))}
                selected={filters.brands}
                onToggle={(v) => toggle("brands", v)}
              />
            </Section>
          ))}

          <Section title="Movement">
            <Chips
              options={usedMovements.map((m) => ({ value: m, label: MOVEMENT_LABELS[m] }))}
              selected={filters.movements}
              onToggle={(v) => toggle("movements", v as (typeof MOVEMENTS)[number])}
            />
          </Section>

          <Section title="Loading">
            <Chips
              options={usedLoading.map((l) => ({ value: l, label: LOADING_LABELS[l] }))}
              selected={filters.loading}
              onToggle={(v) => toggle("loading", v as (typeof LOADING_TYPES)[number])}
            />
            <label className="label mt-3 flex cursor-pointer items-center gap-2 text-ash">
              <input
                type="checkbox"
                checked={filters.iso}
                onChange={(e) => update({ iso: e.target.checked })}
                className="accent-chalk"
              />
              Iso-lateral only
            </label>
          </Section>
        </div>
      </aside>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="label pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ash">Search</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                const qs = filtersToParams({ ...filters, q: e.target.value }, base).toString();
                window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
              }}
              placeholder="pendulum, hammer row, lats…"
              className="w-full border border-rivet bg-steel py-3.5 pl-24 pr-4 font-mono text-sm text-chalk placeholder:text-weld focus:border-chalk focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRailOpen((o) => !o)}
              className="label border border-rivet px-4 py-3.5 text-ash hover:text-chalk lg:hidden"
            >
              Filters{activeCount ? ` (${activeCount})` : ""}
            </button>
            {(activeCount > 0 || query) && (
              <button
                onClick={() => {
                  setQuery("");
                  window.history.replaceState(null, "", window.location.pathname);
                }}
                className="label border border-rivet px-4 py-3.5 text-ash hover:border-chalk hover:text-chalk"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <motion.span key={results.length} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="stencil text-3xl">
            {results.length}
          </motion.span>
          <span className="label text-ash">machines</span>
          {filters.muscles.map((m) => (
            <button key={m} onClick={() => toggle("muscles", m)} className="label bg-chalk px-2 py-1 text-ink">
              {MUSCLES[m].label} ×
            </button>
          ))}
        </div>

        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {results.map((item, i) => (
              <EquipmentCard key={item.slug} item={item} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
        {results.length === 0 && (
          <div className="border border-dashed border-rivet p-12 text-center">
            <p className="stencil text-3xl text-ash">Nothing on the floor</p>
            <p className="mt-2 text-sm text-weld">Try fewer filters or a broader search.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="label mb-3 border-b border-rivet pb-2 text-chalk">{title}</h3>
      {children}
    </div>
  );
}

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <motion.button
            key={o.value}
            whileTap={{ scale: 0.94 }}
            onClick={() => onToggle(o.value)}
            className={`label border px-2 py-1 text-[0.64rem] transition-colors ${
              on ? "border-chalk bg-chalk text-ink" : "border-rivet text-ash hover:border-ash hover:text-chalk"
            }`}
          >
            {o.label}
          </motion.button>
        );
      })}
    </div>
  );
}
