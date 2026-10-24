import type { Equipment, Loading, Movement } from "@/lib/types";
import type { MuscleId } from "@/lib/muscles";

/**
 * Curve presets: relative load across the concentric ROM, 0% = stretched position,
 * 100% = contracted position. These are editorial estimates, not lab measurements.
 */
export const CURVES = {
  ascending: [52, 57, 62, 67, 72, 77, 82, 87, 92, 96, 100],
  descending: [100, 98, 94, 89, 83, 77, 71, 65, 60, 55, 52],
  bell: [60, 70, 80, 89, 96, 100, 97, 90, 81, 71, 62],
  flat: [88, 90, 92, 93, 94, 95, 94, 93, 92, 90, 88],
  // Hardest in the stretch, then a plateau (most pendulums and cam-matched pullovers)
  stretch: [100, 99, 97, 93, 88, 83, 79, 76, 74, 72, 70],
  // Hardest at lockout, typical of free-standing plate leg presses and hack squats
  lockout: [62, 64, 67, 71, 75, 80, 85, 90, 94, 98, 100],
} as const;

type Shape = Equipment["resistanceProfile"]["shape"];
type Preset = keyof typeof CURVES;

const PRESET_SHAPE: Record<Preset, Shape> = {
  ascending: "ascending",
  descending: "descending",
  bell: "bell",
  flat: "flat",
  stretch: "descending",
  lockout: "ascending",
};

export type ItemInput = {
  slug: string;
  name: string;
  series?: string;
  aliases?: string[];
  loading: Loading;
  movement: Movement;
  primary: MuscleId[];
  secondary?: MuscleId[];
  iso?: boolean;
  discontinued?: boolean;
  years?: string;
  /** Preset name, or an explicit 11-point curve */
  curve: Preset | number[];
  variants?: { label: string; curve: Preset | number[] }[];
  curveNotes: string;
  /** smoothness, stability, stretch, rom, ergonomics, build */
  feel: [number, number, number, number, number, number];
  /** entry, adjustment, beginner */
  access: [number, number, number];
  startKg?: number;
  transfer?: boolean;
  maxLoad?: string;
  footprint?: string;
  weightKg?: number;
  price?: Equipment["specs"]["priceBand"];
  pros: string[];
  cons: string[];
  note: string;
  fav?: boolean;
  sources?: { label: string; url: string }[];
};

const toCurve = (c: Preset | number[]) => (Array.isArray(c) ? c : [...CURVES[c]]);

export function brandItems(brandSlug: string, items: ItemInput[]): Equipment[] {
  return items.map((i) => ({
    slug: i.slug,
    brandSlug,
    name: i.name,
    series: i.series,
    aliases: i.aliases ?? [],
    loading: i.loading,
    movement: i.movement,
    primaryMuscles: i.primary,
    secondaryMuscles: i.secondary ?? [],
    isoLateral: i.iso ?? false,
    discontinued: i.discontinued ?? false,
    years: i.years,
    resistanceProfile: {
      shape: i.variants ? "adjustable" : Array.isArray(i.curve) ? inferShape(i.curve) : PRESET_SHAPE[i.curve],
      curve: toCurve(i.curve),
      variants: i.variants?.map((v) => ({ label: v.label, curve: toCurve(v.curve) })),
      notes: i.curveNotes,
    },
    feel: {
      smoothness: i.feel[0],
      stability: i.feel[1],
      stretch: i.feel[2],
      rom: i.feel[3],
      ergonomics: i.feel[4],
      build: i.feel[5],
    },
    accessibility: {
      entry: i.access[0],
      adjustment: i.access[1],
      beginner: i.access[2],
      startingResistanceKg: i.startKg ?? (i.loading === "plate" ? 15 : 5),
      transferFriendly: i.transfer ?? false,
    },
    specs: { maxLoad: i.maxLoad, footprint: i.footprint, weightKg: i.weightKg, priceBand: i.price },
    pros: i.pros,
    cons: i.cons,
    editorialNote: i.note,
    editorialFavorite: i.fav ?? false,
    images: [],
    sources: i.sources ?? [],
  }));
}

export function inferShape(curve: number[]): Shape {
  const first = curve[0];
  const last = curve[curve.length - 1];
  const peak = Math.max(...curve);
  const peakAt = curve.indexOf(peak);
  if (peak - Math.min(...curve) < 12) return "flat";
  if (peakAt > 2 && peakAt < curve.length - 3 && peak - Math.max(first, last) > 10) return "bell";
  return last > first ? "ascending" : "descending";
}
