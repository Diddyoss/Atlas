import { describe, expect, it } from "vitest";
import { MACHINES } from "@/data/machines";
import { applyFilters, EMPTY_FILTERS, filtersToParams, paramsToFilters, type Filters } from "@/lib/search";

const run = (f: Partial<Filters>) => applyFilters(MACHINES, { ...EMPTY_FILTERS, ...f });

describe("search", () => {
  it("finds machines by name", () => {
    const r = run({ q: "pendulum" });
    expect(r.length).toBeGreaterThanOrEqual(5);
    expect(r.every((m) => m.name.toLowerCase().includes("pendulum"))).toBe(true);
  });

  it("finds machines by brand plus name", () => {
    expect(run({ q: "hammer incline" }).map((m) => m.id)).toEqual(["hammer-strength-iso-lateral-incline-press"]);
  });

  it("understands gym slang for muscles", () => {
    const r = run({ q: "hammies" });
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].primary).toContain("hamstrings");
  });

  it("requires every token to match", () => {
    expect(run({ q: "pendulum zzzz" })).toHaveLength(0);
  });

  it("ranks dedicated machines first when filtering by muscle", () => {
    const r = run({ muscles: ["glutes"] });
    expect(r[0].movement).toBe("hip-thrust");
  });

  it("hides vintage machines unless asked", () => {
    expect(run({}).some((m) => m.brand === "medx")).toBe(false);
    expect(run({ era: "legacy" }).every((m) => ["nautilus-classic", "medx", "cybex", "flex", "icarian"].includes(m.brand))).toBe(true);
  });

  it("round-trips filters through URL params", () => {
    const f: Filters = { ...EMPTY_FILTERS, q: "row", brands: ["panatta"], muscles: ["lats"], loads: ["plate-loaded"], unilateral: true, sort: "feel" };
    expect(paramsToFilters(filtersToParams(f))).toEqual(f);
  });
});
