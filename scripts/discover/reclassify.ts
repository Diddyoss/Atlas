/**
 * Re-runs movement classification over the generated catalogue without fetching anything, so rule
 * changes in classify.ts (such as splitting cable stations and functional trainers out of "multi")
 * reach existing entries. Entries whose movement changes get a fresh template profile; their photos,
 * sources, prices and specs are kept. Run: npx tsx scripts/discover/reclassify.ts
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { estimateEquipment } from "../../data/templates";
import type { Equipment, Movement } from "../../lib/types";
import { classify, inferLoading } from "./classify";

const GEN_DIR = path.join(import.meta.dirname, "../../data/generated");
const CABLE: Movement[] = ["functional-trainer", "cable-crossover"];
const RECLASSIFIABLE = new Set<Movement>(["multi", ...CABLE]);

let changed = 0;
const files = readdirSync(GEN_DIR).filter((f) => f.endsWith(".json") && f !== "index.json");
for (const f of files) {
  const file = path.join(GEN_DIR, f);
  const items = JSON.parse(readFileSync(file, "utf8")) as Equipment[];
  const next = items.map((item) => {
    if (!RECLASSIFIABLE.has(item.movement) || item.loading === "free-weight") return item;
    const movement = classify(item.name) ?? (item.series ? classify(`${item.series} ${item.name}`) : null);
    if (!movement || movement === item.movement || !RECLASSIFIABLE.has(movement)) return item;
    const loading = CABLE.includes(movement) ? "cable" : inferLoading(item.name);
    const fresh = estimateEquipment({
      slug: item.slug,
      brandSlug: item.brandSlug,
      name: item.name,
      series: item.series,
      movement,
      loading: movement === "multi" && /bench|rack|smith|cage/i.test(item.name) ? "bench-rack" : loading,
      isoLateral: item.isoLateral,
      discontinued: item.discontinued,
      source: item.sources[0],
    });
    changed++;
    console.log(`${item.brandSlug.padEnd(17)} ${item.movement} → ${movement}  ${item.name}`);
    return { ...fresh, aliases: item.aliases, images: item.images, sources: item.sources, specs: item.specs, listPrice: item.listPrice };
  });
  writeFileSync(file, JSON.stringify(next, null, 1) + "\n");
}

const all = files.flatMap((f) => JSON.parse(readFileSync(path.join(GEN_DIR, f), "utf8")) as unknown[]);
writeFileSync(path.join(GEN_DIR, "index.json"), JSON.stringify(all) + "\n");
console.log(`\n${changed} entries reclassified; generated index has ${all.length} machines`);
