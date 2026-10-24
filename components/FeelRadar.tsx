"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { FEEL_LABELS, type CatalogueItem, type FeelKey } from "@/lib/types";
import { SERIES_STYLES } from "./ResistanceCurve";

const KEYS = Object.keys(FEEL_LABELS) as FeelKey[];

export function FeelRadar({ items }: { items: { label: string; feel: CatalogueItem["feel"] }[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const S = 320;
  const c = S / 2;
  const R = 110;
  const angle = (i: number) => (Math.PI * 2 * i) / KEYS.length - Math.PI / 2;
  const pt = (i: number, v: number) => [c + Math.cos(angle(i)) * (R * v) / 10, c + Math.sin(angle(i)) * (R * v) / 10];

  return (
    <svg ref={ref} viewBox={`0 0 ${S} ${S}`} className="mx-auto w-full max-w-sm" role="img" aria-label="Feel radar chart">
      {[2, 4, 6, 8, 10].map((r) => (
        <polygon
          key={r}
          points={KEYS.map((_, i) => pt(i, r).join(",")).join(" ")}
          fill="none"
          stroke="var(--color-rivet)"
        />
      ))}
      {KEYS.map((k, i) => {
        const [x, y] = pt(i, 10);
        const [lx, ly] = pt(i, 12.6);
        return (
          <g key={k}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="var(--color-rivet)" />
            <text x={lx} y={ly + 3} textAnchor="middle" className="fill-ash font-mono text-[9px] uppercase tracking-wider">
              {FEEL_LABELS[k]}
            </text>
          </g>
        );
      })}
      {items.map((it, si) => {
        const style = SERIES_STYLES[si % SERIES_STYLES.length];
        const points = KEYS.map((k, i) => pt(i, it.feel[k]).join(",")).join(" ");
        return (
          <motion.polygon
            key={it.label + si}
            points={points}
            fill={items.length === 1 ? "var(--color-chalk)" : "none"}
            fillOpacity={0.12}
            stroke={style.stroke}
            strokeWidth={2}
            strokeDasharray={style.dash}
            style={{ transformOrigin: `${c}px ${c}px` }}
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: "spring", stiffness: 120, damping: 16, delay: si * 0.15 }}
          />
        );
      })}
    </svg>
  );
}
