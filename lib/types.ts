import { z } from "zod";
import { MUSCLE_IDS } from "./muscles";

export const LOADING_TYPES = ["plate", "selectorized", "cable", "free-weight", "bench-rack"] as const;
export const LOADING_LABELS: Record<(typeof LOADING_TYPES)[number], string> = {
  plate: "Plate-loaded",
  selectorized: "Selectorized",
  cable: "Cable",
  "free-weight": "Free weight",
  "bench-rack": "Bench / rack",
};

export const MOVEMENTS = [
  "chest-press",
  "incline-press",
  "chest-fly",
  "shoulder-press",
  "lateral-raise",
  "rear-delt",
  "pulldown",
  "row",
  "pullover",
  "squat",
  "hack-squat",
  "pendulum-squat",
  "leg-press",
  "leg-extension",
  "leg-curl",
  "hip-thrust",
  "abduction",
  "calf",
  "biceps",
  "triceps",
  "lower-back",
  "core",
  "functional-trainer",
  "cable-crossover",
  "multi",
  "dumbbells",
  "fixed-barbells",
  "barbell",
  "plates",
] as const;

/** Free-weight categories: sold as sets, priced by the set and shipped by weight */
export const FREE_WEIGHT_MOVEMENTS = ["dumbbells", "fixed-barbells", "barbell", "plates"] as const;

export const MOVEMENT_LABELS: Record<(typeof MOVEMENTS)[number], string> = {
  "chest-press": "Chest press",
  "incline-press": "Incline press",
  "chest-fly": "Chest fly",
  "shoulder-press": "Shoulder press",
  "lateral-raise": "Lateral raise",
  "rear-delt": "Rear delt",
  pulldown: "Pulldown",
  row: "Row",
  pullover: "Pullover",
  squat: "Squat",
  "hack-squat": "Hack squat",
  "pendulum-squat": "Pendulum squat",
  "leg-press": "Leg press",
  "leg-extension": "Leg extension",
  "leg-curl": "Leg curl",
  "hip-thrust": "Hip thrust",
  abduction: "Abduction / adduction",
  calf: "Calf raise",
  biceps: "Biceps curl",
  triceps: "Triceps",
  "lower-back": "Lower back",
  core: "Core",
  "functional-trainer": "Functional trainer",
  "cable-crossover": "Cable station / crossover",
  multi: "Multi-station",
  dumbbells: "Dumbbells",
  "fixed-barbells": "Fixed barbells",
  barbell: "Olympic bar",
  plates: "Weight plates",
};

export const PROFILE_SHAPES = ["ascending", "descending", "bell", "flat", "adjustable"] as const;

const score = z.number().min(1).max(10);
const curve = z.array(z.number().min(0).max(100)).length(11);
const muscle = z.enum(MUSCLE_IDS);

export const ImageSchema = z.object({
  src: z.string(),
  credit: z.string(),
  sourceUrl: z.string().url(),
  /** A licensed photo of a similar machine, used when no photo of the exact model exists */
  representative: z.boolean().optional(),
});

export const CURRENCIES = ["USD", "AUD", "SEK", "EUR", "GBP"] as const;

/** A price as published by a store or dealer, before conversion to Singapore dollars. */
export const ListPriceSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(CURRENCIES),
  /** Sales tax already inside `amount` (0.25 = 25% VAT), removed before landing costs are added */
  taxIncluded: z.number().min(0).max(0.3),
  condition: z.enum(["new", "used"]),
  source: z.string(),
  url: z.string().url(),
});

export const BrandSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  country: z.string(),
  /** Unknown for some smaller brands; left out rather than guessed */
  founded: z.number().int().optional(),
  status: z.enum(["active", "defunct"]),
  defunctYear: z.number().int().optional(),
  note: z.string().optional(),
  website: z.string().url().optional(),
  blurb: z.string(),
  signature: z.string(),
});

export const EquipmentSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  brandSlug: z.string(),
  name: z.string(),
  series: z.string().optional(),
  aliases: z.array(z.string()),
  loading: z.enum(LOADING_TYPES),
  movement: z.enum(MOVEMENTS),
  // Plates train nothing on their own, so free-weight entries may list no muscles
  primaryMuscles: z.array(muscle),
  secondaryMuscles: z.array(muscle),
  isoLateral: z.boolean(),
  discontinued: z.boolean(),
  /** Profile and scores come from the movement template rather than a hands-on review */
  estimated: z.boolean(),
  years: z.string().optional(),
  resistanceProfile: z.object({
    shape: z.enum(PROFILE_SHAPES),
    // Relative load at 0%, 10% … 100% of the concentric ROM, starting in the stretch
    curve,
    variants: z.array(z.object({ label: z.string(), curve })).optional(),
    notes: z.string(),
  }),
  feel: z.object({
    smoothness: score,
    stability: score,
    stretch: score,
    rom: score,
    ergonomics: score,
    build: score,
  }),
  accessibility: z.object({
    entry: score,
    adjustment: score,
    beginner: score,
    startingResistanceKg: z.number().min(0),
    transferFriendly: z.boolean(),
  }),
  specs: z.object({
    maxLoad: z.string().optional(),
    footprint: z.string().optional(),
    weightKg: z.number().optional(),
    priceBand: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  }),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  editorialNote: z.string(),
  editorialFavorite: z.boolean(),
  images: z.array(ImageSchema),
  sources: z.array(z.object({ label: z.string(), url: z.string().url() })),
  listPrice: ListPriceSchema.optional(),
});

export const ScrapedSchema = z.object({
  slug: z.string(),
  images: z.array(ImageSchema),
  listPrice: ListPriceSchema.optional(),
  specs: EquipmentSchema.shape.specs.partial().optional(),
  sources: EquipmentSchema.shape.sources.optional(),
  description: z.string().optional(),
});

export type ListPrice = z.infer<typeof ListPriceSchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export type Scraped = z.infer<typeof ScrapedSchema>;
export type Loading = Equipment["loading"];
export type Movement = Equipment["movement"];
export type FeelKey = keyof Equipment["feel"];

export const FEEL_LABELS: Record<FeelKey, string> = {
  smoothness: "Smoothness",
  stability: "Stability",
  stretch: "Stretch emphasis",
  rom: "Range of motion",
  ergonomics: "Ergonomics",
  build: "Build quality",
};

/** Equipment joined with its brand and derived flags, as consumed by the UI. */
export type CatalogueItem = Equipment & {
  brand: Pick<Brand, "slug" | "name" | "status" | "country">;
  vintage: boolean;
  /** Estimated cost to buy and land this machine in Singapore */
  price: { sgd: number; basis: "listed" | "resale" | "estimate" };
};
