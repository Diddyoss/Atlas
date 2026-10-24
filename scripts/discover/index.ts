/**
 * Discover machines from brand and dealer catalogues, attach photos to curated entries and add the rest
 * as estimated entries. Writes data/generated/*.json, data/scraped/*.json and public/equipment/<brand>/*.webp.
 *
 *   npm run discover                       # every source
 *   npm run discover -- --only prime,hoist # some sources
 *   npm run discover -- --no-images        # skip downloads (reuses images already on disk)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Fuse from "fuse.js";
import sharp from "sharp";
import brandsJson from "../../data/brands.json";
import { curated } from "../../data/equipment";
import { estimateEquipment, type DiscoveredMachine } from "../../data/templates";
import { EquipmentSchema, type Brand, type Equipment, type Scraped } from "../../lib/types";
import { fetchBuffer } from "../scrape/http";
import { classify, inferLoading, isIsoLateral, shortenName, slugify, tidyName } from "./classify";
import { pruneImages } from "./prune";
import { SOURCES, type Raw } from "./sources";

const ROOT = path.resolve(import.meta.dirname, "../..");
const GEN_DIR = path.join(ROOT, "data", "generated");
const SCRAPED_DIR = path.join(ROOT, "data", "scraped");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache");
const brands = brandsJson as Brand[];

const args = process.argv.slice(2);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt("only")?.split(",");
const NO_IMAGES = args.includes("--no-images");
const FROM_CACHE = args.includes("--from-cache");
/** Brands whose photos are downloaded again even if a file already exists (e.g. after fixing a source) */
const REFRESH = new Set(opt("refresh")?.split(",") ?? []);

const PREFIX: Record<string, string> = {
  "hammer-strength": "hammer",
  "life-fitness": "lf",
  "prime-fitness": "prime",
  "arsenal-strength": "arsenal",
};

/** Brands whose series we infer from page text rather than read from the source, so it can't veto a match */
const SERIES_GUESSED = new Set(["newtech"]);
const norm = (s?: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const readJson =<T>(file: string, fallback: T): T => (existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : fallback);

/** Fetch the selected sources; every other source is read from its last cached run so brand files stay complete. */
async function collect(): Promise<Raw[]> {
  mkdirSync(CACHE_DIR, { recursive: true });
  const results = await Promise.all(
    SOURCES.map(async (s) => {
      const cache = path.join(CACHE_DIR, `${s.id}.json`);
      const selected = !only || only.includes(s.id);
      if (!selected || (FROM_CACHE && existsSync(cache))) return readJson<Raw[]>(cache, []);
      console.log(`▶ ${s.id}`);
      try {
        const raws = await s.run();
        writeFileSync(cache, JSON.stringify(raws, null, 1));
        console.log(`✓ ${s.id}: ${raws.length} products`);
        return raws;
      } catch (e) {
        console.error(`✗ ${s.id}: ${(e as Error).message}`);
        return [];
      }
    }),
  );
  return results.flat();
}

async function saveImage(brand: string, slug: string, url: string): Promise<string | null> {
  const dir = path.join(ROOT, "public", "equipment", brand);
  const file = path.join(dir, `${slug}.webp`);
  const src = `/equipment/${brand}/${slug}.webp`;
  if (existsSync(file) && !REFRESH.has(brand)) return src;
  if (NO_IMAGES) return existsSync(file) ? src : null;
  mkdirSync(dir, { recursive: true });
  try {
    const buf = await fetchBuffer(url);
    await sharp(buf)
      .flatten({ background: "#ffffff" })
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 74 })
      .toFile(file);
    return src;
  } catch (e) {
    console.warn(`    image ${brand}/${slug}: ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  const raws = await collect();
  if (args.includes("--fetch-only")) return;
  const touchedBrands = new Set(SOURCES.flatMap((s) => s.brands));

  // Curated machines per brand, for matching
  const fuseByBrand = new Map<string, Fuse<Equipment>>();
  for (const b of brands) {
    const items = curated.filter((i) => i.brandSlug === b.slug);
    fuseByBrand.set(b.slug, new Fuse(items, { keys: ["name", "aliases"], includeScore: true, threshold: 0.3, ignoreLocation: true }));
  }

  const curatedHits = new Map<string, { item: Equipment; raw: Raw; score: number }>();
  const generated = new Map<string, DiscoveredMachine>();
  const nameKeys = new Set<string>();
  let skipped = 0;

  for (const raw of raws) {
    // Cached names may predate the latest clean-up rules
    const brand = brands.find((b) => b.slug === raw.brandSlug);
    const brandNames = brand ? [brand.name.replace(/\s*\(.*\)/, ""), ...(raw.brandSlug === "arsenal-strength" ? ["Arsenal"] : [])] : [];
    if (raw.series && raw.name.toLowerCase() === raw.series.toLowerCase()) raw.series = undefined;
    raw.name = shortenName(tidyName(raw.name), brandNames, raw.series);
    if (raw.series) raw.series = shortenName(raw.series, brandNames) || raw.series;
    if (!raw.name) continue;
    const movement = classify(raw.name) ?? (raw.series ? classify(`${raw.series} ${raw.name}`) : null);
    if (!movement) {
      skipped++;
      continue;
    }
    const hit = fuseByBrand
      .get(raw.brandSlug)
      ?.search(raw.name)
      .find(
        (h) =>
          h.item.movement === movement &&
          (SERIES_GUESSED.has(raw.brandSlug) || !h.item.series || !raw.series || norm(h.item.series) === norm(raw.series)),
      );
    if (hit && hit.score !== undefined && hit.score <= 0.3) {
      const prev = curatedHits.get(hit.item.slug);
      if (!prev || hit.score < prev.score) curatedHits.set(hit.item.slug, { item: hit.item, raw, score: hit.score });
      continue;
    }
    const key = `${raw.brandSlug}|${(raw.series ?? "").toLowerCase()}|${slugify(raw.name)}`;
    if (nameKeys.has(key)) continue;
    nameKeys.add(key);

    let slug = slugify(`${PREFIX[raw.brandSlug] ?? raw.brandSlug} ${raw.series ?? ""} ${raw.name}`);
    for (let n = 2; generated.has(slug) || curated.some((c) => c.slug === slug); n++) slug = `${slugify(`${PREFIX[raw.brandSlug] ?? raw.brandSlug} ${raw.series ?? ""} ${raw.name}`)}-${n}`;
    const loading = inferLoading(`${raw.name} ${raw.context ?? ""}`, raw.loading);
    generated.set(slug, {
      slug,
      brandSlug: raw.brandSlug,
      name: raw.name,
      series: raw.series,
      movement,
      loading: movement === "multi" && /bench|rack|smith|cage/i.test(raw.name) ? "bench-rack" : loading,
      isoLateral: isIsoLateral(raw.name),
      discontinued: raw.discontinued ?? false,
      image: raw.image ? { src: raw.image, credit: raw.credit, sourceUrl: raw.url } : undefined,
      source: { label: raw.credit, url: raw.url },
    });
  }
  // Second pass from the curated side: catalogue names often add words ("Plate Loaded Linear Leg Press"),
  // which the first pass scores too low. Qualifiers must agree so "Reverse V-Squat" never becomes "V-Squat".
  const QUALIFIERS = /\b(reverse|rear|incline|decline|seated|standing|prone|kneeling|lying|vertical|horizontal|single|unilateral)\b/gi;
  const quals = (s: string) => [...new Set((s.match(QUALIFIERS) ?? []).map((q) => q.toLowerCase()))].sort().join(",");
  for (const c of curated) {
    if (curatedHits.has(c.slug)) continue;
    const pool = [...generated.values()].filter(
      (g) =>
        g.brandSlug === c.brandSlug &&
        g.movement === c.movement &&
        g.image &&
        (SERIES_GUESSED.has(c.brandSlug) || !c.series || !g.series || norm(c.series) === norm(g.series)),
    );
    const hit = new Fuse(pool, { keys: ["name"], includeScore: true, threshold: 0.12, ignoreLocation: true })
      .search(c.name.replace(new RegExp(`^${c.series ?? "\\b"}\\s+`, "i"), ""))
      .find((h) => quals(h.item.name) === quals(c.name));
    if (!hit) continue;
    const g = hit.item;
    curatedHits.set(c.slug, {
      item: c,
      raw: { brandSlug: g.brandSlug, name: g.name, url: g.source.url, image: g.image!.src, credit: g.image!.credit },
      score: hit.score ?? 0,
    });
    generated.delete(g.slug);
  }

  console.log(`\n${raws.length} products → ${generated.size} new machines, ${curatedHits.size} curated matches, ${skipped} skipped (not machines)`);

  // Download images
  let ok = 0;
  await Promise.all([
    ...[...generated.values()].map(async (g) => {
      if (!g.image) return;
      const src = await saveImage(g.brandSlug, g.slug, g.image.src);
      g.image = src ? { ...g.image, src } : undefined;
      if (src) ok++;
    }),
    ...[...curatedHits.values()].map(async (h) => {
      if (!h.raw.image) return;
      const src = await saveImage(h.item.brandSlug, h.item.slug, h.raw.image);
      (h as { src?: string | null }).src = src;
      if (src) ok++;
    }),
  ]);
  console.log(`${ok} images saved`);

  // Write generated catalogue per touched brand
  mkdirSync(GEN_DIR, { recursive: true });
  for (const brand of touchedBrands) {
    const items = [...generated.values()].filter((g) => g.brandSlug === brand).map(estimateEquipment);
    for (const it of items) {
      const r = EquipmentSchema.safeParse(it);
      if (!r.success) throw new Error(`${it.slug}: ${r.error.message}`);
    }
    writeFileSync(path.join(GEN_DIR, `${brand}.json`), JSON.stringify(items, null, 1) + "\n");
  }

  // Photos and source links for curated machines
  mkdirSync(SCRAPED_DIR, { recursive: true });
  for (const brand of touchedBrands) {
    const file = path.join(SCRAPED_DIR, `${brand}.json`);
    const entries = new Map(readJson<Scraped[]>(file, []).map((e) => [e.slug, e]));
    for (const h of curatedHits.values()) {
      if (h.item.brandSlug !== brand) continue;
      const src = (h as { src?: string | null }).src;
      entries.set(h.item.slug, {
        slug: h.item.slug,
        images: src ? [{ src, credit: h.raw.credit, sourceUrl: h.raw.url }] : (entries.get(h.item.slug)?.images ?? []),
        sources: [{ label: h.raw.credit, url: h.raw.url }],
      });
    }
    writeFileSync(file, JSON.stringify([...entries.values()], null, 1) + "\n");
  }

  const rebuild = (dir: string) => {
    const all = readdirSync(dir)
      .filter((f) => f.endsWith(".json") && f !== "index.json")
      .flatMap((f) => readJson<unknown[]>(path.join(dir, f), []));
    writeFileSync(path.join(dir, "index.json"), JSON.stringify(all) + "\n");
    return all.length;
  };
  console.log(`generated index: ${rebuild(GEN_DIR)} machines; scraped index: ${rebuild(SCRAPED_DIR)} entries`);
  console.log(`pruned ${pruneImages(ROOT)} unreferenced images`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
