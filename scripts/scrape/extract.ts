import * as cheerio from "cheerio";

export type PageInfo = { url: string; name?: string; image?: string; description?: string };

const clean = (s?: string) => s?.replace(/\s+/g, " ").trim() || undefined;

/** Pull product name, hero image and description from a product page using OpenGraph first, then markup. */
export function extractProduct(html: string, pageUrl: string): PageInfo {
  const $ = cheerio.load(html);
  const meta = (p: string) => $(`meta[property="${p}"], meta[name="${p}"]`).attr("content");
  const abs = (src?: string) => {
    if (!src) return undefined;
    try {
      return new URL(src, pageUrl).href;
    } catch {
      return undefined;
    }
  };

  let image = abs(meta("og:image") ?? meta("twitter:image"));
  if (!image) {
    const candidate = $("main img, article img, .product img, img")
      .toArray()
      .map((el) => $(el).attr("data-src") ?? $(el).attr("src"))
      .find((src) => src && !/logo|icon|sprite|placeholder|\.svg/i.test(src));
    image = abs(candidate);
  }

  return {
    url: abs($('link[rel="canonical"]').attr("href")) ?? pageUrl,
    name: clean($("h1").first().text()) ?? clean(meta("og:title")) ?? clean($("title").text()),
    image,
    description: clean(meta("og:description") ?? meta("description")),
  };
}

/** Collect same-site links that look like product pages. */
export function extractLinks(html: string, pageUrl: string, pattern: RegExp): string[] {
  const $ = cheerio.load(html);
  const origin = new URL(pageUrl).origin;
  const out = new Set<string>();
  $("a[href]").each((_, el) => {
    try {
      const u = new URL($(el).attr("href")!, pageUrl);
      u.hash = "";
      if (u.origin === origin && pattern.test(u.pathname)) out.add(u.href);
    } catch {
      // ignore malformed hrefs
    }
  });
  return [...out];
}
