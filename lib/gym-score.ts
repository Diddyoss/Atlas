import { stretchBias } from "./compare";
import { MUSCLES, type MuscleId } from "./muscles";
import type { CatalogueItem, Movement } from "./types";

export type BuildLine = { item: CatalogueItem; qty: number };

export type ScoreCategory = { key: string; label: string; weight: number; value: number; detail: string };

export type GymScore = {
  total: number;
  grade: "S" | "A" | "B" | "C" | "D";
  character: string;
  categories: ScoreCategory[];
  penalty: number;
  tips: string[];
  spent: number;
  machines: number;
  coverage: Record<MuscleId, number>;
};

/** How much each muscle matters to a serious lifter's gym */
const MUSCLE_WEIGHT: Record<MuscleId, number> = {
  chest: 1.5,
  lats: 1.5,
  quads: 1.5,
  glutes: 1.3,
  hamstrings: 1.3,
  "upper-back": 1.2,
  "front-delts": 0.9,
  "side-delts": 1.0,
  "rear-delts": 0.7,
  biceps: 0.8,
  triceps: 0.8,
  calves: 0.7,
  "upper-chest": 0.6,
  abs: 0.6,
  "lower-back": 0.6,
  traps: 0.5,
  adductors: 0.4,
  abductors: 0.4,
  obliques: 0.3,
  forearms: 0.3,
};

const PUSH = new Set<Movement>(["chest-press", "incline-press", "chest-fly", "shoulder-press", "triceps", "lateral-raise"]);
const PULL = new Set<Movement>(["pulldown", "row", "pullover", "rear-delt", "biceps"]);
const LOWER = new Set<Movement>([
  "squat",
  "hack-squat",
  "pendulum-squat",
  "leg-press",
  "leg-extension",
  "leg-curl",
  "hip-thrust",
  "abduction",
  "calf",
]);
/** Patterns a well-rounded strength floor should have */
const CORE_PATTERNS: Movement[] = [
  "chest-press",
  "incline-press",
  "chest-fly",
  "shoulder-press",
  "lateral-raise",
  "rear-delt",
  "pulldown",
  "row",
  "leg-press",
  "hack-squat",
  "leg-extension",
  "leg-curl",
  "hip-thrust",
  "calf",
  "biceps",
  "triceps",
];
const BIG_MUSCLES: MuscleId[] = ["chest", "lats", "quads", "glutes", "hamstrings", "upper-back"];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function gradeFor(total: number): GymScore["grade"] {
  if (total >= 90) return "S";
  if (total >= 80) return "A";
  if (total >= 65) return "B";
  if (total >= 50) return "C";
  return "D";
}

export function scoreGym(lines: BuildLine[], budget: number): GymScore {
  const units = lines.flatMap((l) => Array.from({ length: l.qty }, () => l.item));
  const spent = units.reduce((s, i) => s + i.price.sgd, 0);
  const n = units.length;

  // Coverage: a primary mover counts fully, a secondary mover partly
  const coverage = Object.fromEntries(Object.keys(MUSCLE_WEIGHT).map((m) => [m, 0])) as Record<MuscleId, number>;
  for (const i of units) {
    for (const m of i.secondaryMuscles) coverage[m] = Math.max(coverage[m], 0.35);
    for (const m of i.primaryMuscles) coverage[m] = 1;
  }
  const totalWeight = Object.values(MUSCLE_WEIGHT).reduce((a, b) => a + b, 0);
  const coverageScore =
    (Object.entries(MUSCLE_WEIGHT) as [MuscleId, number][]).reduce((s, [m, w]) => s + w * coverage[m], 0) / totalWeight;

  // Balance: push vs pull, and a healthy share of lower-body machines (~40%)
  const push = units.filter((i) => PUSH.has(i.movement)).length;
  const pull = units.filter((i) => PULL.has(i.movement)).length;
  const lower = units.filter((i) => LOWER.has(i.movement)).length;
  const pushPull = push + pull === 0 ? 0 : 1 - Math.min(1, Math.abs(Math.log((push + 0.5) / (pull + 0.5))) / Math.log(3));
  const lowerShare = n ? lower / n : 0;
  const lowerScore = n ? 1 - Math.min(1, Math.abs(lowerShare - 0.4) / 0.4) : 0;
  const balanceScore = n ? 0.5 * pushPull + 0.5 * lowerScore : 0;

  // Variety: core movement patterns present, plus a mix of loading types
  const patterns = new Set(units.map((i) => i.movement));
  const corePresent = CORE_PATTERNS.filter((p) => patterns.has(p)).length;
  const loadings = new Set(units.map((i) => i.loading)).size;
  const varietyScore = n ? 0.8 * Math.sqrt(corePresent / CORE_PATTERNS.length) + 0.2 * Math.min(1, loadings / 3) : 0;

  // Quality: build, smoothness and ergonomics on a 5–10 scale
  const quality = n
    ? units.reduce((s, i) => s + (i.feel.build + i.feel.smoothness + i.feel.ergonomics) / 3, 0) / n
    : 0;
  const qualityScore = n ? clamp01((quality - 5) / 4.5) : 0;

  // Resistance profiles: stretch-loaded options for the big muscles and a mix of curve shapes
  const stretchCovered = BIG_MUSCLES.filter((m) =>
    units.some((i) => i.primaryMuscles.includes(m) && stretchBias(i.resistanceProfile.curve) >= 6),
  ).length;
  const shapes = new Set(units.map((i) => i.resistanceProfile.shape)).size;
  const profileScore = n ? 0.7 * (stretchCovered / BIG_MUSCLES.length) + 0.3 * Math.min(1, shapes / 4) : 0;

  // Budget: spending most of it well is rewarded; going over is not allowed
  const used = budget > 0 ? spent / budget : 0;
  const budgetScore = spent > budget ? 0 : n ? clamp01(used / 0.85) : 0;

  // Accessibility for members who aren't seasoned lifters
  const access = n ? units.reduce((s, i) => s + (i.accessibility.beginner + i.accessibility.entry) / 2, 0) / n : 0;
  const accessScore = n ? clamp01((access - 4) / 5) : 0;

  const categories: ScoreCategory[] = [
    { key: "coverage", label: "Muscle coverage", weight: 30, value: coverageScore, detail: `${Object.values(coverage).filter((c) => c === 1).length}/20 muscles trained directly` },
    { key: "balance", label: "Balance", weight: 15, value: balanceScore, detail: `Push ${push} · Pull ${pull} · Lower ${lower}` },
    { key: "variety", label: "Variety", weight: 15, value: varietyScore, detail: `${corePresent}/${CORE_PATTERNS.length} core patterns · ${loadings} loading types` },
    { key: "quality", label: "Build & feel", weight: 15, value: qualityScore, detail: n ? `Average ${quality.toFixed(1)}/10` : "—" },
    { key: "profiles", label: "Resistance profiles", weight: 10, value: profileScore, detail: `${stretchCovered}/${BIG_MUSCLES.length} big muscles stretch-loaded · ${shapes} curve shapes` },
    { key: "budget", label: "Budget use", weight: 10, value: budgetScore, detail: budget ? `${Math.round(used * 100)}% spent` : "—" },
    { key: "access", label: "Accessibility", weight: 5, value: accessScore, detail: n ? `Average ${access.toFixed(1)}/10` : "—" },
  ];

  // Redundancy: more than three machines of one pattern adds little
  const perPattern = new Map<Movement, number>();
  for (const i of units) perPattern.set(i.movement, (perPattern.get(i.movement) ?? 0) + 1);
  const penalty = Math.min(10, [...perPattern.values()].reduce((s, c) => s + Math.max(0, c - 3), 0) * 2);

  const raw = categories.reduce((s, c) => s + c.weight * c.value, 0);
  const total = Math.max(0, Math.round(raw - penalty));

  return {
    total,
    grade: gradeFor(total),
    character: characterOf(units),
    categories,
    penalty,
    tips: tipsFor({ units, coverage, push, pull, lowerShare, stretchCovered, spent, budget, perPattern }),
    spent,
    machines: n,
    coverage,
  };
}

function characterOf(units: CatalogueItem[]): string {
  const n = units.length;
  if (!n) return "Empty warehouse";
  const share = (f: (i: CatalogueItem) => boolean) => units.filter(f).length / n;
  if (share((i) => i.vintage) >= 0.5) return "Golden-era museum";
  if (share((i) => i.loading === "bench-rack" || i.movement === "squat") >= 0.4) return "Powerlifting dungeon";
  if (share((i) => ["hip-thrust", "abduction"].includes(i.movement)) >= 0.3) return "Glute lab";
  if (share((i) => i.loading === "plate") >= 0.6) return "Plate-loaded bodybuilding temple";
  if (share((i) => i.loading === "selectorized") >= 0.6) return "Pin-loaded commercial floor";
  if (share((i) => i.accessibility.beginner >= 8) >= 0.7) return "Beginner-friendly studio";
  return "Well-rounded strength gym";
}

function tipsFor(s: {
  units: CatalogueItem[];
  coverage: Record<MuscleId, number>;
  push: number;
  pull: number;
  lowerShare: number;
  stretchCovered: number;
  spent: number;
  budget: number;
  perPattern: Map<Movement, number>;
}): string[] {
  const tips: string[] = [];
  if (!s.units.length) return ["Pick a budget, then start adding machines from the list."];
  if (s.spent > s.budget) tips.push("You're over budget. Remove something or raise the budget.");
  const missing = (Object.keys(MUSCLE_WEIGHT) as MuscleId[])
    .filter((m) => MUSCLE_WEIGHT[m] >= 0.7 && s.coverage[m] < 1)
    .sort((a, b) => MUSCLE_WEIGHT[b] - MUSCLE_WEIGHT[a]);
  if (missing.length) tips.push(`Nothing trains ${missing.slice(0, 3).map((m) => MUSCLES[m].label.toLowerCase()).join(", ")} directly yet.`);
  if (s.push > s.pull * 1.6) tips.push("Heavy on pushing: add a row or pulldown.");
  else if (s.pull > s.push * 1.6) tips.push("Heavy on pulling: add a press or fly.");
  if (s.lowerShare < 0.25 && s.units.length >= 4) tips.push("Legs are under-served: a leg press, hack squat or pendulum would help.");
  if (s.lowerShare > 0.6 && s.units.length >= 4) tips.push("Mostly leg machines: upper body needs more love.");
  if (s.stretchCovered < 3 && s.units.length >= 4) tips.push("Few stretch-loaded machines: pendulums, pullovers and seated curls load muscles where they grow best.");
  for (const [m, c] of s.perPattern) if (c > 3) tips.push(`${c} machines for the same pattern (${m.replace("-", " ")}): diminishing returns.`);
  const left = s.budget - s.spent;
  if (left > 0 && left / s.budget > 0.2) tips.push(`S$${Math.round(left).toLocaleString("en-US")} still unspent.`);
  return tips.slice(0, 5);
}

/** Cheapest well-built machines that fill the most important gap within the remaining budget */
export function suggestAdditions(catalogue: CatalogueItem[], score: GymScore, remaining: number, inBuild: Set<string>, count = 3) {
  const gap = (Object.keys(MUSCLE_WEIGHT) as MuscleId[])
    .filter((m) => score.coverage[m] < 1)
    .sort((a, b) => MUSCLE_WEIGHT[b] - MUSCLE_WEIGHT[a])[0];
  if (!gap) return { muscle: null, items: [] as CatalogueItem[] };
  const items = catalogue
    .filter((i) => !inBuild.has(i.slug) && i.primaryMuscles.includes(gap) && i.price.sgd <= remaining && i.images.length)
    .sort((a, b) => (b.feel.build + b.feel.smoothness) / b.price.sgd - (a.feel.build + a.feel.smoothness) / a.price.sgd)
    .slice(0, count);
  return { muscle: gap, items };
}
