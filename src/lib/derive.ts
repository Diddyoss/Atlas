import type { LoadType, Movement, Ratings, Specs } from "./types";

/** Deterministic 0–1 hash so derived values are stable between builds. */
export function hash01(input: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967295;
}

interface MovementBase {
  weightKg: number;
  dims: [number, number, number];
  maxLoadKg: number;
  stackKg: number;
  start: number;
  adjustments: string[];
  footprint: number;
  accessibility: number;
}

const BASE: Record<Movement, MovementBase> = {
  "chest-press": { weightKg: 210, dims: [180, 170, 190], maxLoadKg: 300, stackKg: 100, start: 9, adjustments: ["Seat height", "Start position"], footprint: 6.5, accessibility: 8 },
  "incline-press": { weightKg: 220, dims: [190, 170, 200], maxLoadKg: 300, stackKg: 100, start: 10, adjustments: ["Seat height"], footprint: 6, accessibility: 7.5 },
  fly: { weightKg: 230, dims: [140, 150, 210], maxLoadKg: 150, stackKg: 110, start: 5, adjustments: ["Seat height", "Arm start position"], footprint: 7, accessibility: 8 },
  "shoulder-press": { weightKg: 200, dims: [170, 160, 190], maxLoadKg: 250, stackKg: 90, start: 8, adjustments: ["Seat height"], footprint: 6.8, accessibility: 7.8 },
  "lateral-raise": { weightKg: 180, dims: [140, 140, 160], maxLoadKg: 120, stackKg: 70, start: 4, adjustments: ["Seat height", "Arm pad position"], footprint: 7.2, accessibility: 7 },
  "rear-delt": { weightKg: 220, dims: [140, 150, 210], maxLoadKg: 120, stackKg: 100, start: 5, adjustments: ["Seat height", "Arm start position"], footprint: 7, accessibility: 7.6 },
  pulldown: { weightKg: 240, dims: [170, 160, 230], maxLoadKg: 300, stackKg: 120, start: 8, adjustments: ["Seat height", "Thigh pad"], footprint: 6.5, accessibility: 8 },
  row: { weightKg: 220, dims: [190, 160, 170], maxLoadKg: 300, stackKg: 110, start: 8, adjustments: ["Seat height", "Chest pad depth"], footprint: 6.2, accessibility: 7.8 },
  pullover: { weightKg: 260, dims: [150, 150, 190], maxLoadKg: 150, stackKg: 100, start: 6, adjustments: ["Seat height"], footprint: 6.6, accessibility: 6 },
  shrug: { weightKg: 150, dims: [140, 120, 140], maxLoadKg: 350, stackKg: 0, start: 15, adjustments: ["Start height"], footprint: 7.5, accessibility: 7.5 },
  curl: { weightKg: 150, dims: [130, 110, 140], maxLoadKg: 120, stackKg: 70, start: 4, adjustments: ["Seat height"], footprint: 8, accessibility: 8 },
  triceps: { weightKg: 160, dims: [130, 120, 150], maxLoadKg: 150, stackKg: 80, start: 5, adjustments: ["Seat height"], footprint: 7.8, accessibility: 7.8 },
  squat: { weightKg: 300, dims: [220, 150, 200], maxLoadKg: 400, stackKg: 0, start: 25, adjustments: ["Shoulder pad height", "Foot plate angle"], footprint: 5, accessibility: 6 },
  "leg-press": { weightKg: 420, dims: [240, 170, 160], maxLoadKg: 500, stackKg: 140, start: 40, adjustments: ["Backrest angle", "Foot plate"], footprint: 4.5, accessibility: 7 },
  "hack-squat": { weightKg: 360, dims: [230, 160, 170], maxLoadKg: 450, stackKg: 0, start: 45, adjustments: ["Safety stops"], footprint: 5, accessibility: 6.2 },
  "leg-extension": { weightKg: 200, dims: [150, 120, 140], maxLoadKg: 200, stackKg: 100, start: 5, adjustments: ["Backrest depth", "Shin pad", "ROM limiter"], footprint: 7.8, accessibility: 8.5 },
  "leg-curl": { weightKg: 210, dims: [170, 120, 140], maxLoadKg: 200, stackKg: 100, start: 5, adjustments: ["Backrest depth", "Thigh pad", "ROM limiter"], footprint: 7.2, accessibility: 8 },
  "hip-thrust": { weightKg: 260, dims: [200, 150, 120], maxLoadKg: 400, stackKg: 0, start: 20, adjustments: ["Pad height", "Foot plate"], footprint: 5.8, accessibility: 6.5 },
  "hip-ab-ad": { weightKg: 220, dims: [170, 80, 140], maxLoadKg: 0, stackKg: 100, start: 5, adjustments: ["Start ROM", "Leg pad"], footprint: 7.6, accessibility: 8.5 },
  "glute-kickback": { weightKg: 180, dims: [150, 110, 150], maxLoadKg: 200, stackKg: 90, start: 6, adjustments: ["Chest pad", "Foot plate"], footprint: 7.2, accessibility: 7 },
  calf: { weightKg: 160, dims: [140, 100, 120], maxLoadKg: 250, stackKg: 110, start: 10, adjustments: ["Knee pad height"], footprint: 8.2, accessibility: 7.8 },
  "back-extension": { weightKg: 190, dims: [160, 110, 150], maxLoadKg: 0, stackKg: 100, start: 5, adjustments: ["Seat height", "Start ROM"], footprint: 7.6, accessibility: 7.8 },
  "ab-crunch": { weightKg: 180, dims: [140, 110, 150], maxLoadKg: 0, stackKg: 90, start: 4, adjustments: ["Seat height"], footprint: 7.8, accessibility: 8.2 },
  dip: { weightKg: 200, dims: [150, 130, 170], maxLoadKg: 250, stackKg: 100, start: 6, adjustments: ["Seat height", "Handle width"], footprint: 7, accessibility: 7.2 },
};

const LOAD_MOD: Record<LoadType, Partial<Ratings>> = {
  "plate-loaded": { feel: 0.4, smoothness: 0.1, stability: 0.5, accessibility: -0.5, durability: 0.5 },
  selectorized: { feel: -0.2, smoothness: 0.2, accessibility: 0.8, durability: 0 },
  cable: { feel: 0, smoothness: 0.4, stability: -0.4, accessibility: 0.4, footprint: -0.4 },
};

const clamp = (n: number, lo = 1, hi = 10) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export function deriveRatings(
  id: string,
  movement: Movement,
  load: LoadType,
  build: number,
  overrides: Partial<Ratings> = {},
): Ratings {
  const base = BASE[movement];
  const mod = LOAD_MOD[load];
  const j = (salt: number) => (hash01(id, salt) - 0.5) * 1.4;
  const q = build * 10;
  const r: Ratings = {
    feel: q - 0.8 + (mod.feel ?? 0) + j(1),
    smoothness: q - 0.6 + (mod.smoothness ?? 0) + j(2),
    stability: q - 0.4 + (mod.stability ?? 0) + j(3),
    accessibility: base.accessibility + (mod.accessibility ?? 0) + j(4),
    durability: q + (mod.durability ?? 0) + j(5),
    footprint: base.footprint + (mod.footprint ?? 0) + j(6),
  };
  for (const k of Object.keys(r) as (keyof Ratings)[]) {
    r[k] = round1(clamp(overrides[k] ?? r[k]));
  }
  return r;
}

export function deriveSpecs(
  id: string,
  movement: Movement,
  load: LoadType,
  overrides: Partial<Specs> = {},
): Specs {
  const b = BASE[movement];
  const s = 0.88 + hash01(id, 9) * 0.24;
  const dims = b.dims.map((d) => Math.round((d * (0.94 + hash01(id, 10) * 0.12)) / 5) * 5) as [number, number, number];
  const plate = load === "plate-loaded";
  const stack = plate ? undefined : b.stackKg ? Math.round((b.stackKg * s) / 5) * 5 : 100;
  return {
    weightKg: Math.round((b.weightKg * s * (plate ? 1.05 : 1)) / 5) * 5,
    dimensionsCm: dims,
    stackKg: stack,
    maxLoadKg: plate ? Math.round((b.maxLoadKg || 200) * s / 10) * 10 : undefined,
    startingResistanceKg: Math.round(b.start * (0.8 + hash01(id, 11) * 0.4)),
    adjustments: b.adjustments,
    ...overrides,
  };
}
