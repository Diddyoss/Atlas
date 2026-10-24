"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { BRANDS } from "@/data/brands";
import { MACHINES } from "@/data/machines";
import { applyFilters, filtersToParams, paramsToFilters, type Era, type Filters, type SortKey } from "@/lib/search";
import { LOAD_LABELS, MOVEMENT_LABELS, MUSCLE_LABELS, type LoadType, type Movement, type Muscle } from "@/lib/types";
import { BodyMap } from "./BodyMap";
import { MachineCard } from "./MachineCard";

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`border px-2 py-1 text-xs transition-colors ${on ? "border-paper bg-paper text-ink" : "border-line text-bone hover:border-line-2"}`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-5">
      <p className="label mb-3">{title}</p>
      {children}
    </div>
  );
}

export function Catalogue({ fixedEra }: { fixedEra?: Era }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const f = useMemo(() => {
    const parsed = paramsToFilters(new URLSearchParams(params.toString()));
    return fixedEra ? { ...parsed, era: fixedEra } : parsed;
  }, [params, fixedEra]);
  const [q, setQ] = useState(f.q);
  // Keep the box in step when the URL's query changes underneath us (nav links, back button).
  const [urlQ, setUrlQ] = useState(f.q);
  if (f.q !== urlQ) {
    setUrlQ(f.q);
    setQ(f.q);
  }
  const [showFilters, setShowFilters] = useState(false);

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    const p = filtersToParams(fixedEra ? { ...next, era: "active" } : next);
    router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  const deferredQ = useDeferredValue(q);
  const results = useMemo(() => applyFilters(MACHINES, { ...f, q: deferredQ }), [f, deferredQ]);
  const brands = BRANDS.filter((b) => (f.era === "all" ? true : b.status === f.era));
  const movements = [...new Set(MACHINES.map((m) => m.movement))] as Movement[];
  const activeCount = f.brands.length + f.muscles.length + f.movements.length + f.loads.length + (f.unilateral ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center border border-line-2 bg-ink-2 focus-within:border-paper">
          <span className="pl-4 text-mute" aria-hidden>⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => q !== f.q && update({ q })}
            onKeyDown={(e) => e.key === "Enter" && update({ q })}
            placeholder="Search brand, machine or muscle — “hammer incline”, “glutes”, “pendulum”"
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-paper outline-none placeholder:text-mute"
            aria-label="Search machines"
          />
          {q && (
            <button onClick={() => { setQ(""); update({ q: "" }); }} className="px-4 text-mute hover:text-paper" aria-label="Clear search">
              ×
            </button>
          )}
        </div>
        <select
          value={f.sort}
          onChange={(e) => update({ sort: e.target.value as SortKey })}
          className="border border-line-2 bg-ink-2 px-3 py-3 font-mono text-xs uppercase text-paper"
          aria-label="Sort"
        >
          <option value="relevance">Relevance</option>
          <option value="feel">Best feel</option>
          <option value="smoothness">Smoothest</option>
          <option value="accessibility">Most accessible</option>
          <option value="brand">Brand A–Z</option>
          <option value="name">Name A–Z</option>
        </select>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="border border-line-2 px-4 py-3 font-mono text-xs uppercase lg:hidden"
        >
          Filters {activeCount ? `(${activeCount})` : ""}
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          {!fixedEra && (
            <div className="grid grid-cols-3 border border-line">
              {(["active", "legacy", "all"] as Era[]).map((e) => (
                <button
                  key={e}
                  onClick={() => update({ era: e, brands: [] })}
                  className={`py-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                    f.era === e ? "bg-paper text-ink" : "text-mute hover:text-paper"
                  }`}
                >
                  {e === "legacy" ? "Vintage" : e}
                </button>
              ))}
            </div>
          )}
          <Section title="Target muscle">
            <BodyMap compact selected={f.muscles} onToggle={(m) => update({ muscles: toggle<Muscle>(f.muscles, m) })} />
            {f.muscles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {f.muscles.map((m) => (
                  <Chip key={m} on onClick={() => update({ muscles: toggle(f.muscles, m) })}>
                    {MUSCLE_LABELS[m]} ×
                  </Chip>
                ))}
              </div>
            )}
          </Section>
          <Section title="Brand">
            <div className="flex flex-wrap gap-1.5">
              {brands.map((b) => (
                <Chip key={b.slug} on={f.brands.includes(b.slug)} onClick={() => update({ brands: toggle(f.brands, b.slug) })}>
                  {b.name}
                </Chip>
              ))}
            </div>
          </Section>
          <Section title="Movement">
            <div className="flex flex-wrap gap-1.5">
              {movements.map((m) => (
                <Chip key={m} on={f.movements.includes(m)} onClick={() => update({ movements: toggle(f.movements, m) })}>
                  {MOVEMENT_LABELS[m]}
                </Chip>
              ))}
            </div>
          </Section>
          <Section title="Loading">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(LOAD_LABELS) as LoadType[]).map((l) => (
                <Chip key={l} on={f.loads.includes(l)} onClick={() => update({ loads: toggle(f.loads, l) })}>
                  {LOAD_LABELS[l]}
                </Chip>
              ))}
              <Chip on={f.unilateral} onClick={() => update({ unilateral: !f.unilateral })}>
                Independent arms
              </Chip>
            </div>
          </Section>
          {activeCount > 0 && (
            <button
              onClick={() => update({ brands: [], muscles: [], movements: [], loads: [], unilateral: false })}
              className="mt-4 font-mono text-xs uppercase tracking-wider text-mute hover:text-paper"
            >
              Reset filters
            </button>
          )}
        </aside>

        <section aria-live="polite">
          <p className="label mb-4">
            <span className="text-paper">{results.length}</span> machine{results.length === 1 ? "" : "s"}
            {f.muscles.length > 0 && ` · training ${f.muscles.map((m) => MUSCLE_LABELS[m]).join(" / ")}`}
          </p>
          {results.length === 0 ? (
            <div className="panel grid place-items-center p-16 text-center">
              <p className="display text-3xl text-paper">No match</p>
              <p className="mt-2 text-mute">Loosen a filter or try a broader term like “legs” or “press”.</p>
            </div>
          ) : (
            <div key={`${f.brands}${f.muscles}${f.movements}${f.loads}${f.era}${f.sort}`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((m, i) => (
                <MachineCard key={m.id} m={m} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
