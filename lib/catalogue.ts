import brandsJson from "@/data/brands.json";
import scrapedJson from "@/data/scraped/index.json";
import { curated } from "@/data/equipment";
import type { Brand, CatalogueItem, Equipment, Scraped } from "./types";

/** Curated fields always win; scraped data only fills gaps. */
export function mergeScraped(item: Equipment, scraped: Scraped | undefined): Equipment {
  if (!scraped) return item;
  const specs = { ...item.specs };
  for (const [key, value] of Object.entries(scraped.specs ?? {})) {
    const k = key as keyof typeof specs;
    if (specs[k] === undefined && value !== undefined) (specs as Record<string, unknown>)[k] = value;
  }
  const sources = [...item.sources];
  for (const s of scraped.sources ?? []) {
    if (!sources.some((x) => x.url === s.url)) sources.push(s);
  }
  return {
    ...item,
    specs,
    sources,
    images: item.images.length > 0 ? item.images : scraped.images,
  };
}

export function isVintage(item: Pick<Equipment, "discontinued">, brand: Pick<Brand, "status">) {
  return brand.status === "defunct" || item.discontinued;
}

export function buildCatalogue(brands: Brand[], items: Equipment[], scraped: Scraped[]): CatalogueItem[] {
  const brandMap = new Map(brands.map((b) => [b.slug, b]));
  const scrapedMap = new Map(scraped.map((s) => [s.slug, s]));
  return items.map((raw) => {
    const brand = brandMap.get(raw.brandSlug);
    if (!brand) throw new Error(`Unknown brand "${raw.brandSlug}" on ${raw.slug}`);
    const item = mergeScraped(raw, scrapedMap.get(raw.slug));
    return {
      ...item,
      brand: { slug: brand.slug, name: brand.name, status: brand.status, country: brand.country },
      vintage: isVintage(item, brand),
    };
  });
}

const brands = brandsJson as Brand[];
const catalogue = buildCatalogue(brands, curated, scrapedJson as Scraped[]);
const bySlug = new Map(catalogue.map((i) => [i.slug, i]));

export const getBrands = () => brands;
export const getBrand = (slug: string) => brands.find((b) => b.slug === slug);
export const getCatalogue = () => catalogue;
export const getItem = (slug: string) => bySlug.get(slug);
export const getItemsByBrand = (slug: string) => catalogue.filter((i) => i.brandSlug === slug);
