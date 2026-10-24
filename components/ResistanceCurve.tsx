"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

export const SERIES_STYLES = [
  { stroke: "var(--color-chalk)", dash: undefined, label: "Solid" },
  { stroke: "#b8b8b4", dash: "8 5", label: "Dashed" },
  { stroke: "#8a8a86", dash: "2 4", label: "Dotted" },
  { stroke: "#d8d8d4", dash: "12 4 2 4", label: "Dash-dot" },
];

const MIN = 30;

/** Catmull-Rom → cubic Bézier for a smooth curve through every point. */
function smoothPath(points: [number, number][]) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function toPoints(curve: number[], w: number, h: number, padX = 0, padY = 0): [number, number][] {
  return curve.map((v, i) => [
    padX + (i / (curve.length - 1)) * (w - padX * 2),
    padY + (1 - (Math.max(v, MIN) - MIN) / (100 - MIN)) * (h - padY * 2),
  ]);
}

export type Series = { label: string; curve: number[] };

export function ResistanceCurve({ series, height = 260 }: { series: Series[]; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const W = 600;
  const H = height;
  const pad = { l: 44, r: 16, t: 16, b: 36 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  return (
    <figure className="w-full">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Resistance profile chart">
        <g transform={`translate(${pad.l},${pad.t})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={0} x2={plotW} y1={t * plotH} y2={t * plotH} stroke="var(--color-rivet)" />
              <text x={-8} y={t * plotH + 4} textAnchor="end" className="fill-ash font-mono text-[10px]">
                {Math.round(100 - t * (100 - MIN))}
              </text>
            </g>
          ))}
          {[0, 25, 50, 75, 100].map((p) => (
            <text key={p} x={(p / 100) * plotW} y={plotH + 18} textAnchor="middle" className="fill-ash font-mono text-[10px]">
              {p}%
            </text>
          ))}
          <text x={0} y={plotH + 32} className="fill-weld font-mono text-[9px] tracking-widest">
            STRETCH
          </text>
          <text x={plotW} y={plotH + 32} textAnchor="end" className="fill-weld font-mono text-[9px] tracking-widest">
            CONTRACTION
          </text>
          {series.map((s, si) => {
            const style = SERIES_STYLES[si % SERIES_STYLES.length];
            const d = smoothPath(toPoints(s.curve, plotW, plotH));
            const area = `${d} L${plotW},${plotH} L0,${plotH} Z`;
            return (
              <g key={s.label + si}>
                {series.length === 1 && (
                  <motion.path
                    d={area}
                    fill="var(--color-chalk)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: inView ? 0.06 : 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                )}
                <motion.path
                  d={d}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={si === 0 ? 3 : 2.5}
                  strokeDasharray={style.dash}
                  strokeLinecap="round"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: inView ? 1 : 0 }}
                  transition={{ duration: 1.4, delay: si * 0.25, ease: [0.65, 0, 0.35, 1] }}
                />
              </g>
            );
          })}
        </g>
      </svg>
      {series.length > 1 && (
        <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {series.map((s, si) => {
            const style = SERIES_STYLES[si % SERIES_STYLES.length];
            return (
              <span key={s.label + si} className="label flex items-center gap-2 text-ash">
                <svg width="28" height="6" aria-hidden>
                  <line x1="0" x2="28" y1="3" y2="3" stroke={style.stroke} strokeWidth="2.5" strokeDasharray={style.dash} />
                </svg>
                {s.label}
              </span>
            );
          })}
        </figcaption>
      )}
    </figure>
  );
}

export function MiniCurve({ curve }: { curve: number[] }) {
  const d = smoothPath(toPoints(curve, 64, 26, 2, 3));
  return (
    <svg viewBox="0 0 64 26" className="h-7 w-16 shrink-0" aria-label="Resistance curve">
      <line x1="0" x2="64" y1="25" y2="25" stroke="var(--color-rivet)" />
      <path
        d={d}
        fill="none"
        stroke="var(--color-chalk)"
        strokeWidth="1.8"
        strokeDasharray="120"
        className="[stroke-dashoffset:0] transition-[stroke-dashoffset] duration-700 group-hover:[stroke-dashoffset:240]"
      />
    </svg>
  );
}
