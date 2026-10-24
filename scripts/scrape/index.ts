/**
 * Catalogue scraper. Pulls product photos and source links from brand sites, falling back to
 * third-party pages and Wikimedia Commons. Writes data/scraped/<brand>.json + public/equipment/<brand>/*.webp.
 *
 *   npm run scrape -- --brand panatta --dry     # report matches only, write nothing
 *   npm run scrape -- --brand all
 *   npm run scrape -- --brand medx --fallback-only
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Fuse from "fuse.js";
import sharp from "sharp";
import brandsJson from "../../data/brands.json";
import { curated } from "../../data/equipment";
import type { Brand, Equipment, Scraped } from "../../lib/types";
import { ADAPTERS, type Adapter } from "./adapters";
import { extractLinks, extractProduct, type PageInfo } from "./extract";
import { findFallbackImage, type Found } from "./fallbacks";
import { DisallowedError, fetchBuffer, fetchText } from "./http";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SCRAPED_DIR = path.join(ROOT, "data", "scraped");
const brands = brandsJson as Brand[];

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const DRY = flag("dry");
const FALLBACK_ONLY = flag("fallback-only");
const NO_FALLBACK = flag("no-fallback");
const target = opt("brand") ?? "all";

async function renderHtml(url: string): Promise<string | null> {
  try {
    // Optional dependency: only needed for client-rendered sites
    const mod = "playwright";
    type Page = { goto(u: string, o: object): Promise<unknown>; content(): Promise<string> };
    type Chromium = { launch(): Promise<{ newPage(): Promise<Page>; close(): Promise<void> }> };
    const { chromium } = (await import(mod)) as { chromium: Chromium };
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    const html = await page.content();
    await browser.close();
    return html;
  } catch {
    console.warn("    playwright not available — install it to crawl client-rendered sites (see README)");
    return null;
  }
}

async function crawl(adapter: Adapter): Promise<PageInfo[]> {
  if (adapter.api) {
    const pages = await adapter.api();
    if (pages.length) return pages;
  }
  const links = new Set<string>();
  for (const start of adapter.startUrls) {
    try {
      const html = adapter.render ? await renderHtml(start) : await fetchText(start);
      if (html) extractLinks(html, start, adapter.productLink).forEach((l) => links.add(l));
    } catch (e) {
      console.warn(`    ${start}: ${(e as Error).message}`);
    }
  }
  const pages: PageInfo[] = [];
  for (const link of [...links].slice(0, adapter.maxProducts ?? 80)) {
    try {
      pages.push(extractProduct(await fetchText(link), link));
    } catch (e) {
      if (!(e instanceof DisallowedError)) console.warn(`    ${link}: ${(e as Error).message}`);
    }
  }
  return pages;
}

/** Match scraped page names to curated machines of the same brand. */
function matchPages(items: Equipment[], pages: PageInfo[]) {
  const fuse = new Fuse(items, {
    keys: [
      { name: "name", weight: 3 },
      { name: "aliases", weight: 1 },
      { name: "series", weight: 0.5 },
    ],
    includeScore: true,
    threshold: 0.3,
    ignoreLocation: true,
  });
  const best = new Map<string, { page: PageInfo; score: number }>();
  for (const page of pages) {
    if (!page.name || !page.image) continue;
    const hit = fuse.search(page.name)[0];
    if (!hit || hit.score === undefined) continue;
    const prev = best.get(hit.item.slug);
    if (!prev || hit.score < prev.score) best.set(hit.item.slug, { page, score: hit.score });
  }
  return best;
}

async function saveImage(brand: string, slug: string, url: string) {
  const dir = path.join(ROOT, "public", "equipment", brand);
  mkdirSync(dir, { recursive: true });
  const buf = await fetchBuffer(url);
  await sharp(buf).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(dir, `${slug}.webp`));
  return `/equipment/${brand}/${slug}.webp`;
}

function readBrandFile(brand: string): Scraped[] {
  const file = path.join(SCRAPED_DIR, `${brand}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Scraped[]) : [];
}

function rebuildIndex() {
  const all = readdirSync(SCRAPED_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .flatMap((f) => JSON.parse(readFileSync(path.join(SCRAPED_DIR, f), "utf8")) as Scraped[]);
  writeFileSync(path.join(SCRAPED_DIR, "index.json"), JSON.stringify(all, null, 2) + "\n");
  return all.length;
}

async function scrapeBrand(brand: Brand) {
  const items = curated.filter((i) => i.brandSlug === brand.slug);
  if (!items.length) return;
  console.log(`\n■ ${brand.name} — ${items.length} curated machines`);

  const adapter = ADAPTERS.find((a) => a.brand === brand.slug);
  const found = new Map<string, Found & { official: boolean; description?: string }>();

  if (adapter && !FALLBACK_ONLY) {
    const pages = await crawl(adapter);
    console.log(`  crawled ${pages.length} product pages`);
    for (const [slug, { page, score }] of matchPages(items, pages)) {
      console.log(`  ✓ ${slug} ← "${page.name}" (score ${score.toFixed(2)})`);
      found.set(slug, {
        image: page.image!,
        credit: `${brand.name} (official site)`,
        sourceUrl: page.url,
        official: true,
        description: page.description,
      });
    }
  } else if (!adapter) {
    console.log("  no brand adapter (defunct or no crawlable site) — using fallbacks");
  }

  if (!NO_FALLBACK) {
    for (const item of items.filter((i) => !found.has(i.slug))) {
      const hit = await findFallbackImage(item, brand.name);
      if (hit) {
        console.log(`  ↺ ${item.slug} ← fallback ${hit.credit}`);
        found.set(item.slug, { ...hit, official: false });
      } else {
        console.log(`  · ${item.slug}: nothing found`);
      }
    }
  }

  if (DRY) {
    console.log(`  dry run: ${found.size}/${items.length} would get images (nothing written)`);
    return;
  }

  const entries = new Map(readBrandFile(brand.slug).map((e) => [e.slug, e]));
  for (const [slug, f] of found) {
    try {
      const src = await saveImage(brand.slug, slug, f.image);
      entries.set(slug, {
        slug,
        images: [{ src, credit: f.credit, sourceUrl: f.sourceUrl }],
        sources: [{ label: f.official ? `${brand.name} product page` : f.credit, url: f.sourceUrl }],
        description: f.description,
      });
    } catch (e) {
      console.warn(`  ✗ ${slug}: ${(e as Error).message}`);
    }
  }
  mkdirSync(SCRAPED_DIR, { recursive: true });
  writeFileSync(path.join(SCRAPED_DIR, `${brand.slug}.json`), JSON.stringify([...entries.values()], null, 2) + "\n");
  console.log(`  saved ${entries.size} entries`);
}

async function main() {
  const list = target === "all" ? brands : brands.filter((b) => b.slug === target);
  if (!list.length) {
    console.error(`Unknown brand "${target}". Try one of: ${brands.map((b) => b.slug).join(", ")}`);
    process.exit(1);
  }
  for (const b of list) await scrapeBrand(b);
  if (!DRY) console.log(`\nindex.json rebuilt with ${rebuildIndex()} entries. Run \`npm run validate\` next.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
