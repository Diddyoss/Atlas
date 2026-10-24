"use client";

import { useUserVote } from "@/lib/store";
import { RATING_HINTS, RATING_KEYS, RATING_LABELS, type Machine } from "@/lib/types";
import { approval, average, mergeVote, seedTally } from "@/lib/votes";

export function VoteWidget({ m }: { m: Machine }) {
  const { vote, set } = useUserVote(m.id);
  const tally = mergeVote(seedTally(m), vote);
  const current = vote ?? { scores: {} };
  const pct = Math.round(approval(tally) * 100);

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Community</p>
          <p className="mt-1 font-mono text-4xl text-paper">
            {pct}
            <span className="text-lg text-mute">% recommend</span>
          </p>
          <p className="label mt-1">{tally.up + tally.down} votes · seeded baseline + yours</p>
        </div>
        <div className="flex gap-2">
          {(["up", "down"] as const).map((t) => {
            const on = current.thumb === t;
            return (
              <button
                key={t}
                onClick={() => set({ ...current, thumb: on ? undefined : t })}
                aria-pressed={on}
                className={`border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all ${
                  on ? "border-paper bg-paper text-ink" : "border-line-2 hover:border-paper"
                }`}
              >
                <span key={String(on)} className={on ? "pop inline-block" : "inline-block"}>
                  {t === "up" ? "▲ Recommend" : "▼ Pass"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-6 h-1.5 w-full bg-ink-3">
        <div className="h-full bg-paper transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {RATING_KEYS.map((k) => {
          const avg = average(tally, k);
          const mine = current.scores[k];
          return (
            <li key={k}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-paper" title={RATING_HINTS[k]}>{RATING_LABELS[k]}</span>
                <span className="font-mono text-xs text-mute">
                  {avg.toFixed(2)} / 5 · {tally.scores[k].count}
                </span>
              </div>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label={`Rate ${RATING_LABELS[k]}`}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const filled = mine ? v <= mine : v <= Math.round(avg);
                  return (
                    <button
                      key={v}
                      role="radio"
                      aria-checked={mine === v}
                      aria-label={`${v} of 5`}
                      onClick={() => set({ ...current, scores: { ...current.scores, [k]: mine === v ? undefined : v } })}
                      className={`h-3 flex-1 transition-colors ${
                        filled ? (mine ? "bg-paper" : "bg-line-2") : "bg-ink-3 hover:bg-line"
                      }`}
                    />
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="label mt-5">Tap a bar to add your score. Votes are stored in this browser.</p>
    </div>
  );
}
