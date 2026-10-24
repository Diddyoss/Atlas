import { connection } from "next/server";
import { getLeaderboard } from "@/lib/db";
import { getItem } from "@/lib/catalogue";

export async function GET() {
  // Votes change constantly; never prerender this
  await connection();
  const top = getLeaderboard(10)
    .map((row) => {
      const item = getItem(row.slug);
      return item && { ...row, name: item.name, brand: item.brand.name, vintage: item.vintage };
    })
    .filter(Boolean);
  return Response.json({ top }, { headers: { "Cache-Control": "no-store" } });
}
