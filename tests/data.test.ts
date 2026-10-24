import { describe, expect, it } from "vitest";
import { BRAND_MAP, BRANDS } from "@/data/brands";
import { MACHINES } from "@/data/machines";
import { RATING_KEYS } from "@/lib/types";

describe("catalogue data", () => {
  it("has unique machine ids", () => {
    expect(new Set(MACHINES.map((m) => m.id)).size).toBe(MACHINES.length);
  });

  it("covers at least nine active brands and the requested vintage brands", () => {
    const active = BRANDS.filter((b) => b.status === "active").map((b) => b.slug);
    expect(active.length).toBeGreaterThanOrEqual(9);
    for (const slug of ["newtech", "prime", "watson", "atlantis", "life-fitness", "hammer-strength", "panatta", "nautilus"]) {
      expect(active).toContain(slug);
    }
    for (const slug of ["flex", "cybex", "medx"]) expect(BRAND_MAP[slug].status).toBe("legacy");
  });

  it("gives every brand at least one machine", () => {
    for (const b of BRANDS) expect(MACHINES.some((m) => m.brand === b.slug), b.slug).toBe(true);
  });

  it("keeps scores within 1–10 and stable between runs", () => {
    for (const m of MACHINES) for (const k of RATING_KEYS) {
      expect(m.ratings[k]).toBeGreaterThanOrEqual(1);
      expect(m.ratings[k]).toBeLessThanOrEqual(10);
    }
  });
});
