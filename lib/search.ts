import Fuse from "fuse.js";
import { MUSCLES, type MuscleId } from "./muscles";
import { MOVEMENT_LABELS, type CatalogueItem, type Loading, type Movement } from "./types";

export type VintageMode = "all" | "only" | "exclude";

export type Filters = {
  q: string;
  brands: string[];
  muscles: MuscleId[];
  movements: Movement[];
  loading: Loading[];
  iso: boolean;
  /** Hide machines whose profile is estimated from the movement type */
  reviewed: boolean;
  /** Only match primary muscles when filtering by muscle */
  primaryOnly: boolean;
  vintage: VintageMode;
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  brands: [],
  muscles: [],
  movements: [],
  loading: [],
  iso: false,
  reviewed: false,
  primaryOnly: false,
  vintage: "all",
};

export function createIndex(items: CatalogueItem[]) {
  return new Fuse(
    items.map((i) => ({
      item: i,
      name: i.name,
      brand: i.brand.name,
      series: i.series ?? "",
      aliases: i.aliases,
      movement: MOVEMENT_LABELS[i.movement],
      muscles: [...i.primaryMuscles, ...i.secondaryMuscles].map((m) => MUSCLES[m].label),
    })),
    {
      keys: [
        { name: "name", weight: 3 },
        { name: "brand", weight: 2 },
        { name: "aliases", weight: 2 },
        { name: "series", weight: 1 },
        { name: "movement", weight: 1.5 },
        { name: "muscles", weight: 1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    },
  );
}

type Index = ReturnType<typeof createIndex>;

export function filterItems(items: CatalogueItem[], f: Filters, index?: Index): CatalogueItem[] {
  let pool = items;
  const q = f.q.trim();
  if (q) pool = (index ?? createIndex(items)).search(q).map((r) => r.item.item);

  return pool.filter((i) => {
    if (f.vintage === "only" && !i.vintage) return false;
    if (f.vintage === "exclude" && i.vintage) return false;
    if (f.brands.length && !f.brands.includes(i.brandSlug)) return false;
    if (f.movements.length && !f.movements.includes(i.movement)) return false;
    if (f.loading.length && !f.loading.includes(i.loading)) return false;
    if (f.iso && !i.isoLateral) return false;
    if (f.reviewed && i.estimated) return false;
    if (f.muscles.length) {
      const worked = f.primaryOnly ? i.primaryMuscles : [...i.primaryMuscles, ...i.secondaryMuscles];
      if (!f.muscles.some((m) => worked.includes(m))) return false;
    }
    return true;
  });
}

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export function filtersFromParams(p: URLSearchParams, base: Partial<Filters> = {}): Filters {
  const vintage = p.get("vintage");
  return {
    ...EMPTY_FILTERS,
    ...base,
    q: p.get("q") ?? "",
    brands: list(p.get("brand")),
    muscles: list(p.get("muscle")) as MuscleId[],
    movements: list(p.get("movement")) as Movement[],
    loading: list(p.get("loading")) as Loading[],
    iso: p.get("iso") === "1",
    reviewed: p.get("reviewed") === "1",
    primaryOnly: p.get("primary") === "1",
    vintage: vintage === "only" || vintage === "exclude" ? vintage : (base.vintage ?? "all"),
  };
}

export function filtersToParams(f: Filters, base: Partial<Filters> = {}): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.brands.length) p.set("brand", f.brands.join(","));
  if (f.muscles.length) p.set("muscle", f.muscles.join(","));
  if (f.movements.length) p.set("movement", f.movements.join(","));
  if (f.loading.length) p.set("loading", f.loading.join(","));
  if (f.iso) p.set("iso", "1");
  if (f.reviewed) p.set("reviewed", "1");
  if (f.primaryOnly) p.set("primary", "1");
  if (f.vintage !== (base.vintage ?? "all")) p.set("vintage", f.vintage);
  return p;
}
