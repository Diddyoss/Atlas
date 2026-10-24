import { resistanceCurve } from "@/lib/curve";
import type { Machine } from "@/lib/types";

export function MiniCurve({ m }: { m: Machine }) {
  const pts = resistanceCurve(m, 21);
  const w = 110;
  const h = 34;
  const d = pts.map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * w).toFixed(1)} ${(h - v * (h - 4) - 2).toFixed(1)}`).join(" ");
  return (
    <div>
      <p className="label mb-1">Resistance</p>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-label="Resistance curve" className="text-paper">
        <path d={`${d} L${w} ${h} L0 ${h} Z`} fill="currentColor" opacity={0.08} />
        <path d={d} fill="none" stroke="currentColor" strokeWidth={1.6} />
      </svg>
    </div>
  );
}
