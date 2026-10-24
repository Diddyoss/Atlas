/** Read-only: curated machines without photos, and estimated entries of the same brand+movement with similar names. */
import Fuse from "fuse.js";
import { curated } from "../../data/equipment";
import generated from "../../data/generated/index.json";
import scraped from "../../data/scraped/index.json";
import type { Equipment } from "../../lib/types";

const withImage = new Set((scraped as { slug: string; images: unknown[] }[]).filter((s) => s.images.length).map((s) => s.slug));
const gen = generated as Equipment[];
for (const c of curated.filter((c) => !withImage.has(c.slug))) {
  const pool = gen.filter((g) => g.brandSlug === c.brandSlug && g.movement === c.movement);
  const hits = new Fuse(pool, { keys: ["name"], includeScore: true, threshold: 0.5, ignoreLocation: true }).search(c.name).slice(0, 2);
  console.log(`${c.slug} [${c.series ?? ""}] ${c.name}  →  ${hits.map((h) => `${h.item.slug} [${h.item.series ?? ""}] ${h.item.name} (${h.score?.toFixed(2)})`).join("  |  ") || "—"}`);
}
