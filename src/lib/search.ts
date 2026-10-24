import { BRAND_MAP } from "@/data/brands";
import { LOAD_LABELS, MOVEMENT_LABELS, MUSCLE_LABELS, type LoadType, type Machine, type Movement, type Muscle } from "./types";

/** Gym slang → muscles, so "hammies" or "pecs" finds the right machines. */
const SYNONYMS: Record<string, Muscle[]> = {
  pec: ["chest", "upper-chest"],
  pecs: ["chest", "upper-chest"],
  chest: ["chest", "upper-chest"],
  delt: ["front-delts", "side-delts", "rear-delts"],
  delts: ["front-delts", "side-delts", "rear-delts"],
  shoulder: ["front-delts", "side-delts", "rear-delts"],
  shoulders: ["front-delts", "side-delts", "rear-delts"],
  back: ["lats", "upper-back", "lower-back", "traps"],
  lat: ["lats"],
  lats: ["lats"],
  bis: ["biceps"],
  bicep: ["biceps"],
  tris: ["triceps"],
  tricep: ["triceps"],
  arms: ["biceps", "triceps", "forearms"],
  legs: ["quads", "hamstrings", "glutes", "calves", "adductors", "abductors"],
  leg: ["quads", "hamstrings", "glutes", "calves"],
  quad: ["quads"],
  hammies: ["hamstrings"],
  hamstring: ["hamstrings"],
  glute: ["glutes"],
  booty: ["glutes"],
  butt: ["glutes"],
  core: ["abs", "obliques", "lower-back"],
  abs: ["abs"],
  calf: ["calves"],
  traps: ["traps"],
};

export type Era = "active" | "legacy" | "all";
export type SortKey = "relevance" | "name" | "brand" | "feel" | "smoothness" | "accessibility";

export interface Filters {
  q: string;
  brands: string[];
  muscles: Muscle[];
  movements: Movement[];
  loads: LoadType[];
  era: Era;
  unilateral: boolean;
  sort: SortKey;
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  brands: [],
  muscles: [],
  movements: [],
  loads: [],
  era: "active",
  unilateral: false,
  sort: "relevance",
};

function haystack(m: Machine): string {
  const b = BRAND_MAP[m.brand];
  return [
    m.name,
    b.name,
    m.line ?? "",
    MOVEMENT_LABELS[m.movement],
    LOAD_LABELS[m.load],
    ...m.primary.map((x) => MUSCLE_LABELS[x]),
    ...m.secondary.map((x) => MUSCLE_LABELS[x]),
    m.unilateral ? "iso-lateral unilateral independent arms" : "",
  ]
    .join(" ")
    .toLowerCase();
}

/** Relevance score for a free-text query; 0 means no match. */
export function scoreQuery(m: Machine, q: string): number {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 1;
  const hay = haystack(m);
  const name = m.name.toLowerCase();
  const brand = BRAND_MAP[m.brand].name.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    let s = 0;
    if (name.includes(t)) s += 5;
    if (brand.includes(t)) s += 4;
    const syn = SYNONYMS[t];
    if (syn) {
      if (m.primary.some((x) => syn.includes(x))) s += 4;
      else if (m.secondary.some((x) => syn.includes(x))) s += 1.5;
    }
    if (s === 0 && hay.includes(t)) s += 2;
    if (s === 0) return 0; // every token must match something
    score += s;
  }
  return score;
}

export function applyFilters(machines: Machine[], f: Filters): Machine[] {
  const scored: { m: Machine; s: number }[] = [];
  for (const m of machines) {
    const status = BRAND_MAP[m.brand].status;
    if (f.era !== "all" && status !== f.era) continue;
    if (f.brands.length && !f.brands.includes(m.brand)) continue;
    if (f.loads.length && !f.loads.includes(m.load)) continue;
    if (f.movements.length && !f.movements.includes(m.movement)) continue;
    if (f.muscles.length && !f.muscles.some((x) => m.primary.includes(x) || m.secondary.includes(x))) continue;
    if (f.unilateral && !m.unilateral) continue;
    const s = scoreQuery(m, f.q);
    if (s === 0) continue;
    // Primary-muscle hits outrank secondary ones when filtering by muscle.
    // A machine whose main target is the muscle (hip thrust for glutes) beats a compound lift.
    const mainTarget = f.muscles.includes(m.primary[0]);
    const muscleBoost =
      f.muscles.filter((x) => m.primary.includes(x)).length * 2 + (mainTarget ? 1 : 0) + (mainTarget && m.primary.length === 1 ? 1 : 0);
    scored.push({ m, s: s + muscleBoost });
  }
  const by: Record<SortKey, (a: { m: Machine; s: number }, b: { m: Machine; s: number }) => number> = {
    relevance: (a, b) => b.s - a.s || a.m.name.localeCompare(b.m.name),
    name: (a, b) => a.m.name.localeCompare(b.m.name),
    brand: (a, b) => BRAND_MAP[a.m.brand].name.localeCompare(BRAND_MAP[b.m.brand].name) || a.m.name.localeCompare(b.m.name),
    feel: (a, b) => b.m.ratings.feel - a.m.ratings.feel,
    smoothness: (a, b) => b.m.ratings.smoothness - a.m.ratings.smoothness,
    accessibility: (a, b) => b.m.ratings.accessibility - a.m.ratings.accessibility,
  };
  return scored.sort(by[f.sort]).map((x) => x.m);
}

const LIST_KEYS = ["brands", "muscles", "movements", "loads"] as const;

export function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  for (const k of LIST_KEYS) if (f[k].length) p.set(k, f[k].join(","));
  if (f.era !== EMPTY_FILTERS.era) p.set("era", f.era);
  if (f.unilateral) p.set("uni", "1");
  if (f.sort !== EMPTY_FILTERS.sort) p.set("sort", f.sort);
  return p;
}

export function paramsToFilters(p: URLSearchParams): Filters {
  const list = (k: string) => (p.get(k) ?? "").split(",").filter(Boolean);
  const era = p.get("era");
  return {
    q: p.get("q") ?? "",
    brands: list("brands"),
    muscles: list("muscles") as Muscle[],
    movements: list("movements") as Movement[],
    loads: list("loads") as LoadType[],
    era: era === "legacy" || era === "all" ? era : "active",
    unilateral: p.get("uni") === "1",
    sort: (p.get("sort") as SortKey) ?? "relevance",
  };
}
