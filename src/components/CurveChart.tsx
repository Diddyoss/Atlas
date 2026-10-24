"use client";

import { useState } from "react";
import { BRAND_MAP } from "@/data/brands";
import { resistanceCurve } from "@/lib/curve";
import { SERIES } from "@/lib/series";
import type { Machine } from "@/lib/types";

export function CurveChart({ machines, height = 260 }: { machines: Machine[]; height?: number }) {
  const [x, setX] = useState<number | null>(null);
  const W = 600;
  const H = height;
  const pad = { l: 40, r: 16, t: 16, b: 34 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const curves = machines.map((m) => resistanceCurve(m));
  const n = curves[0]?.length ?? 0;
  const px = (i: number) => pad.l + (i / (n - 1)) * iw;
  const py = (v: number) => pad.t + ih - v * ih;
  const hoverIdx = x === null ? null : Math.round(((x - pad.l) / iw) * (n - 1));
  const valid = hoverIdx !== null && hoverIdx >= 0 && hoverIdx < n;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setX(((e.clientX - r.left) / r.width) * W);
        }}
        onPointerLeave={() => setX(null)}
        role="img"
        aria-label="Resistance curves across the range of motion"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={py(v)} y2={py(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={pad.l - 8} y={py(v) + 4} textAnchor="end" className="fill-mute font-mono text-[10px]">
              {v * 100}
            </text>
          </g>
        ))}
        <text x={pad.l} y={H - 8} className="fill-mute font-mono text-[10px] uppercase">Stretch</text>
        <text x={pad.l + iw / 2} y={H - 8} textAnchor="middle" className="fill-mute font-mono text-[10px] uppercase">Mid-range</text>
        <text x={W - pad.r} y={H - 8} textAnchor="end" className="fill-mute font-mono text-[10px] uppercase">Lockout</text>
        {curves.map((c, si) => {
          const d = c.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");
          return (
            <g key={machines[si].id}>
              {si === 0 && <path d={`${d} L${px(n - 1)} ${py(0)} L${px(0)} ${py(0)} Z`} fill="#fff" opacity={0.05} />}
              <path
                d={d}
                fill="none"
                stroke={SERIES[si].stroke}
                strokeWidth={2.4}
                strokeDasharray={SERIES[si].dash || undefined}
                className={SERIES[si].dash ? "rise" : "draw"}
                style={{ ["--len" as string]: 900, animationDelay: `${si * 180}ms` }}
              />
            </g>
          );
        })}
        {valid && (
          <g>
            <line x1={px(hoverIdx)} x2={px(hoverIdx)} y1={pad.t} y2={pad.t + ih} stroke="var(--bone)" strokeWidth={1} strokeDasharray="3 3" />
            {curves.map((c, si) => (
              <circle key={si} cx={px(hoverIdx)} cy={py(c[hoverIdx])} r={4} fill={SERIES[si].stroke} stroke="var(--ink)" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {machines.map((m, si) => (
          <li key={m.id} className="flex items-center gap-2">
            <svg width="26" height="6" aria-hidden>
              <line x1="0" y1="3" x2="26" y2="3" stroke={SERIES[si].stroke} strokeWidth="2.4" strokeDasharray={SERIES[si].dash || undefined} />
            </svg>
            <span className="text-mute">{BRAND_MAP[m.brand].name}</span>
            <span className="text-paper">{m.name}</span>
            {valid && <span className="font-mono text-paper">{Math.round(curves[si][hoverIdx] * 100)}%</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
