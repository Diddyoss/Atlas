import { hash01 } from "./derive";
import { RATING_KEYS, type Machine, type Ratings, type VoteTally } from "./types";

/**
 * Baseline tallies so a fresh install isn't empty. They are generated from
 * the editorial scores, are clearly labelled as seeded in the UI, and are
 * replaced once a real voting backend is wired in.
 */
export function seedTally(m: Machine): VoteTally {
  const voters = 20 + Math.floor(hash01(m.id, 31) * 180);
  const approval = Math.min(0.97, Math.max(0.45, (m.ratings.feel - 3) / 7 + (hash01(m.id, 32) - 0.5) * 0.15));
  const up = Math.round(voters * approval);
  const scores = {} as VoteTally["scores"];
  RATING_KEYS.forEach((k, i) => {
    const count = Math.max(5, Math.round(voters * (0.35 + hash01(m.id, 40 + i) * 0.4)));
    // Map a 1–10 editorial score onto the 1–5 community scale, with drift.
    const avg = Math.min(5, Math.max(1, m.ratings[k] / 2 + (hash01(m.id, 50 + i) - 0.5) * 0.8));
    scores[k] = { sum: Math.round(avg * count), count };
  });
  return { up, down: voters - up, scores };
}

export interface UserVote {
  thumb?: "up" | "down";
  scores: Partial<Record<keyof Ratings, number>>;
}

export function mergeVote(base: VoteTally, vote: UserVote | undefined): VoteTally {
  if (!vote) return base;
  const scores = { ...base.scores };
  for (const k of RATING_KEYS) {
    const v = vote.scores[k];
    if (v) scores[k] = { sum: scores[k].sum + v, count: scores[k].count + 1 };
  }
  return {
    up: base.up + (vote.thumb === "up" ? 1 : 0),
    down: base.down + (vote.thumb === "down" ? 1 : 0),
    scores,
  };
}

export function average(t: VoteTally, k: keyof Ratings): number {
  const s = t.scores[k];
  return s.count ? s.sum / s.count : 0;
}

export function approval(t: VoteTally): number {
  const n = t.up + t.down;
  return n ? t.up / n : 0;
}
