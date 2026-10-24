"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FEEL_LABELS, type CatalogueItem, type FeelKey } from "@/lib/types";
import { useCommunity } from "@/lib/use-community";
import type { FeelRating } from "@/lib/votes";

const KEYS = Object.keys(FEEL_LABELS) as FeelKey[];

export function VoteWidget({ item }: { item: CatalogueItem }) {
  const { data, error, vote, local } = useCommunity([item.slug]);
  const c = data[item.slug];
  const [draft, setDraft] = useState<FeelRating | null>(null);
  const [saved, setSaved] = useState(false);
  const rating = draft ?? c?.mine.rating ?? item.feel;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => vote({ action: "favorite", slug: item.slug })}
          aria-pressed={c?.mine.favorite ?? false}
          className={`label flex items-center gap-2 border-2 px-4 py-3 transition-colors ${
            c?.mine.favorite ? "border-chalk bg-chalk text-ink" : "border-rivet text-ash hover:border-chalk hover:text-chalk"
          }`}
        >
          <motion.span key={String(c?.mine.favorite)} initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }}>
            {c?.mine.favorite ? "★" : "☆"}
          </motion.span>
          {c?.mine.favorite ? "Favorited" : "Favorite"}
        </motion.button>
        <div>
          <AnimatePresence mode="popLayout">
            <motion.p
              key={c?.favorites ?? "x"}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              className="stencil text-4xl"
            >
              {c ? c.favorites : "–"}
            </motion.p>
          </AnimatePresence>
          <p className="label text-weld">community favorites</p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="label text-chalk">Rate the feel</h3>
          <span className="label text-weld">{c ? `${c.ratings.count} rating${c.ratings.count === 1 ? "" : "s"}` : ""}</span>
        </div>
        <div className="space-y-3">
          {KEYS.map((k) => (
            <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-3">
              <label htmlFor={`r-${k}`} className="label text-ash">
                {FEEL_LABELS[k]}
                {c?.ratings.avg && <span className="ml-2 text-weld">avg {c.ratings.avg[k]}</span>}
              </label>
              <span className="font-mono text-sm">{rating[k]}</span>
              <input
                id={`r-${k}`}
                type="range"
                min={1}
                max={10}
                value={rating[k]}
                onChange={(e) => {
                  setSaved(false);
                  setDraft({ ...rating, [k]: Number(e.target.value) });
                }}
                className="col-span-2 h-1 w-full cursor-pointer appearance-none bg-rivet accent-chalk"
              />
            </div>
          ))}
        </div>
        <button
          onClick={async () => {
            await vote({ action: "rate", slug: item.slug, feel: rating });
            setDraft(null);
            setSaved(true);
          }}
          className="label mt-4 w-full border border-chalk px-4 py-3 text-chalk transition-colors hover:bg-chalk hover:text-ink"
        >
          {saved ? "✓ Rating saved" : c?.mine.rating ? "Update my rating" : "Submit rating"}
        </button>
        {error && <p className="label mt-2 text-ash">{error}</p>}
        {local && (
          <p className="label mt-2 text-[0.6rem] text-weld">Preview mode: votes are saved in this browser only.</p>
        )}
      </div>
    </div>
  );
}
