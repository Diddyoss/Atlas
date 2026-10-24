import { RATING_KEYS, RATING_LABELS, type Machine } from "@/lib/types";
import { SERIES } from "@/lib/series";

export function RadarChart({ machines, size = 320 }: { machines: Machine[]; size?: number }) {
  const c = size / 2;
  const r = c - 56;
  const n = RATING_KEYS.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v] as const;
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-sm" role="img" aria-label="Score radar">
      {[0.2, 0.4, 0.6, 0.8, 1].map((ring) => (
        <polygon
          key={ring}
          points={RATING_KEYS.map((_, i) => pt(i, ring).join(",")).join(" ")}
          fill="none"
          stroke="var(--line)"
        />
      ))}
      {RATING_KEYS.map((k, i) => {
        const [x, y] = pt(i, 1);
        const [lx, ly] = pt(i, 1.22);
        return (
          <g key={k}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" />
            <text x={lx} y={ly + 3} textAnchor="middle" className="fill-mute font-mono text-[9px] uppercase">
              {RATING_LABELS[k]}
            </text>
          </g>
        );
      })}
      {machines.map((m, si) => (
        <polygon
          key={m.id}
          points={RATING_KEYS.map((k, i) => pt(i, m.ratings[k] / 10).join(",")).join(" ")}
          fill={SERIES[si].stroke}
          fillOpacity={machines.length === 1 ? 0.18 : 0.06}
          stroke={SERIES[si].stroke}
          strokeWidth={2}
          strokeDasharray={SERIES[si].dash || undefined}
          className="rise"
          style={{ animationDelay: `${si * 150}ms`, transformOrigin: "center" }}
        />
      ))}
    </svg>
  );
}
