import * as cheerio from "cheerio";
import type { ListPrice, Loading } from "../../lib/types";
import { extractProduct } from "../scrape/extract";
import { DisallowedError, fetchJson, fetchText } from "../scrape/http";
import { tidyName } from "./classify";

/** A product found in a brand or dealer catalogue, before classification. */
export type Raw = {
  brandSlug: string;
  name: string;
  series?: string;
  loading?: Loading;
  url: string;
  image?: string;
  credit: string;
  discontinued?: boolean;
  /** Extra text (description/category) that helps classify the loading type */
  context?: string;
  price?: Omit<ListPrice, "source" | "url">;
};

/** Prices this low are accessories or placeholders, not machines */
const MIN_MACHINE_PRICE = 300;
/** Prices above this (in the listing currency) are "call for price" placeholders */
const MAX_LISTING: Record<string, number> = { USD: 80_000, AUD: 120_000, SEK: 800_000, EUR: 70_000, GBP: 60_000 };

export type Source = { id: string; brands: string[]; run: () => Promise<Raw[]> };

const log = (id: string, msg: string) => console.log(`  [${id}] ${msg}`);

async function safe<T>(id: string, what: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    if (!(e instanceof DisallowedError)) log(id, `${what}: ${(e as Error).message}`);
    else log(id, `${what}: robots.txt disallows — skipped`);
    return null;
  }
}

// ---------- Shopify stores ----------

type ShopifyProduct = {
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[];
  body_html?: string;
  images: { src: string }[];
  variants?: { price: string }[];
};

function shopifyPrice(
  p: ShopifyProduct,
  currency: ListPrice["currency"],
  condition: ListPrice["condition"],
  taxIncluded = 0,
): Raw["price"] {
  const amount = Number(p.variants?.[0]?.price);
  return amount >= MIN_MACHINE_PRICE && amount <= MAX_LISTING[currency] ? { amount, currency, taxIncluded, condition } : undefined;
}

async function shopifyAll(store: string, collection?: string): Promise<ShopifyProduct[]> {
  const base = collection ? `${store}/collections/${collection}` : store;
  const out: ShopifyProduct[] = [];
  for (let page = 1; page <= 40; page++) {
    const j = await fetchJson<{ products: ShopifyProduct[] }>(`${base}/products.json?limit=250&page=${page}`);
    if (!j.products?.length) break;
    out.push(...j.products);
  }
  return out;
}

const prime: Source = {
  id: "prime",
  brands: ["prime-fitness"],
  run: async () => {
    const store = "https://www.primefitnessusa.com";
    const SERIES: Record<string, { series: string; loading: Loading }> = {
      EVOLUTION: { series: "Evolution", loading: "selectorized" },
      HYBRID: { series: "Hybrid", loading: "selectorized" },
      "Plate Loaded": { series: "Plate-Loaded", loading: "plate" },
      Specialty: { series: "Specialty", loading: "cable" },
      Benches: { series: "Benches", loading: "bench-rack" },
    };
    return (await shopifyAll(store))
      .filter((p) => SERIES[p.product_type] && p.images.length)
      .map((p) => {
        const parts = p.title.split(/\s+[|I]\s+|\s*\|\s*/);
        const name = tidyName(parts.length > 1 ? parts.slice(1).join(" ") : p.title);
        const meta = SERIES[p.product_type];
        return {
          brandSlug: "prime-fitness",
          name,
          series: meta.series,
          loading: /preacher|bench/i.test(name) ? "bench-rack" : meta.loading,
          url: `${store}/products/${p.handle}`,
          image: p.images[0].src,
          credit: "Prime Fitness (official store)",
          price: shopifyPrice(p, "USD", "new"),
        };
      });
  },
};

const hoist: Source = {
  id: "hoist",
  brands: ["hoist"],
  run: async () => {
    const store = "https://www.hoistfitness.com";
    return (await shopifyAll(store))
      .filter(
        (p) =>
          p.product_type === "Whole Product" &&
          p.tags.includes("Commercial") &&
          p.tags.some((t) => /^CCAT (Selectorized|Plate Loaded|Benches)/i.test(t)) &&
          p.images.length,
      )
      .map((p) => {
        const line = p.tags.find((t) => /^commercial_/i.test(t))?.replace(/^commercial_/i, "");
        const plate = p.tags.some((t) => /plate loaded/i.test(t));
        return {
          brandSlug: "hoist",
          name: tidyName(p.title),
          series: line ? tidyName(line) : plate ? "Plate-Loaded" : "Selectorized",
          loading: plate ? ("plate" as const) : undefined,
          url: `${store}/products/${p.handle}`,
          image: p.images[0].src,
          credit: "Hoist Fitness (official store)",
          price: shopifyPrice(p, "USD", "new"),
        };
      });
  },
};

const nautilus: Source = {
  id: "nautilus",
  brands: ["nautilus"],
  run: async () => {
    const store = "https://www.corehandf.com";
    const LINES = /^(Inspiration|Impact|Instinct|HumanSport|Humansport|Leverage|Nitro|Evo)\b/i;
    return (await shopifyAll(store, "nautilus"))
      .filter((p) => p.images.length)
      .map((p) => {
        const clean = tidyName(p.title);
        const line = clean.match(LINES)?.[1];
        return {
          brandSlug: "nautilus",
          name: line ? clean.replace(LINES, "").trim() : clean,
          series: line ? tidyName(line) : undefined,
          loading: /leverage/i.test(clean) ? ("plate" as const) : undefined,
          url: `${store}/products/${p.handle}`,
          image: p.images[0].src,
          credit: "Core Health & Fitness (Nautilus)",
        };
      });
  },
};

/** Remanufactured-equipment dealer: our source for vintage Cybex/Icarian/Nautilus and for Technogym and Matrix. */
const fitnessSuperstore: Source = {
  id: "fitness-superstore",
  brands: ["cybex", "icarian", "nautilus", "technogym", "matrix", "precor"],
  run: async () => {
    const store = "https://fitnesssuperstore.com";
    const out: Raw[] = [];
    const CURRENT_NAUTILUS = /inspiration|impact|instinct|humansport|leverage/i;
    for (const p of await shopifyAll(store)) {
      if (!p.images.length) continue;
      let brandSlug: string | null = null;
      let discontinued = false;
      if (p.vendor === "Cybex") brandSlug = "cybex";
      else if (p.vendor === "Precor") brandSlug = /icarian/i.test(p.title) ? "icarian" : "precor";
      else if (p.vendor === "Nautilus") {
        brandSlug = "nautilus";
        discontinued = !CURRENT_NAUTILUS.test(p.title);
      } else if (p.vendor === "Technogym") brandSlug = "technogym";
      else if (p.vendor === "Matrix") brandSlug = "matrix";
      if (!brandSlug) continue;
      const name = tidyName(p.title.replace(new RegExp(`^(${p.vendor}|Precor Icarian|Precor)\\s+`, "i"), ""))
        // Leading catalogue codes such as "DSL0314" hide the series name
        .replace(/^[A-Z]{2,4}\d{3,5}[A-Z]?\s+/, "");
      const series = name.match(
        /^(VR1|VR2|VR3|Eagle|Prestige|Classic|Plate Loaded|Nitro Plus|Nitro|Evo|One|2ST|Next Generation|Inspiration|Impact|Instinct|Selection|Element\+?|Pure Strength|Ultra|Aura|Versa|Magnum|Genesis|Discovery|Vitality|Resolute|Icarian)\b/i,
      )?.[1];
      out.push({
        brandSlug,
        name,
        series: series ? tidyName(series) : undefined,
        url: `${store}/products/${p.handle}`,
        image: p.images[0].src,
        credit: "Fitness Superstore (remanufactured listing)",
        discontinued,
        context: `${p.product_type} ${p.tags.join(" ")}`,
        price: shopifyPrice(p, "USD", /\(new\)/i.test(p.title) ? "new" : "used"),
      });
    }
    return out;
  },
};

const globalFitness: Source = {
  id: "global-fitness",
  brands: ["arsenal-strength", "precor"],
  run: async () => {
    const store = "https://www.globalfitness.com";
    return (await shopifyAll(store))
      .filter((p) => /arsenal|precor/i.test(p.vendor) && p.images.length)
      .map((p) => {
        const precor = /precor/i.test(p.vendor);
        // Tidy first: titles often start with "Used", which hides the brand prefix
        const name = tidyName(p.title)
          .replace(/^(arsenal strength|precor)\s+/i, "")
          .replace(/^[A-Z]{2,4}\d{3,5}[A-Z]?\s+/, "");
        return {
          brandSlug: precor ? (/icarian/i.test(p.title) ? "icarian" : "precor") : "arsenal-strength",
          name,
          series: precor ? name.match(/^(Discovery|Vitality|Resolute|Icarian)\b/i)?.[1] : undefined,
          url: `${store}/products/${p.handle}`,
          image: p.images[0].src,
          credit: "Global Fitness (dealer listing)",
          context: p.tags.join(" "),
          price: shopifyPrice(p, "USD", /\bnew\b/i.test(p.title) && !/used|refurb/i.test(p.title) ? "new" : "used"),
        };
      });
  },
};

const gymleco: Source = {
  id: "gymleco",
  brands: ["gymleco"],
  run: async () => {
    const store = "https://gymleco.com";
    const TYPES: Record<string, Loading | undefined> = {
      "Plate loaded machines": "plate",
      "Combi machines": undefined,
      "Smith machines": "bench-rack",
      "Functional training": undefined,
    };
    return (await shopifyAll(store))
      .filter((p) => p.product_type in TYPES && p.images.length && !p.tags.includes("sv-only"))
      .map((p) => ({
        brandSlug: "gymleco",
        // Drop the leading model number ("067 Gymleco Hip & Back Extension")
        name: tidyName(p.title.replace(/^\d{2,4}[A-Z]?\s+/, "").replace(/^gymleco\s+/i, "")),
        series: p.product_type === "Combi machines" ? "Combi" : p.product_type === "Plate loaded machines" ? "Plate Loaded" : undefined,
        loading: TYPES[p.product_type],
        url: `${store}/products/${p.handle}`,
        image: p.images[0].src,
        credit: "Gymleco (official store)",
        context: p.tags.join(" "),
        // Swedish retail prices include 25% VAT
        price: shopifyPrice(p, "SEK", "new", 0.25),
      }));
  },
};

// ---------- WooCommerce Store API (public, read-only) ----------

type WooProduct = {
  name: string;
  permalink: string;
  images: { src: string }[];
  categories: { name: string }[];
  prices?: { price: string; currency_code: string; currency_minor_unit: number };
};

function wooPrice(p: WooProduct, taxIncluded: number): Raw["price"] {
  if (!p.prices) return undefined;
  const amount = Number(p.prices.price) / 10 ** p.prices.currency_minor_unit;
  const currency = p.prices.currency_code as ListPrice["currency"];
  if (!(amount >= MIN_MACHINE_PRICE) || !(amount <= MAX_LISTING[currency])) return undefined;
  return { amount, currency, taxIncluded, condition: "new" };
}

async function wooAll(store: string, search?: string): Promise<WooProduct[]> {
  const out: WooProduct[] = [];
  for (let page = 1; page <= 20; page++) {
    const q = new URLSearchParams({ per_page: "100", page: String(page), ...(search ? { search } : {}) });
    const batch = await fetchJson<WooProduct[]>(`${store}/wp-json/wc/store/v1/products?${q}`);
    if (!batch.length) break;
    out.push(...batch);
  }
  return out;
}

/** Primo Fitness, a US Panatta dealer; panattasport.com itself blocks automated access. */
const panatta: Source = {
  id: "panatta",
  brands: ["panatta"],
  run: async () => {
    const LINES: Record<string, Loading> = {
      "Freeweight HP": "plate",
      "Freeweight One": "plate",
      "Freeweight Special": "plate",
      "Free Weight Special": "plate",
      Sec: "selectorized",
      SEC: "selectorized",
      "Fit Evo": "selectorized",
      "Fit EVO": "selectorized",
      Monolith: "selectorized",
    };
    return (await wooAll("https://panattafitness.com"))
      .filter((p) => p.images.length && !p.categories.some((c) => /cardio/i.test(c.name)))
      .map((p) => {
        const line = p.categories.map((c) => c.name).find((n) => LINES[n]);
        const name = p.name
          .replace(/\t/g, " ")
          .replace(/^panatta\s+/i, "")
          .replace(/^(freeweight hp|freeweight one|freeweight special|free weight special|sec|fit evo|monolith|dfc)\s+/i, "")
          // Model codes such as 1FW451, 1HP502PRB, 1SC115HLP
          .replace(/\b\d[A-Z]{2,4}\d{1,4}[A-Z0-9]*\b/gi, "")
          .replace(/\(\s*\d+\s*station[^)]*\)/i, "");
        return {
          brandSlug: "panatta",
          name: tidyName(name),
          series: line ? line.replace(/^Freeweight Hp$/i, "Freeweight HP").replace(/^Sec$/i, "SEC").replace(/^Fit Evo$/i, "Fit EVO") : undefined,
          loading: line ? LINES[line] : undefined,
          url: p.permalink,
          image: p.images[0].src,
          credit: "Primo Fitness (Panatta dealer)",
          price: wooPrice(p, 0),
        };
      });
  },
};

/** Performaxx, Arsenal Strength's Australian distributor. */
const arsenal: Source = {
  id: "arsenal",
  brands: ["arsenal-strength"],
  run: async () =>
    (await wooAll("https://performaxx.com.au", "arsenal"))
      .filter((p) => p.images.length && /arsenal/i.test(p.name))
      .map((p) => {
        const [head, rest] = p.name.replace(/&#8211;/g, "–").split(/\s*\|\s*/);
        const series = head.replace(/^arsenal strength\s*–\s*/i, "").replace(/\s+series$/i, "");
        const cats = p.categories.map((c) => c.name).join(" ");
        return {
          brandSlug: "arsenal-strength",
          name: tidyName(rest ?? head),
          series: tidyName(series),
          loading: /reloaded|plate/i.test(`${series} ${cats}`) ? ("plate" as const) : /selectorized/i.test(series) ? ("selectorized" as const) : undefined,
          url: p.permalink,
          image: p.images[0].src,
          credit: "Performaxx (Arsenal Strength distributor)",
          context: cats,
          // Australian prices include 10% GST
          price: wooPrice(p, 0.1),
        };
      }),
};

// ---------- HTML catalogues ----------

/** Fetch a listing page, follow product links, read name + hero image from each product page. */
async function crawlListing(
  id: string,
  listings: { url: string; link: RegExp; brandSlug: string; series?: string; loading?: Loading }[],
  credit: string,
): Promise<Raw[]> {
  const out: Raw[] = [];
  const seen = new Set<string>();
  for (const l of listings) {
    const html = await safe(id, l.url, () => fetchText(l.url));
    if (!html) continue;
    const $ = cheerio.load(html);
    const links = new Set<string>();
    $("a[href]").each((_, a) => {
      try {
        const u = new URL($(a).attr("href")!, l.url);
        u.hash = "";
        if (l.link.test(u.pathname) && u.href !== l.url) links.add(u.href);
      } catch {
        // ignore malformed hrefs
      }
    });
    log(id, `${l.url.replace(/^https?:\/\//, "")}: ${links.size} product links`);
    for (const link of links) {
      if (seen.has(link)) continue;
      seen.add(link);
      const page = await safe(id, link, async () => extractProduct(await fetchText(link), link));
      if (!page?.name || !page.image) continue;
      out.push({
        brandSlug: l.brandSlug,
        name: tidyName(page.name.replace(/\s*[|–-]\s*(Life Fitness|Hammer Strength).*$/i, "")),
        series: l.series,
        loading: l.loading,
        url: page.url,
        image: page.image,
        credit,
        context: page.description,
      });
    }
  }
  return out;
}

const lifeFitness: Source = {
  id: "life-fitness",
  brands: ["hammer-strength", "life-fitness"],
  run: () => {
    const base = "https://www.lifefitness.com/en-us/catalog/strength-training";
    // Only US-English pages; the listings also link every other locale's copy
    const product = (cat: string) => new RegExp(`^/en-us/catalog/strength-training/${cat}/[^/]+$`);
    return crawlListing(
      "life-fitness",
      [
        { url: `${base}/plate-loaded/hammer-strength`, link: product("plate-loaded"), brandSlug: "hammer-strength", series: "Plate-Loaded", loading: "plate" },
        { url: `${base}/selectorized/hammer-strength-select`, link: product("selectorized"), brandSlug: "hammer-strength", series: "Select", loading: "selectorized" },
        { url: `${base}/selectorized/motion-technology-selectorised`, link: product("selectorized"), brandSlug: "hammer-strength", series: "MTS", loading: "selectorized" },
        { url: `${base}/selectorized/insignia-series`, link: product("selectorized"), brandSlug: "life-fitness", series: "Insignia", loading: "selectorized" },
        { url: `${base}/selectorized/axiom-series`, link: product("selectorized"), brandSlug: "life-fitness", series: "Axiom", loading: "selectorized" },
      ],
      "Life Fitness (official catalogue)",
    ).then((items) =>
      // The listing pages cross-link series; keep each product under the brand its URL implies
      items.filter((i) => !/^(insignia|axiom|hammer strength select|plate loaded|selectorized)$/i.test(i.name)),
    );
  },
};

const atlantis: Source = {
  id: "atlantis",
  brands: ["atlantis"],
  run: async () => {
    const parts = ["abdominals", "arms", "back", "calf", "chest", "legs", "shoulders"];
    const found = new Map<string, Raw>();
    for (const part of parts) {
      const url = `https://atlantisstrength.com/gym-equipment/${part}`;
      const html = await safe("atlantis", url, () => fetchText(url));
      if (!html) continue;
      const $ = cheerio.load(html);
      $("a[href*='/gym-equipment/']").each((_, a) => {
        const href = new URL($(a).attr("href")!, url).href;
        const model = href.split("/").pop() ?? "";
        if (!/^[a-z]{1,2}-?\d{2,4}[a-z]?$/i.test(model) || found.has(href)) return;
        const text = $(a).text().replace(/\s+/g, " ").trim();
        const name = text.split(/\s+MODEL\s+/i)[0];
        if (!name) return;
        const img = $(a).find("img").first();
        found.set(href, {
          brandSlug: "atlantis",
          name: `${tidyName(name)} (${model.toUpperCase()})`,
          series: /^[cp]/i.test(model) ? "Plate-Loaded" : /^[bd]/i.test(model) ? "Precision" : undefined,
          loading: /^p/i.test(model) ? "plate" : undefined,
          url: href,
          image: img.attr("data-src") ?? img.attr("src"),
          credit: "Atlantis Strength (official catalogue)",
          context: text,
        });
      });
    }
    log("atlantis", `${found.size} products on body-part pages`);
    // Product pages share one site-wide og:image banner, so start from the listing thumbnail
    // (e.g. p140-4-416x454.png) and look up the largest size of that same photo on the product page.
    for (const raw of found.values()) {
      if (!raw.image) continue;
      const base = raw.image.split("/").pop()!.replace(/-\d+x\d+(?=\.\w+$)/, "").replace(/\.\w+$/, "");
      const html = await safe("atlantis", raw.url, () => fetchText(raw.url));
      if (!html) continue;
      const sizes = [...html.matchAll(new RegExp(`[^"'\\s(]*/${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)x\\d+\\.(?:png|jpe?g|webp)`, "gi"))]
        .map((m) => ({ url: new URL(m[0].replace(/^\/\//, "https://"), raw.url).href, width: Number(m[1]) }))
        .sort((a, b) => b.width - a.width);
      if (sizes[0]) raw.image = sizes[0].url;
    }
    return [...found.values()].filter((r) => r.image && !/og-image/i.test(r.image));
  },
};

const gym80: Source = {
  id: "gym80",
  brands: ["gym80"],
  run: async () => {
    type WpItem = { id: number; link: string; title: { rendered: string }; equipment_category: number[] };
    const CATS: Record<number, { series: string; loading: Loading }> = {
      157: { series: "Pure Kraft", loading: "plate" },
      159: { series: "Pure Kraft Strong", loading: "plate" },
      158: { series: "Plate Loaded", loading: "plate" },
      160: { series: "Sygnum", loading: "selectorized" },
      187: { series: "Sygnum Dual", loading: "selectorized" },
      163: { series: "Weight Stack", loading: "selectorized" },
      152: { series: "80Athletics", loading: "plate" },
    };
    const items = new Map<number, WpItem>();
    for (let page = 1; page <= 6; page++) {
      const batch = await safe("gym80", `page ${page}`, () =>
        fetchJson<WpItem[]>(
          `https://gym80.de/en/wp-json/wp/v2/fitness_equipment?per_page=100&page=${page}&equipment_category=${Object.keys(CATS).join(",")}&_fields=id,link,title,equipment_category`,
        ),
      );
      if (!batch?.length) break;
      batch.forEach((i) => items.set(i.id, i));
    }
    log("gym80", `${items.size} strength products in API`);
    const out: Raw[] = [];
    for (const item of items.values()) {
      const cat = item.equipment_category.map((c) => CATS[c]).find(Boolean);
      const page = await safe("gym80", item.link, async () => extractProduct(await fetchText(item.link), item.link));
      if (!page?.image || /coming-?soon/i.test(page.image)) continue;
      const title = item.title.rendered.replace(/^[\w]+\s*(&#8211;|–|-)\s*/, "");
      out.push({
        brandSlug: "gym80",
        name: tidyName(title.replace(/^(pure kraft strong|pure kraft|sygnum dual|sygnum)\s+/i, "")),
        series: cat?.series,
        loading: cat?.loading,
        url: item.link,
        image: page.image,
        credit: "gym80 (official catalogue)",
      });
    }
    return out;
  },
};

const watson: Source = {
  id: "watson",
  brands: ["watson"],
  run: async () => {
    const out = new Map<string, Raw>();
    for (let page = 1; page <= 8; page++) {
      const url = `https://gymequipment.co.uk/watson${page > 1 ? `?page=${page}` : ""}`;
      const html = await safe("watson", url, () => fetchText(url));
      if (!html) break;
      const $ = cheerio.load(html);
      let added = 0;
      $("a[href*='/watson-']").each((_, a) => {
        const href = new URL($(a).attr("href")!, url).href;
        const img = $(a).find("img").first();
        const src = img.attr("data-src") ?? img.attr("src");
        const text = $(a).text().replace(/Request price/i, "").replace(/\s+/g, " ").trim();
        if (!src || !text || out.has(href)) return;
        out.set(href, {
          brandSlug: "watson",
          name: tidyName(text.replace(/^watson\s+/i, "")),
          series: /animal/i.test(text) ? "Animal" : undefined,
          url: href,
          // The CDN signs each size; swap the listing thumbnail's token for the one the product page uses at 1280px
          image: new URL(
            src.replace(/image-factory\/[0-9a-f]+~\d+x\d+[^/]*/, "image-factory/200928903281b1b5974a44fa696d0852a0d89060~640x640@2x"),
            url,
          ).href,
          credit: "Gym Equipment UK (Watson dealer)",
          context: text,
        });
        added++;
      });
      if (!added) break;
    }
    return [...out.values()];
  },
};

const newtech: Source = {
  id: "newtech",
  brands: ["newtech"],
  run: async () => {
    const out: Raw[] = [];
    let misses = 0;
    for (let idx = 1; idx <= 260 && misses < 40; idx++) {
      const url = `http://ntws.co.kr/54/?idx=${idx}`;
      const html = await safe("newtech", url, () => fetchText(url));
      const $ = html ? cheerio.load(html) : null;
      const title = $?.('meta[property="og:title"]').attr("content")?.replace(/\s*:\s*뉴텍웰니스\s*$/, "");
      const image = $?.('meta[property="og:image"]').attr("content");
      if (!title || !image || title === "뉴텍웰니스") {
        misses++;
        continue;
      }
      misses = 0;
      const text = $!("body").text();
      const pin = /pin[- ]?load|selector|weight stack|advance/i.test(`${title} ${text.slice(0, 4000)}`);
      out.push({
        brandSlug: "newtech",
        name: tidyName(title),
        series: pin ? "Advance" : "M Torture",
        loading: pin ? "selectorized" : "plate",
        url,
        image,
        credit: "NewTech Wellness (official site)",
      });
    }
    return out;
  },
};

export const SOURCES: Source[] = [
  prime,
  hoist,
  nautilus,
  fitnessSuperstore,
  globalFitness,
  gymleco,
  panatta,
  arsenal,
  lifeFitness,
  atlantis,
  gym80,
  watson,
  newtech,
];
