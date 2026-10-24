"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { BRAND_MAP } from "@/data/brands";
import { MACHINE_MAP, MACHINES } from "@/data/machines";
import { buildRows, MAX_COMPARE, parseIds, winnerIndex } from "@/lib/compare";
import { scoreQuery } from "@/lib/search";
import { useAllVotes, useCompare } from "@/lib/store";
import { RATING_KEYS, RATING_LABELS, type Machine } from "@/lib/types";
import { approval, average, mergeVote, seedTally } from "@/lib/votes";
import { SERIES } from "@/lib/series";
import { CurveChart } from "./CurveChart";
import { MachineVisual } from "./MachineVisual";
import { RadarChart } from "./RadarChart";

function Picker({ exclude, onPick }: { exclude: string[]; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const hits = useMemo(
    () =>
      MACHINES.filter((m) => !exclude.includes(m.id))
        .map((m) => ({ m, s: scoreQuery(m, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 8)
        .map((x) => x.m),
    [q, exclude],
  );
  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="+ Add a machine…"
        className="w-full border border-dashed border-line-2 bg-transparent px-4 py-3 text-sm text-paper outline-none placeholder:text-mute focus:border-paper"
        aria-label="Add a machine to compare"
      />
      {open && hits.length > 0 && (
        <ul className="rise absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-auto border border-line-2 bg-ink-2 shadow-2xl">
          {hits.map((m) => (
            <li key={m.id}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(m.id);
                  setQ("");
                  setOpen(false);
                }}
                className="flex w-full items-baseline gap-2 px-4 py-2 text-left text-sm hover:bg-ink-3"
              >
                <span className="label shrink-0">{BRAND_MAP[m.brand].name}</span>
                <span className="text-paper">{m.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CompareView() {
  const router = useRouter();
  const params = useSearchParams();
  const tray = useCompare();
  const urlIds = parseIds(params.get("ids")).filter((id) => MACHINE_MAP[id]);
  const ids = urlIds.length ? urlIds : tray.ids.filter((id) => MACHINE_MAP[id]);
  const machines = ids.map((id) => MACHINE_MAP[id]);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const votes = useAllVotes();

  // A shared link becomes the current comparison.
  const urlKey = urlIds.join(",");
  useEffect(() => {
    if (urlKey) tray.replace(urlKey.split(","));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when the URL changes
  }, [urlKey]);

  const setIds = (next: string[]) => {
    tray.replace(next);
    router.replace(next.length ? `/compare?ids=${next.join(",")}` : "/compare", { scroll: false });
  };

  const rows = buildRows(machines);
  const tallies = machines.map((m) => mergeVote(seedTally(m), votes[m.id]));
  const shown = onlyDiff ? rows.filter((r) => r.differs) : rows;
  const wins = machines.map((_, i) => rows.filter((r) => winnerIndex(r) === i).length);
  const topWins = Math.max(0, ...wins);
  const cols = { gridTemplateColumns: `minmax(140px,1fr) repeat(${machines.length}, minmax(160px,1fr))` };

  if (machines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="panel p-10 text-center">
          <p className="display text-3xl text-paper">Nothing to compare yet</p>
          <p className="mt-3 text-mute">Add machines from the catalogue, or start typing below.</p>
          <div className="mx-auto mt-6 max-w-md text-left">
            <Picker exclude={[]} onPick={(id) => setIds([id])} />
          </div>
          <Link href="/catalogue" className="mt-6 inline-block font-mono text-xs uppercase tracking-wider text-mute hover:text-paper">
            Browse catalogue →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Machine headers */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(machines.length + (machines.length < MAX_COMPARE ? 1 : 0), 4)}, minmax(0,1fr))` }}>
        {machines.map((m, i) => (
          <MachineHead key={m.id} m={m} i={i} wins={wins[i]} leader={wins[i] === topWins && topWins > 0} onRemove={() => setIds(ids.filter((x) => x !== m.id))} />
        ))}
        {machines.length < MAX_COMPARE && (
          <div className="flex flex-col justify-center border border-dashed border-line p-4">
            <Picker exclude={ids} onPick={(id) => setIds([...ids, id])} />
            <p className="label mt-3">{MAX_COMPARE - machines.length} slot{MAX_COMPARE - machines.length === 1 ? "" : "s"} left</p>
          </div>
        )}
      </div>

      {machines.length < 2 && <p className="label mt-6 text-center text-paper">Add at least one more machine to compare.</p>}

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="panel p-6">
          <h2 className="display text-2xl text-paper">Resistance profile</h2>
          <p className="mt-1 text-sm text-mute">Hover to read each machine&apos;s relative load at that point in the rep.</p>
          <div className="mt-6">
            <CurveChart key={ids.join()} machines={machines} />
          </div>
        </section>
        <section className="panel p-6">
          <h2 className="display text-2xl text-paper">Scores</h2>
          <p className="label mt-1">Editorial estimate · 1–10</p>
          <RadarChart key={ids.join()} machines={machines} />
        </section>
      </div>

      {/* Community */}
      <section className="panel mt-6 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="display text-2xl text-paper">Community votes</h2>
          <p className="label">1–5 scale · seeded baseline + your votes</p>
        </div>
        <div className="mt-6 overflow-x-auto">
          <div className="grid min-w-[560px] gap-y-3 text-sm" style={cols}>
            <span className="label self-end">Recommend</span>
            {tallies.map((t, i) => (
              <div key={i}>
                <span className="font-mono text-2xl text-paper">{Math.round(approval(t) * 100)}%</span>
                <span className="label ml-2">{t.up + t.down} votes</span>
              </div>
            ))}
            {RATING_KEYS.map((k) => {
              const avgs = tallies.map((t) => average(t, k));
              const best = Math.max(...avgs);
              return (
                <Fragment key={k}>
                  <span className="text-mute">{RATING_LABELS[k]}</span>
                  {avgs.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 pr-4">
                      <div className="h-1.5 flex-1 bg-ink-3">
                        <div className="h-full transition-all duration-700" style={{ width: `${(a / 5) * 100}%`, background: SERIES[i].stroke }} />
                      </div>
                      <span className={`w-10 text-right font-mono text-xs ${a === best ? "text-paper" : "text-mute"}`}>{a.toFixed(2)}</span>
                    </div>
                  ))}
                </Fragment>
              );
            })}
          </div>
        </div>
        <p className="label mt-4">Vote on any machine&apos;s page and your scores show up here.</p>
      </section>

      {/* Spec table */}
      <section className="mt-6 border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink-2 px-4 py-3">
          <h2 className="display text-2xl text-paper">Head to head</h2>
          <label className="flex cursor-pointer items-center gap-3 font-mono text-xs uppercase tracking-wider">
            <span className={onlyDiff ? "text-paper" : "text-mute"}>Only differences</span>
            <button
              role="switch"
              aria-checked={onlyDiff}
              onClick={() => setOnlyDiff((v) => !v)}
              className={`relative h-6 w-11 border transition-colors ${onlyDiff ? "border-paper bg-paper" : "border-line-2 bg-ink"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 transition-all duration-300 ${onlyDiff ? "left-[22px] bg-ink" : "left-0.5 bg-mute"}`} />
            </button>
          </label>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {shown.map((r, ri) => {
              const w = winnerIndex(r);
              const newGroup = ri === 0 || shown[ri - 1].group !== r.group;
              return (
                <Fragment key={r.label}>
                  {newGroup && <div className="label border-b border-line bg-ink px-4 pb-2 pt-5 text-paper">{r.group}</div>}
                  <div className="rise grid border-b border-line text-sm last:border-0" style={{ ...cols, animationDelay: `${Math.min(ri, 20) * 15}ms` }}>
                    <span className="px-4 py-3 text-mute">{r.label}</span>
                    {r.values.map((v, i) => (
                      <span
                        key={i}
                        className={`px-4 py-3 transition-colors ${i === w ? "bg-paper font-bold text-ink" : r.differs ? "text-paper" : "text-mute"}`}
                      >
                        {v}
                        {i === w && <span className="ml-2 font-mono text-[10px]">★</span>}
                      </span>
                    ))}
                  </div>
                </Fragment>
              );
            })}
            {shown.length === 0 && <p className="p-6 text-center text-mute">These machines match on every spec.</p>}
          </div>
        </div>
      </section>
      <p className="label mt-4">★ marks the best value in rows where one exists. Specs are approximate.</p>
    </div>
  );
}

function MachineHead({ m, i, wins, leader, onRemove }: { m: Machine; i: number; wins: number; leader: boolean; onRemove: () => void }) {
  return (
    <div className="card rise relative border border-line bg-ink-2" style={{ animationDelay: `${i * 70}ms` }}>
      <div className="h-1" style={{ background: SERIES[i].stroke }} />
      <button onClick={onRemove} className="absolute right-2 top-3 z-10 px-2 text-mute hover:text-paper" aria-label={`Remove ${m.name}`}>
        ×
      </button>
      <div className="grid-bg aspect-[4/3] p-4">
        <MachineVisual m={m} />
      </div>
      <div className="border-t border-line p-4">
        <p className="label">{BRAND_MAP[m.brand].name}</p>
        <Link href={`/machines/${m.id}`} className="mt-1 block font-bold leading-tight text-paper hover:underline">
          {m.name}
        </Link>
        <p className="label mt-3">
          {wins} category win{wins === 1 ? "" : "s"}
          {leader && <span className="ml-2 bg-paper px-1.5 py-0.5 text-ink">Leader</span>}
        </p>
      </div>
    </div>
  );
}
