import { hash01 } from "./derive";
import type { Machine } from "./types";

export const CURVE_POINTS = 41;

/**
 * Relative resistance (0–1, normalised to the machine's own peak) at evenly
 * spaced points from the stretched start of the rep (0) to lockout (1).
 */
export function resistanceCurve(m: Pick<Machine, "id" | "curve" | "peak">, points = CURVE_POINTS): number[] {
  const sigma = { ascending: 0.42, descending: 0.4, bell: 0.22, flat: 0.6 }[m.curve];
  const floor = { ascending: 0.38, descending: 0.4, bell: 0.45, flat: 0.78 }[m.curve];
  const wobblePhase = hash01(m.id, 21) * Math.PI * 2;
  const wobbleAmp = 0.015 + hash01(m.id, 22) * 0.035;
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const x = i / (points - 1);
    const g = Math.exp(-((x - m.peak) ** 2) / (2 * sigma * sigma));
    const wobble = wobbleAmp * Math.sin(x * Math.PI * 3 + wobblePhase);
    out.push(floor + (1 - floor) * g + wobble);
  }
  const max = Math.max(...out);
  return out.map((v) => Math.max(0, v / max));
}

/** Where the curve peaks, and how much it varies, in plain words. */
export function describeCurve(values: number[]): { peakAt: number; spread: number; label: string } {
  let peakIdx = 0;
  values.forEach((v, i) => {
    if (v > values[peakIdx]) peakIdx = i;
  });
  const peakAt = peakIdx / (values.length - 1);
  const spread = 1 - Math.min(...values);
  const zone = peakAt < 0.34 ? "the stretch" : peakAt > 0.66 ? "lockout" : "mid-range";
  const label = spread < 0.15 ? "Near-constant tension" : `Peaks in ${zone}, ${Math.round(spread * 100)}% drop-off`;
  return { peakAt, spread, label };
}
