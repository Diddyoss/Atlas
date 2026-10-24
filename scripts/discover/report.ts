/** Read-only report: how cached products classify, per brand. `npx tsx scripts/discover/report.ts [brand] [movement]` */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { classify } from "./classify";
import type { Raw } from "./sources";

const dir = path.resolve(import.meta.dirname, "../.cache");
const [brandFilter, movementFilter] = process.argv.slice(2);
const raws = readdirSync(dir).flatMap((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as Raw[]);

const byBrand = new Map<string, { kept: number; skipped: string[] }>();
for (const r of raws) {
  const m = classify(r.name) ?? (r.series ? classify(`${r.series} ${r.name}`) : null);
  const b = byBrand.get(r.brandSlug) ?? { kept: 0, skipped: [] };
  if (m) b.kept++;
  else b.skipped.push(r.name);
  byBrand.set(r.brandSlug, b);
  if (brandFilter && r.brandSlug === brandFilter && (!movementFilter || m === movementFilter)) console.log(`${m ?? "—"}\t${r.series ?? ""}\t${r.name}`);
}
if (!brandFilter) {
  for (const [b, v] of byBrand) console.log(`${b}: kept ${v.kept}, skipped ${v.skipped.length} (e.g. ${v.skipped.slice(0, 6).join(" · ")})`);
}
