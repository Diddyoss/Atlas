import { describe, expect, it } from "vitest";
import { buildCatalogue, getCatalogue, mergeScraped } from "@/lib/catalogue";
import { bestIndexes, parseCompareIds, rowDiffers, stretchBias } from "@/lib/compare";
import { EMPTY_FILTERS, filterItems, filtersFromParams, filtersToParams } from "@/lib/search";
import { createRateLimiter, VoteSchema } from "@/lib/votes";
import { inferShape, CURVES } from "@/data/define";
import type { Brand, Equipment } from "@/lib/types";

const items = getCatalogue();

describe("search and filters", () => {
  it("finds pendulum squats by fuzzy name", () => {
    const r = filterItems(items, { ...EMPTY_FILTERS, q: "pendulum" });
    expect(r.length).toBeGreaterThanOrEqual(4);
    expect(r.every((i) => /pendulum/i.test(i.name) || i.movement === "pendulum-squat")).toBe(true);
  });

  it("filters by brand", () => {
    const r = filterItems(items, { ...EMPTY_FILTERS, brands: ["panatta"] });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((i) => i.brandSlug === "panatta")).toBe(true);
  });

  it("filters by muscle, optionally primary movers only", () => {
    const any = filterItems(items, { ...EMPTY_FILTERS, muscles: ["glutes"] });
    const primary = filterItems(items, { ...EMPTY_FILTERS, muscles: ["glutes"], primaryOnly: true });
    expect(primary.length).toBeLessThan(any.length);
    expect(primary.every((i) => i.primaryMuscles.includes("glutes"))).toBe(true);
  });

  it("scopes vintage only/exclude", () => {
    const only = filterItems(items, { ...EMPTY_FILTERS, vintage: "only" });
    const current = filterItems(items, { ...EMPTY_FILTERS, vintage: "exclude" });
    expect(only.every((i) => i.vintage)).toBe(true);
    expect(current.some((i) => i.vintage)).toBe(false);
    expect(only.length + current.length).toBe(items.length);
    // Discontinued lines from active brands still count as vintage
    expect(only.some((i) => i.brandSlug === "nautilus")).toBe(true);
  });

  it("round-trips filters through URL params", () => {
    const f = { ...EMPTY_FILTERS, q: "row", brands: ["hammer-strength"], muscles: ["lats" as const], iso: true };
    expect(filtersFromParams(filtersToParams(f))).toEqual(f);
  });
});

describe("merge rule", () => {
  const brand: Brand = { slug: "b", name: "B", country: "X", founded: 2000, status: "active", blurb: "", signature: "" };
  const base = { ...items[0], brandSlug: "b", images: [], specs: { maxLoad: "100 kg" }, sources: [] } as Equipment;

  it("lets curated fields win and fills gaps from scraped data", () => {
    const merged = mergeScraped(base, {
      slug: base.slug,
      images: [{ src: "/x.webp", credit: "B", sourceUrl: "https://b.example/x" }],
      specs: { maxLoad: "999 kg", weightKg: 50 },
      sources: [{ label: "B", url: "https://b.example/x" }],
    });
    expect(merged.specs.maxLoad).toBe("100 kg");
    expect(merged.specs.weightKg).toBe(50);
    expect(merged.images).toHaveLength(1);
    expect(merged.sources).toHaveLength(1);
  });

  it("keeps curated images over scraped ones", () => {
    const withImg = { ...base, images: [{ src: "/curated.webp", credit: "me", sourceUrl: "https://a.example" }] };
    const merged = mergeScraped(withImg, { slug: base.slug, images: [{ src: "/s.webp", credit: "s", sourceUrl: "https://s.example" }] });
    expect(merged.images[0].src).toBe("/curated.webp");
  });

  it("marks items from defunct brands as vintage", () => {
    const [c] = buildCatalogue([{ ...brand, status: "defunct" }], [base], []);
    expect(c.vintage).toBe(true);
  });
});

describe("compare helpers", () => {
  it("picks the best value per row, including ties", () => {
    expect(bestIndexes({ values: [7, 9, 9, 3], better: "high" })).toEqual([1, 2]);
    expect(bestIndexes({ values: [15, 5, 40], better: "low" })).toEqual([1]);
    expect(bestIndexes({ values: [8, 8], better: "high" })).toEqual([]);
    expect(bestIndexes({ values: [8, 9] })).toEqual([]);
  });

  it("detects rows that differ", () => {
    expect(rowDiffers({ values: ["Plate", "Plate"] })).toBe(false);
    expect(rowDiffers({ values: ["Plate", "Cable"] })).toBe(true);
  });

  it("caps and dedupes compare ids", () => {
    expect(parseCompareIds("a,b,a,c,d,e")).toEqual(["a", "b", "c", "d"]);
  });

  it("computes stretch bias and curve shapes", () => {
    expect(stretchBias([...CURVES.stretch])).toBeGreaterThan(0);
    expect(stretchBias([...CURVES.ascending])).toBeLessThan(0);
    expect(inferShape([...CURVES.bell])).toBe("bell");
    expect(inferShape([...CURVES.flat])).toBe("flat");
  });
});

describe("vote validation", () => {
  it("accepts favorites and complete ratings", () => {
    expect(VoteSchema.safeParse({ action: "favorite", slug: "x" }).success).toBe(true);
    const feel = { smoothness: 5, stability: 5, stretch: 5, rom: 5, ergonomics: 5, build: 5 };
    expect(VoteSchema.safeParse({ action: "rate", slug: "x", feel }).success).toBe(true);
  });

  it("rejects out-of-range or partial ratings", () => {
    expect(VoteSchema.safeParse({ action: "rate", slug: "x", feel: { smoothness: 11 } }).success).toBe(false);
    expect(VoteSchema.safeParse({ action: "delete", slug: "x" }).success).toBe(false);
  });

  it("rate-limits per voter", () => {
    const allow = createRateLimiter(2, 1000);
    expect([allow("v", 0), allow("v", 10), allow("v", 20), allow("w", 20), allow("v", 1500)]).toEqual([
      true,
      true,
      false,
      true,
      true,
    ]);
  });
});
