import { cookies } from "next/headers";
import { getCommunity } from "@/lib/db";
import { getItem } from "@/lib/catalogue";
import { parseCompareIds } from "@/lib/compare";
import { VOTER_COOKIE } from "@/lib/votes";

/** GET /api/community?slugs=a,b — community stats for up to 4 machines, including the caller's own votes. */
export async function GET(request: Request) {
  const voter = (await cookies()).get(VOTER_COOKIE)?.value;
  const slugs = parseCompareIds(new URL(request.url).searchParams.get("slugs")).filter((s) => getItem(s));
  const items = Object.fromEntries(slugs.map((s) => [s, getCommunity(s, voter)]));
  return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
