import { describe, expect, it } from "vitest";
import { getCatalogue, getItem } from "@/lib/catalogue";
import { gradeFor, scoreGym, suggestAdditions } from "@/lib/gym-score";
import { GST, priceInSgd } from "@/lib/pricing";
import type { CatalogueItem, ListPrice } from "@/lib/types";

const machine = { movement: "row" as const, loading: "plate" as const, name: "Row", discontinued: false, specs: {} };
const usd = (amount: number, condition: ListPrice["condition"] = "new"): ListPrice => ({
  amount,
  currency: "USD",
  taxIncluded: 0,
  condition,
  source: "test",
  url: "https://example.com",
});

describe("Singapore pricing", () => {
  it("adds freight, margin, import premium and GST to a new listed machine", () => {
    const p = priceInSgd({ ...machine, brandSlug: "prime-fitness", listPrice: usd(5000) }, false);
    expect(p.basis).toBe("listed");
    expect(p.machine).toBe(6500);
    expect(p.margin).toBeGreaterThan(0);
    expect(p.premium).toBeGreaterThan(0);
    expect(p.gst).toBeCloseTo((p.machine + p.freight + p.margin + p.premium) * GST, -1);
    expect(p.sgd).toBeGreaterThan(p.machine * 1.5);
  });

  it("makes specialist North American imports dearer than European machines at the same list price", () => {
    const prime = priceInSgd({ ...machine, brandSlug: "prime-fitness", listPrice: usd(5000) }, false);
    const panatta = priceInSgd({ ...machine, brandSlug: "panatta", listPrice: usd(5000) }, false);
    expect(prime.sgd).toBeGreaterThan(panatta.sgd);
  });

  it("prices used machines without a distributor margin", () => {
    const p = priceInSgd({ ...machine, brandSlug: "cybex", listPrice: usd(3000, "used") }, true);
    expect(p.basis).toBe("resale");
    expect(p.margin).toBe(0);
    expect(p.premium).toBe(0);
  });

  it("removes foreign sales tax before converting", () => {
    const p = priceInSgd(
      { ...machine, brandSlug: "gymleco", listPrice: { ...usd(125000), currency: "SEK", taxIncluded: 0.25 } },
      false,
    );
    expect(p.machine).toBe(12500); // 125,000 SEK / 1.25 × 0.125
  });

  it("ignores 'call for price' placeholders and vintage estimates sit below new", () => {
    const placeholder = priceInSgd({ ...machine, brandSlug: "gymleco", listPrice: usd(70000) }, false);
    expect(placeholder.basis).toBe("estimate");
    const fresh = priceInSgd({ ...machine, brandSlug: "nebula" }, false);
    const old = priceInSgd({ ...machine, brandSlug: "nebula" }, true);
    expect(old.sgd).toBeLessThan(fresh.sgd);
  });

  it("gives every catalogue machine a plausible price", () => {
    for (const i of getCatalogue()) {
      // Single bars can be cheap; machines and sets sit far above this
      expect(i.price.sgd).toBeGreaterThan(150);
      expect(i.price.sgd).toBeLessThan(90_000);
    }
  });
});

describe("gym score", () => {
  const pick = (...slugs: string[]) => slugs.map((s) => ({ item: getItem(s) as CatalogueItem, qty: 1 }));

  it("scores an empty floor as zero", () => {
    const s = scoreGym([], 100_000);
    expect(s.total).toBe(0);
    expect(s.grade).toBe("D");
  });

  it("rates a balanced full-body floor above a one-muscle floor", () => {
    const balanced = pick(
      "hammer-iso-lateral-wide-chest",
      "hammer-iso-lateral-row",
      "panatta-super-pendulum-squat",
      "lf-signature-seated-leg-curl",
      "atlantis-standing-lateral-raise",
      "hammer-iso-lateral-front-pulldown",
      "panatta-monolith-leg-extension",
      "watson-hip-thrust",
    );
    const chestOnly = pick("hammer-iso-lateral-wide-chest", "lf-insignia-chest-press", "cybex-vr2-chest-press");
    const budget = 200_000;
    expect(scoreGym(balanced, budget).total).toBeGreaterThan(scoreGym(chestOnly, budget).total + 15);
  });

  it("zeroes the budget category and warns when over budget", () => {
    const s = scoreGym(pick("panatta-super-pendulum-squat", "hammer-iso-lateral-row"), 5_000);
    expect(s.categories.find((c) => c.key === "budget")?.value).toBe(0);
    expect(s.tips[0]).toMatch(/over budget/i);
  });

  it("penalises piling up one movement pattern", () => {
    const chest = getCatalogue().filter((i) => i.movement === "chest-press").slice(0, 6);
    const s = scoreGym(chest.map((item) => ({ item, qty: 1 })), 1_000_000);
    expect(s.penalty).toBeGreaterThan(0);
  });

  it("maps totals to grades", () => {
    expect([95, 85, 70, 55, 10].map(gradeFor)).toEqual(["S", "A", "B", "C", "D"]);
  });

  it("suggests affordable machines for the biggest gap", () => {
    const s = scoreGym(pick("hammer-iso-lateral-wide-chest"), 100_000);
    const { muscle, items } = suggestAdditions(getCatalogue(), s, 100_000 - s.spent, new Set(["hammer-iso-lateral-wide-chest"]));
    expect(muscle).not.toBeNull();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.primaryMuscles.includes(muscle!))).toBe(true);
  });
});
