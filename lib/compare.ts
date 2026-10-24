import type { CatalogueItem } from "./types";

export const MAX_COMPARE = 4;

export type Row = {
  key: string;
  label: string;
  values: (number | string | boolean | undefined)[];
  /** "high" = larger is better, "low" = smaller is better, undefined = not ranked */
  better?: "high" | "low";
  format?: (v: number | string | boolean | undefined) => string;
};

/** Indexes of the columns holding the best value in a ranked row. Ties all win; uniform rows have no winner. */
export function bestIndexes(row: Pick<Row, "values" | "better">): number[] {
  if (!row.better) return [];
  const nums = row.values.map((v) => (typeof v === "number" ? v : typeof v === "boolean" ? Number(v) : NaN));
  const valid = nums.filter((n) => !Number.isNaN(n));
  if (valid.length < 2) return [];
  const target = row.better === "high" ? Math.max(...valid) : Math.min(...valid);
  if (valid.every((n) => n === target)) return [];
  return nums.flatMap((n, i) => (n === target ? [i] : []));
}

export function rowDiffers(row: Pick<Row, "values">) {
  const s = row.values.map((v) => JSON.stringify(v ?? null));
  return new Set(s).size > 1;
}

/** Average of the 11-point curve where the first and last thirds are compared, for a "stretch bias" readout. */
export function stretchBias(curve: number[]) {
  const early = curve.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
  const late = curve.slice(-4).reduce((a, b) => a + b, 0) / 4;
  return Math.round(early - late);
}

export const feelAverage = (i: CatalogueItem) => {
  const v = Object.values(i.feel);
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
};

export const accessAverage = (i: CatalogueItem) =>
  Math.round(((i.accessibility.entry + i.accessibility.adjustment + i.accessibility.beginner) / 3) * 10) / 10;

export function parseCompareIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAX_COMPARE);
}
