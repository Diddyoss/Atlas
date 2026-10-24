/**
 * Stock photos for machines with no photo of their own: openly licensed Wikimedia Commons pictures of the
 * same kind of machine, marked `representative` so the UI says "similar machine".
 *
 *   npm run stock
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getCatalogue } from "../../lib/catalogue";
import type { CatalogueItem, Movement, Scraped } from "../../lib/types";
import { fetchBuffer, fetchJson } from "../scrape/http";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SCRAPED_DIR = path.join(ROOT, "data", "scraped");

type Query = { q: string; title: RegExp };

const GENERIC: Query = { q: "weight machine gym", title: /machine|gym/i };

/** The title must also name gym equipment… */
const EQUIPMENT = /machine|rack|bench|gym|station|crossover|cable|press|leg ?curl|leg ?extension|pulldown|pull down|plate|dumbbell|barbell|bumper/i;
/** …and not be museum objects or clothing… */
const NOISE = /\bMET\b|lekythos|vase|museum|\(AM |sweater|knit|kettlebell|burpee|logo|svg|sewing|paring|apple|cider|singer|flymarket|license plate|dinner|food/i;
/** …and, for machines, not a free-weight exercise photo */
const FREE_WEIGHT_PHOTO = /dumbbell|barbell exercise/i;

/** Racks and rack-like stations look nothing like their movement's machine, so pick by name first */
const BY_NAME: [RegExp, Query][] = [[/rack|breaker|cage/i, { q: "power rack", title: /power ?rack|squat ?rack/i }]];

/** Specific queries first; the file title must name the machine type, since Commons search is noisy */
const QUERIES: Partial<Record<Movement, Query[]>> = {
  "leg-press": [{ q: "leg press machine", title: /leg ?press/i }],
  "hack-squat": [{ q: "hack squat machine", title: /hack/i }, { q: "leg press machine", title: /leg ?press/i }],
  "pendulum-squat": [{ q: "pendulum squat", title: /pendulum/i }, { q: "hack squat machine", title: /hack/i }],
  squat: [{ q: "squat machine", title: /squat/i }, { q: "power rack", title: /power ?rack|squat ?rack/i }],
  "leg-curl": [{ q: "leg curl machine", title: /leg ?curl/i }],
  "leg-extension": [{ q: "leg extension machine", title: /leg ?extension/i }],
  calf: [{ q: "calf raise machine", title: /calf/i }],
  "hip-thrust": [{ q: "glute machine", title: /glute|hip/i }, { q: "hip thrust", title: /hip|thrust/i }],
  "chest-fly": [
    { q: "pec deck fly machine", title: /pec ?deck|pec fly|butterfly|chest fl(y|ies)/i },
    { q: "cable crossover fly", title: /fl(y|ies)|crossover/i },
  ],
  "chest-press": [{ q: "chest press machine", title: /chest ?press/i }],
  "incline-press": [{ q: "incline bench press", title: /incline|bench/i }],
  "shoulder-press": [{ q: "shoulder press machine", title: /shoulder/i }],
  "lateral-raise": [
    { q: "lateral raise machine", title: /lateral/i },
    { q: "shoulder press machine", title: /shoulder/i },
  ],
  pulldown: [{ q: "lat pulldown machine", title: /pull ?down|pulldown/i }],
  row: [{ q: "seated row machine", title: /row/i }],
  pullover: [{ q: "pullover machine", title: /pullover/i }, { q: "lat pulldown machine", title: /pull ?down/i }],
  "lower-back": [{ q: "back extension bench", title: /back ?extension|hyperextension|roman/i }],
  multi: [{ q: "cable crossover machine", title: /cable|crossover/i }, { q: "power rack", title: /power ?rack|squat ?rack/i }],
  plates: [{ q: "olympic weight plates", title: /plate/i }, { q: "bumper plates", title: /bumper|plate/i }],
  dumbbells: [{ q: "dumbbell rack gym", title: /dumbbell/i }],
  "fixed-barbells": [{ q: "fixed barbell rack", title: /barbell/i }],
  barbell: [{ q: "olympic barbell", title: /barbell|bar/i }],
};

const FREE_WEIGHTS = new Set<Movement>(["plates", "dumbbells", "fixed-barbells", "barbell"]);

type Candidate = { url: string; page: string; artist: string; license: string };

type CommonsPage = {
  index: number;
  title: string;
  imageinfo?: {
    thumburl?: string;
    url: string;
    descriptionurl: string;
    width: number;
    extmetadata?: { Artist?: { value: string }; LicenseShortName?: { value: string } };
  }[];
};

const cache = new Map<string, Candidate[]>();

async function search(query: Query, freeWeight: boolean): Promise<Candidate[]> {
  const key = `${query.q}|${query.title}|${freeWeight}`;
  if (cache.has(key)) return cache.get(key)!;
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query.q} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size",
    iiurlwidth: "1000",
  }).toString();
  const data = await fetchJson<{ query?: { pages?: Record<string, CommonsPage> } }>(api.href);
  const found = Object.values(data.query?.pages ?? {})
    .sort((a, b) => a.index - b.index)
    .filter(
      (p) =>
        query.title.test(p.title) &&
        EQUIPMENT.test(p.title) &&
        !NOISE.test(p.title) &&
        (freeWeight || !FREE_WEIGHT_PHOTO.test(p.title)) &&
        /\.(jpe?g|png|webp)$/i.test(p.title),
    )
    .flatMap((p) => {
      const ii = p.imageinfo?.[0];
      const license = ii?.extmetadata?.LicenseShortName?.value ?? "";
      // Openly licensed only, and big enough to look decent on a card
      if (!ii || ii.width < 500 || !/^(CC|Public domain|PD)/i.test(license)) return [];
      const artist = (ii.extmetadata?.Artist?.value ?? "Unknown").replace(/<[^>]+>/g, "").trim();
      return [{ url: ii.thumburl ?? ii.url, page: ii.descriptionurl, artist, license }];
    });
  cache.set(key, found);
  return found;
}

async function main() {
  // No photo, or only a stock photo from an earlier run (re-picked so filter changes take effect)
  const missing = getCatalogue().filter((i) => i.images.length === 0 || i.images.every((img) => img.representative));
  console.log(`${missing.length} machines without photos`);
  const used = new Map<string, number>();
  const entries: Scraped[] = [];

  for (const item of missing) {
    let pick: Candidate | undefined;
    const byName = BY_NAME.filter(([re]) => re.test(item.name)).map(([, q]) => q);
    for (const q of [...byName, ...(QUERIES[item.movement] ?? []), GENERIC]) {
      const candidates = await search(q, FREE_WEIGHTS.has(item.movement));
      if (!candidates.length) continue;
      // Rotate through results so machines of one type don't all share a photo
      const n = used.get(q.q) ?? 0;
      pick = candidates[n % candidates.length];
      used.set(q.q, n + 1);
      break;
    }
    if (!pick) {
      console.log(`  · ${item.slug}: no suitable stock photo`);
      continue;
    }
    const src = await save(item, pick.url);
    if (!src) continue;
    console.log(`  ✓ ${item.slug} ← ${pick.page.split("File:")[1]}`);
    entries.push({
      slug: item.slug,
      images: [
        {
          src,
          credit: `Similar machine · ${pick.artist} · ${pick.license} · Wikimedia Commons`,
          sourceUrl: pick.page,
          representative: true,
        },
      ],
    });
  }

  writeFileSync(path.join(SCRAPED_DIR, "stock.json"), JSON.stringify(entries, null, 1) + "\n");
  const all = readdirSync(SCRAPED_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .flatMap((f) => JSON.parse(readFileSync(path.join(SCRAPED_DIR, f), "utf8")) as Scraped[]);
  writeFileSync(path.join(SCRAPED_DIR, "index.json"), JSON.stringify(all) + "\n");
  console.log(`${entries.length} stock photos saved; scraped index has ${all.length} entries`);
}

async function save(item: CatalogueItem, url: string) {
  const dir = path.join(ROOT, "public", "equipment", item.brandSlug);
  mkdirSync(dir, { recursive: true });
  try {
    const buf = await fetchBuffer(url);
    await sharp(buf)
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 74 })
      .toFile(path.join(dir, `${item.slug}.webp`));
    return `/equipment/${item.brandSlug}/${item.slug}.webp`;
  } catch (e) {
    console.warn(`  ✗ ${item.slug}: ${(e as Error).message}`);
    return null;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
