import { z } from "zod";

const rating = z.number().int().min(1).max(10);

export const VoteSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("favorite"), slug: z.string().max(120) }),
  z.object({
    action: z.literal("rate"),
    slug: z.string().max(120),
    feel: z.object({
      smoothness: rating,
      stability: rating,
      stretch: rating,
      rom: rating,
      ergonomics: rating,
      build: rating,
    }),
  }),
]);

export type Vote = z.infer<typeof VoteSchema>;
export type FeelRating = Extract<Vote, { action: "rate" }>["feel"];

export type Community = {
  favorites: number;
  ratings: { count: number; avg: FeelRating | null };
  mine: { favorite: boolean; rating: FeelRating | null };
};

export const VOTER_COOKIE = "ia_voter";

/** Sliding-window limiter: at most `limit` writes per voter per `windowMs`. */
export function createRateLimiter(limit = 30, windowMs = 60_000) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}
