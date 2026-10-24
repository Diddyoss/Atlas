import { fetchJson, fetchText } from "./http";
import { extractProduct } from "./extract";
import type { Equipment } from "../../lib/types";

export type Found = { image: string; credit: string; sourceUrl: string };

/**
 * 1. Third-party pages already linked in the curated `sources` (dealers, resellers): use their hero image.
 * 2. Wikimedia Commons: openly licensed photos, which suits vintage machines best.
 */
export async function findFallbackImage(item: Equipment, brandName: string): Promise<Found | null> {
  for (const s of item.sources) {
    try {
      const page = extractProduct(await fetchText(s.url), s.url);
      if (page.image) return { image: page.image, credit: s.label, sourceUrl: s.url };
    } catch (e) {
      console.warn(`    source ${s.url}: ${(e as Error).message}`);
    }
  }
  // Commons rarely has these machines and name-only matches pick up unrelated photos, so it's opt-in
  if (!process.argv.includes("--wikimedia")) return null;
  return wikimedia(`${brandName.replace(/\(.*\)/, "").trim()} ${item.name}`, brandName);
}

type CommonsResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title: string;
        imageinfo?: {
          url: string;
          descriptionurl: string;
          extmetadata?: { Artist?: { value: string }; LicenseShortName?: { value: string } };
        }[];
      }
    >;
  };
};

async function wikimedia(query: string, brandName: string): Promise<Found | null> {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1200",
  }).toString();
  try {
    const data = await fetchJson<CommonsResponse>(api.href);
    const brandToken = brandName.split(/\s/)[0].toLowerCase();
    const hit = Object.values(data.query?.pages ?? {}).find(
      (p) => p.imageinfo?.[0] && p.title.toLowerCase().includes(brandToken) && /\.(jpe?g|png|webp)$/i.test(p.title),
    );
    const info = hit?.imageinfo?.[0];
    if (!info) return null;
    const artist = info.extmetadata?.Artist?.value.replace(/<[^>]+>/g, "").trim() || "Unknown";
    const license = info.extmetadata?.LicenseShortName?.value ?? "see source";
    return { image: info.url, credit: `${artist} · ${license} · Wikimedia Commons`, sourceUrl: info.descriptionurl };
  } catch (e) {
    console.warn(`    wikimedia: ${(e as Error).message}`);
    return null;
  }
}
