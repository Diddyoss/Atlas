import type { Equipment, Loading, Movement } from "@/lib/types";
import type { MuscleId } from "@/lib/muscles";
import { CURVES, inferShape } from "./define";

type Template = {
  primary: MuscleId[];
  secondary: MuscleId[];
  /** Typical curve by loading type; falls back to `default` */
  curve: Partial<Record<Loading, readonly number[]>> & { default: readonly number[] };
  notes: string;
  /** smoothness, stability, stretch, rom, ergonomics, build */
  feel: [number, number, number, number, number, number];
  /** entry, adjustment, beginner */
  access: [number, number, number];
};

/**
 * Baseline profiles per movement pattern. Machines discovered from catalogues start here and are
 * flagged `estimated` until someone reviews them by hand.
 */
export const MOVEMENT_TEMPLATES: Record<Movement, Template> = {
  "chest-press": {
    primary: ["chest"],
    secondary: ["front-delts", "triceps"],
    curve: { default: CURVES.bell, plate: CURVES.bell, selectorized: CURVES.bell },
    notes: "Typical press profile: hardest mid-range, easing toward lockout.",
    feel: [7, 8, 7, 7, 7, 7],
    access: [8, 7, 8],
  },
  "incline-press": {
    primary: ["upper-chest"],
    secondary: ["front-delts", "triceps"],
    curve: { default: CURVES.bell },
    notes: "Incline press: mid-range peak with front delts working harder near lockout.",
    feel: [7, 8, 7, 7, 7, 7],
    access: [8, 7, 8],
  },
  "chest-fly": {
    primary: ["chest"],
    secondary: ["front-delts"],
    curve: { default: CURVES.descending },
    notes: "Fly geometry usually loads the stretched, arms-open position most.",
    feel: [7, 7, 8, 8, 7, 7],
    access: [8, 7, 8],
  },
  "shoulder-press": {
    primary: ["front-delts", "side-delts"],
    secondary: ["triceps", "upper-chest"],
    curve: { default: CURVES.bell },
    notes: "Overhead press: peak load just above shoulder height.",
    feel: [7, 7, 6, 7, 7, 7],
    access: [8, 7, 8],
  },
  "lateral-raise": {
    primary: ["side-delts"],
    secondary: ["traps"],
    curve: { default: CURVES.bell },
    notes: "Machine laterals keep some tension at the bottom, peaking mid-range.",
    feel: [7, 7, 7, 8, 7, 7],
    access: [8, 7, 8],
  },
  "rear-delt": {
    primary: ["rear-delts"],
    secondary: ["upper-back", "traps"],
    curve: { default: CURVES.flat },
    notes: "Reverse fly with fairly even loading.",
    feel: [7, 7, 7, 8, 7, 7],
    access: [8, 7, 8],
  },
  pulldown: {
    primary: ["lats"],
    secondary: ["biceps", "upper-back", "rear-delts"],
    curve: { default: CURVES.flat, plate: CURVES.descending },
    notes: "Pulldowns are fairly even; lever versions load the top stretch more.",
    feel: [7, 7, 7, 8, 7, 7],
    access: [8, 7, 8],
  },
  row: {
    primary: ["upper-back", "lats"],
    secondary: ["rear-delts", "biceps", "traps"],
    curve: { default: CURVES.flat, plate: CURVES.descending },
    notes: "Rows usually load the reach most, easing toward the squeeze.",
    feel: [7, 8, 7, 8, 7, 7],
    access: [8, 7, 8],
  },
  pullover: {
    primary: ["lats"],
    secondary: ["chest", "triceps"],
    curve: { default: CURVES.stretch },
    notes: "Pullovers are classically stretch-loaded overhead.",
    feel: [7, 7, 9, 9, 6, 7],
    access: [6, 6, 6],
  },
  squat: {
    primary: ["quads", "glutes"],
    secondary: ["adductors", "hamstrings"],
    curve: { default: CURVES.lockout, "bench-rack": CURVES.flat },
    notes: "Lever squats tend to get heavier toward lockout; free-weight depends on leverage.",
    feel: [7, 8, 6, 7, 6, 8],
    access: [6, 6, 6],
  },
  "hack-squat": {
    primary: ["quads"],
    secondary: ["glutes", "adductors"],
    curve: { default: CURVES.flat },
    notes: "Linear sled: near-constant load, light at lockout as knees straighten.",
    feel: [7, 8, 7, 8, 7, 8],
    access: [6, 6, 7],
  },
  "pendulum-squat": {
    primary: ["quads", "glutes"],
    secondary: ["adductors"],
    curve: { default: CURVES.stretch },
    notes: "Pendulum arc: heaviest in the hole where the quads are longest.",
    feel: [8, 8, 9, 9, 7, 8],
    access: [6, 6, 6],
  },
  "leg-press": {
    primary: ["quads", "glutes"],
    secondary: ["hamstrings", "adductors"],
    curve: { default: CURVES.flat, plate: CURVES.flat },
    notes: "Sled and seated presses load fairly evenly through the range.",
    feel: [7, 8, 6, 7, 7, 8],
    access: [7, 7, 8],
  },
  "leg-extension": {
    primary: ["quads"],
    secondary: [],
    curve: { default: CURVES.ascending },
    notes: "Extension cams normally get heavier toward full knee extension.",
    feel: [7, 7, 6, 8, 7, 7],
    access: [8, 8, 9],
  },
  "leg-curl": {
    primary: ["hamstrings"],
    secondary: ["calves"],
    curve: { default: CURVES.descending },
    notes: "Curls load most with the knee extended, easing as it bends.",
    feel: [7, 7, 7, 8, 7, 7],
    access: [8, 7, 8],
  },
  "hip-thrust": {
    primary: ["glutes"],
    secondary: ["hamstrings"],
    curve: { default: CURVES.ascending },
    notes: "Hip extension machines usually peak at lockout.",
    feel: [7, 8, 6, 7, 7, 7],
    access: [7, 7, 7],
  },
  abduction: {
    primary: ["abductors", "adductors"],
    secondary: ["glutes"],
    curve: { default: CURVES.flat },
    notes: "Thigh machines load fairly evenly.",
    feel: [7, 8, 6, 7, 7, 7],
    access: [9, 8, 9],
  },
  calf: {
    primary: ["calves"],
    secondary: [],
    curve: { default: CURVES.flat },
    notes: "Calf machines are close to flat across the range.",
    feel: [7, 8, 7, 7, 7, 7],
    access: [8, 8, 8],
  },
  biceps: {
    primary: ["biceps"],
    secondary: ["forearms"],
    curve: { default: CURVES.bell },
    notes: "Curl cams generally peak mid-range.",
    feel: [7, 7, 7, 7, 7, 7],
    access: [9, 8, 9],
  },
  triceps: {
    primary: ["triceps"],
    secondary: ["chest", "front-delts"],
    curve: { default: CURVES.bell },
    notes: "Triceps machines generally peak mid-range.",
    feel: [7, 7, 6, 7, 7, 7],
    access: [9, 8, 9],
  },
  "lower-back": {
    primary: ["lower-back"],
    secondary: ["glutes", "hamstrings"],
    curve: { default: CURVES.flat },
    notes: "Back extensions load fairly evenly.",
    feel: [7, 7, 6, 7, 7, 7],
    access: [8, 7, 8],
  },
  core: {
    primary: ["abs"],
    secondary: ["obliques"],
    curve: { default: CURVES.flat },
    notes: "Ab and torso machines are close to flat.",
    feel: [7, 7, 6, 7, 7, 7],
    access: [9, 8, 9],
  },
  multi: {
    primary: ["chest", "lats", "quads"],
    secondary: ["front-delts", "triceps", "biceps"],
    curve: { default: CURVES.flat },
    notes: "Multi-purpose station: the profile depends on the exercise and your angle to the cable or bar.",
    feel: [7, 7, 7, 8, 7, 7],
    access: [8, 8, 7],
  },
};

/** Small, documented nudges for brands known for build quality or smoothness. Applied to estimates only. */
const BRAND_TRAITS: Record<string, { build?: number; smoothness?: number; stretch?: number }> = {
  panatta: { build: 2, smoothness: 1 },
  gym80: { build: 2, smoothness: 2 },
  watson: { build: 2 },
  atlantis: { build: 2 },
  "hammer-strength": { build: 2 },
  "prime-fitness": { build: 1, smoothness: 1 },
  newtech: { stretch: 1 },
  "arsenal-strength": { build: 1 },
  technogym: { smoothness: 1 },
  medx: { smoothness: 2, build: 1 },
  cybex: { smoothness: 1 },
  gymleco: { build: 1 },
};

const clamp = (n: number) => Math.max(1, Math.min(10, n));

export type DiscoveredMachine = {
  slug: string;
  brandSlug: string;
  name: string;
  series?: string;
  movement: Movement;
  loading: Loading;
  isoLateral: boolean;
  discontinued: boolean;
  image?: { src: string; credit: string; sourceUrl: string };
  source: { label: string; url: string };
};

export function estimateEquipment(d: DiscoveredMachine): Equipment {
  const t = MOVEMENT_TEMPLATES[d.movement];
  const traits = BRAND_TRAITS[d.brandSlug] ?? {};
  const [smooth, stab, stretch, rom, ergo, build] = t.feel;
  const curve = t.curve[d.loading] ?? t.curve.default;
  return {
    slug: d.slug,
    brandSlug: d.brandSlug,
    name: d.name,
    series: d.series,
    aliases: [],
    loading: d.loading,
    movement: d.movement,
    primaryMuscles: [...t.primary],
    secondaryMuscles: [...t.secondary],
    isoLateral: d.isoLateral,
    discontinued: d.discontinued,
    estimated: true,
    resistanceProfile: { shape: inferShape([...curve]), curve: [...curve], notes: `${t.notes} Estimated from the movement type.` },
    feel: {
      smoothness: clamp(smooth + (traits.smoothness ?? 0)),
      stability: stab,
      stretch: clamp(stretch + (traits.stretch ?? 0)),
      rom,
      ergonomics: ergo,
      build: clamp(build + (traits.build ?? 0)),
    },
    accessibility: {
      entry: t.access[0],
      adjustment: t.access[1],
      beginner: t.access[2],
      startingResistanceKg: d.loading === "plate" ? 15 : d.loading === "bench-rack" ? 20 : 5,
      transferFriendly: false,
    },
    specs: {},
    pros: [],
    cons: [],
    editorialNote:
      "Listed from the manufacturer's or a dealer's catalogue. Its profile and scores are estimated from the movement type and brand until reviewed.",
    editorialFavorite: false,
    images: d.image ? [d.image] : [],
    sources: [d.source],
  };
}
