import { BRAND_MAP } from "@/data/brands";
import { describeCurve, resistanceCurve } from "./curve";
import { LOAD_LABELS, MOVEMENT_LABELS, MUSCLE_LABELS, RATING_KEYS, RATING_LABELS, type Machine } from "./types";

export const MAX_COMPARE = 4;

export interface CompareRow {
  group: string;
  label: string;
  values: string[];
  /** Numeric values, when the row can name a winner. */
  numeric?: number[];
  /** True if bigger is better; false if smaller is better. */
  higherBetter?: boolean;
  differs: boolean;
}

const fmtDims = (d: [number, number, number]) => `${d[0]} × ${d[1]} × ${d[2]} cm`;

export function buildRows(machines: Machine[]): CompareRow[] {
  const rows: Omit<CompareRow, "differs">[] = [];
  const add = (r: Omit<CompareRow, "differs">) => rows.push(r);

  add({ group: "Overview", label: "Brand", values: machines.map((m) => BRAND_MAP[m.brand].name) });
  add({ group: "Overview", label: "Line", values: machines.map((m) => m.line ?? "—") });
  add({ group: "Overview", label: "Movement", values: machines.map((m) => MOVEMENT_LABELS[m.movement]) });
  add({ group: "Overview", label: "Loading", values: machines.map((m) => LOAD_LABELS[m.load]) });
  add({ group: "Overview", label: "Independent arms", values: machines.map((m) => (m.unilateral ? "Yes" : "No")) });
  add({ group: "Overview", label: "Price tier", values: machines.map((m) => "$".repeat(m.priceTier)) });

  add({ group: "Muscles", label: "Primary", values: machines.map((m) => m.primary.map((x) => MUSCLE_LABELS[x]).join(", ")) });
  add({ group: "Muscles", label: "Secondary", values: machines.map((m) => m.secondary.map((x) => MUSCLE_LABELS[x]).join(", ") || "—") });

  const curves = machines.map((m) => describeCurve(resistanceCurve(m)));
  add({ group: "Resistance profile", label: "Profile", values: curves.map((c) => c.label) });
  add({
    group: "Resistance profile",
    label: "Stretch loading",
    values: machines.map((m) => `${Math.round(resistanceCurve(m)[4] * 100)}%`),
    numeric: machines.map((m) => resistanceCurve(m)[4]),
    higherBetter: true,
  });
  add({
    group: "Resistance profile",
    label: "Lockout loading",
    values: machines.map((m) => `${Math.round(resistanceCurve(m).at(-5)! * 100)}%`),
    numeric: machines.map((m) => resistanceCurve(m).at(-5)!),
    higherBetter: true,
  });

  for (const k of RATING_KEYS) {
    add({
      group: "Editorial scores",
      label: RATING_LABELS[k],
      values: machines.map((m) => m.ratings[k].toFixed(1)),
      numeric: machines.map((m) => m.ratings[k]),
      higherBetter: true,
    });
  }

  add({ group: "Specs (approx.)", label: "Weight", values: machines.map((m) => `${m.specs.weightKg} kg`), numeric: machines.map((m) => m.specs.weightKg) });
  add({ group: "Specs (approx.)", label: "Dimensions", values: machines.map((m) => fmtDims(m.specs.dimensionsCm)) });
  add({
    group: "Specs (approx.)",
    label: "Floor area",
    values: machines.map((m) => `${((m.specs.dimensionsCm[0] * m.specs.dimensionsCm[1]) / 10000).toFixed(2)} m²`),
    numeric: machines.map((m) => m.specs.dimensionsCm[0] * m.specs.dimensionsCm[1]),
    higherBetter: false,
  });
  add({ group: "Specs (approx.)", label: "Weight stack", values: machines.map((m) => (m.specs.stackKg ? `${m.specs.stackKg} kg` : "—")) });
  add({ group: "Specs (approx.)", label: "Max plate load", values: machines.map((m) => (m.specs.maxLoadKg ? `${m.specs.maxLoadKg} kg` : "—")) });
  add({
    group: "Specs (approx.)",
    label: "Starting resistance",
    values: machines.map((m) => `${m.specs.startingResistanceKg} kg`),
    numeric: machines.map((m) => m.specs.startingResistanceKg),
    higherBetter: false,
  });
  add({ group: "Specs (approx.)", label: "Adjustments", values: machines.map((m) => m.specs.adjustments.join(", ")) });

  return rows.map((r) => ({ ...r, differs: new Set(r.values).size > 1 }));
}

/** Index of the best value in a row, or -1 when there is no single winner. */
export function winnerIndex(row: CompareRow): number {
  if (!row.numeric || row.higherBetter === undefined || !row.differs) return -1;
  const vals = row.numeric;
  const best = row.higherBetter ? Math.max(...vals) : Math.min(...vals);
  const idx = vals.flatMap((v, i) => (v === best ? [i] : []));
  return idx.length === 1 ? idx[0] : -1;
}

export function parseIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAX_COMPARE);
}
