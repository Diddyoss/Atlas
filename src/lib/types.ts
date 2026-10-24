export const MUSCLES = [
  "chest",
  "upper-chest",
  "front-delts",
  "side-delts",
  "rear-delts",
  "traps",
  "lats",
  "upper-back",
  "lower-back",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "obliques",
  "glutes",
  "quads",
  "hamstrings",
  "adductors",
  "abductors",
  "calves",
] as const;

export type Muscle = (typeof MUSCLES)[number];

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: "Chest",
  "upper-chest": "Upper chest",
  "front-delts": "Front delts",
  "side-delts": "Side delts",
  "rear-delts": "Rear delts",
  traps: "Traps",
  lats: "Lats",
  "upper-back": "Upper back",
  "lower-back": "Lower back",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  adductors: "Adductors",
  abductors: "Abductors",
  calves: "Calves",
};

export type Movement =
  | "chest-press"
  | "incline-press"
  | "fly"
  | "shoulder-press"
  | "lateral-raise"
  | "rear-delt"
  | "pulldown"
  | "row"
  | "pullover"
  | "shrug"
  | "curl"
  | "triceps"
  | "squat"
  | "leg-press"
  | "hack-squat"
  | "leg-extension"
  | "leg-curl"
  | "hip-thrust"
  | "hip-ab-ad"
  | "glute-kickback"
  | "calf"
  | "back-extension"
  | "ab-crunch"
  | "dip";

export const MOVEMENT_LABELS: Record<Movement, string> = {
  "chest-press": "Chest press",
  "incline-press": "Incline press",
  fly: "Fly / pec deck",
  "shoulder-press": "Shoulder press",
  "lateral-raise": "Lateral raise",
  "rear-delt": "Rear delt",
  pulldown: "Pulldown",
  row: "Row",
  pullover: "Pullover",
  shrug: "Shrug",
  curl: "Biceps curl",
  triceps: "Triceps",
  squat: "Squat",
  "leg-press": "Leg press",
  "hack-squat": "Hack squat",
  "leg-extension": "Leg extension",
  "leg-curl": "Leg curl",
  "hip-thrust": "Hip thrust",
  "hip-ab-ad": "Hip abduction / adduction",
  "glute-kickback": "Glute kickback",
  calf: "Calf raise",
  "back-extension": "Back extension",
  "ab-crunch": "Ab crunch",
  dip: "Dip",
};

export type LoadType = "plate-loaded" | "selectorized" | "cable";

export const LOAD_LABELS: Record<LoadType, string> = {
  "plate-loaded": "Plate-loaded",
  selectorized: "Selectorized",
  cable: "Cable",
};

/** Where peak resistance sits over the range of motion. */
export type CurveShape = "ascending" | "descending" | "bell" | "flat";

export const CURVE_LABELS: Record<CurveShape, string> = {
  ascending: "Ascending — hardest at lockout",
  descending: "Descending — hardest in the stretch",
  bell: "Bell — hardest mid-range",
  flat: "Flat — even throughout",
};

export type BrandStatus = "active" | "legacy";

export interface Brand {
  slug: string;
  name: string;
  country: string;
  founded: number;
  /** Year the brand stopped producing gym machines, if it did. */
  ceased?: number;
  status: BrandStatus;
  url: string;
  blurb: string;
  /** 0–1: house build-quality baseline used for editorial scores. */
  build: number;
}

export interface Ratings {
  feel: number;
  smoothness: number;
  stability: number;
  accessibility: number;
  durability: number;
  footprint: number;
}

export const RATING_KEYS = [
  "feel",
  "smoothness",
  "stability",
  "accessibility",
  "durability",
  "footprint",
] as const satisfies readonly (keyof Ratings)[];

export const RATING_LABELS: Record<keyof Ratings, string> = {
  feel: "Feel",
  smoothness: "Smoothness",
  stability: "Stability",
  accessibility: "Accessibility",
  durability: "Durability",
  footprint: "Space efficiency",
};

export const RATING_HINTS: Record<keyof Ratings, string> = {
  feel: "How well the movement path and pads match the body",
  smoothness: "Friction, cam/bearing quality, stack or carriage glide",
  stability: "Frame rigidity and how locked-in you feel",
  accessibility: "Ease of entry, setup and adjustment for different bodies",
  durability: "Expected lifespan under commercial use",
  footprint: "Floor space relative to what the machine does",
};

export interface Specs {
  /** Approximate machine weight in kg. */
  weightKg: number;
  /** Length × width × height in cm. */
  dimensionsCm: [number, number, number];
  /** Selector stack in kg, for selectorized and cable machines. */
  stackKg?: number;
  /** Maximum plate load in kg, for plate-loaded machines. */
  maxLoadKg?: number;
  /** Felt resistance with no plates/pin at the lightest setting. */
  startingResistanceKg: number;
  adjustments: string[];
}

export interface Machine {
  id: string;
  brand: string;
  name: string;
  line?: string;
  movement: Movement;
  load: LoadType;
  primary: Muscle[];
  secondary: Muscle[];
  curve: CurveShape;
  /** 0–1 position of the peak along the ROM; refines the curve. */
  peak: number;
  unilateral: boolean;
  years?: [number, number?];
  description: string;
  ratings: Ratings;
  specs: Specs;
  priceTier: 1 | 2 | 3 | 4;
  sourceUrl: string;
  /** Product photo, filled by scripts/scrape-images.mjs when available. */
  image?: string;
  imageCredit?: string;
}

export interface VoteTally {
  up: number;
  down: number;
  /** Per-attribute community score sums and counts (1–5 scale). */
  scores: Record<keyof Ratings, { sum: number; count: number }>;
}
