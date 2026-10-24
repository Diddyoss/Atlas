"use client";

import { useCallback, useEffect, useState } from "react";
import type { Community, FeelRating, Vote } from "./votes";

/** True when built as a static export (GitHub Pages): there is no API, so votes live in this browser. */
export const IS_STATIC = process.env.NEXT_PUBLIC_STATIC === "1";

const LOCAL_KEY = "ironatlas:votes";
type LocalVotes = { favorites: string[]; ratings: Record<string, FeelRating> };

function readLocal(): LocalVotes {
  try {
    const v = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}");
    return { favorites: Array.isArray(v.favorites) ? v.favorites : [], ratings: v.ratings ?? {} };
  } catch {
    return { favorites: [], ratings: {} };
  }
}

function writeLocal(v: LocalVotes) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(v));
  } catch {
    // storage blocked; the vote just won't persist
  }
}

function localCommunity(slug: string, v = readLocal()): Community {
  const fav = v.favorites.includes(slug);
  const rating = v.ratings[slug] ?? null;
  return {
    favorites: fav ? 1 : 0,
    ratings: { count: rating ? 1 : 0, avg: rating },
    mine: { favorite: fav, rating },
  };
}

function applyLocal(vote: Vote): Community {
  const v = readLocal();
  if (vote.action === "favorite") {
    v.favorites = v.favorites.includes(vote.slug) ? v.favorites.filter((s) => s !== vote.slug) : [...v.favorites, vote.slug];
  } else {
    v.ratings[vote.slug] = vote.feel;
  }
  writeLocal(v);
  return localCommunity(vote.slug, v);
}

export function useCommunity(slugs: string[]) {
  const key = slugs.join(",");
  const [data, setData] = useState<Record<string, Community>>({});
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState(IS_STATIC);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const fallBackToLocal = () => {
      if (cancelled) return;
      setLocal(true);
      setData(Object.fromEntries(key.split(",").map((s) => [s, localCommunity(s)])));
    };
    // Static builds have no API; resolving async keeps state updates out of the effect body
    const load: Promise<{ items: Record<string, Community> }> = IS_STATIC
      ? Promise.reject(new Error("static"))
      : fetch(`/api/community?slugs=${encodeURIComponent(key)}`).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error(r.statusText)),
        );
    load.then((j) => !cancelled && setData(j.items)).catch(fallBackToLocal);
    return () => {
      cancelled = true;
    };
  }, [key]);

  const vote = useCallback(
    async (v: Vote) => {
      if (local) {
        setData((d) => ({ ...d, [v.slug]: applyLocal(v) }));
        return;
      }
      const r = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      if (!r.ok) {
        setError(r.status === 429 ? "Too many votes — take a rest set." : "Vote failed");
        return;
      }
      setError(null);
      const next = (await r.json()) as Community;
      setData((d) => ({ ...d, [v.slug]: next }));
    },
    [local],
  );

  return { data, error, vote, local };
}
