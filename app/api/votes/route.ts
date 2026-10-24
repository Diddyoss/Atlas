import { cookies } from "next/headers";
import { getCommunity, setRating, toggleFavorite } from "@/lib/db";
import { getItem } from "@/lib/catalogue";
import { createRateLimiter, VOTER_COOKIE, VoteSchema } from "@/lib/votes";

const allow = createRateLimiter(30, 60_000);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid vote" }, { status: 400 });
  const vote = parsed.data;
  if (!getItem(vote.slug)) return Response.json({ error: "Unknown machine" }, { status: 404 });

  const jar = await cookies();
  let voter = jar.get(VOTER_COOKIE)?.value;
  if (!voter || !/^[0-9a-f-]{36}$/.test(voter)) {
    voter = crypto.randomUUID();
    jar.set(VOTER_COOKIE, voter, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 2 });
  }
  if (!allow(voter)) return Response.json({ error: "Slow down" }, { status: 429 });

  if (vote.action === "favorite") toggleFavorite(voter, vote.slug);
  else setRating(voter, vote.slug, vote.feel);

  return Response.json(getCommunity(vote.slug, voter));
}
