#!/usr/bin/env node
// Fetches product photos for machines listed in scripts/product-pages.json
// (machine id → product page URL) by reading each page's og:image tag, and
// writes the results to src/data/images.json. Run: npm run scrape:images
import { readFile, writeFile } from "node:fs/promises";

const pages = JSON.parse(await readFile(new URL("./product-pages.json", import.meta.url), "utf8"));
const outUrl = new URL("../src/data/images.json", import.meta.url);
const out = JSON.parse(await readFile(outUrl, "utf8"));

const ogImage = (html) =>
  html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];

let ok = 0;
for (const [id, url] of Object.entries(pages)) {
  try {
    const res = await fetch(url, { headers: { "user-agent": "AtlasIndexBot/1.0 (+https://github.com/Diddyoss/atlas)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const img = ogImage(await res.text());
    if (!img) throw new Error("no og:image");
    out[id] = { image: new URL(img, url).href, credit: new URL(url).hostname };
    ok++;
    console.log(`✓ ${id}`);
  } catch (e) {
    console.warn(`✗ ${id}: ${e.message}`);
  }
}
await writeFile(outUrl, JSON.stringify(out, null, 2) + "\n");
console.log(`${ok}/${Object.keys(pages).length} images updated`);
