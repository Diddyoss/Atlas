"use client";

import { useState } from "react";
import { MUSCLE_LABELS, type Muscle } from "@/lib/types";

type Shape = { m: Muscle; d: string; center?: boolean };

// Left half of each figure in a 120×250 box; shapes mirror around x=60.
const FRONT: Shape[] = [
  { m: "traps", d: "M52 31 L42 40 L55 38 Z" },
  { m: "side-delts", d: "M30 44 Q24 50 26 60 L32 58 Q30 50 34 45 Z" },
  { m: "front-delts", d: "M41 40 Q31 41 33 47 Q32 54 33 59 L40 52 Z" },
  { m: "upper-chest", d: "M58 41 L42 41 L40 51 L58 52 Z" },
  { m: "chest", d: "M58 53 L40 52 L38 60 Q46 68 58 66 Z" },
  { m: "biceps", d: "M33 61 L39 60 Q40 72 37 82 L31 82 Q29 70 33 61 Z" },
  { m: "forearms", d: "M31 85 L37 85 Q36 100 31 112 L25 111 Q26 96 31 85 Z" },
  { m: "abs", d: "M52 70 L68 70 L68 112 Q60 116 52 112 Z", center: true },
  { m: "obliques", d: "M40 66 L50 70 L50 110 L42 102 Q39 84 40 66 Z" },
  { m: "abductors", d: "M40 106 L46 114 L41 130 Q37 118 40 106 Z" },
  { m: "quads", d: "M42 118 L54 122 Q55 148 52 172 L42 170 Q38 142 42 118 Z" },
  { m: "adductors", d: "M55 120 L59 122 L58 150 L54 152 Z" },
  { m: "calves", d: "M43 182 L50 182 Q50 204 48 226 L43 224 Q41 202 43 182 Z" },
];

const BACK: Shape[] = [
  { m: "traps", d: "M60 26 L60 64 L50 50 L40 41 Q50 36 54 30 Z" },
  { m: "side-delts", d: "M30 44 Q24 50 26 60 L32 58 Q30 50 34 45 Z" },
  { m: "rear-delts", d: "M40 40 Q32 42 34 47 Q33 53 34 57 L42 48 Z" },
  { m: "upper-back", d: "M43 49 L50 51 L58 64 L58 74 L44 68 Z" },
  { m: "lats", d: "M42 70 L58 76 L57 96 L50 104 Q40 92 39 66 Z" },
  { m: "lower-back", d: "M52 98 L68 98 L68 114 L52 114 Z", center: true },
  { m: "triceps", d: "M33 60 L39 58 Q41 70 38 82 L31 82 Q29 70 33 60 Z" },
  { m: "forearms", d: "M31 85 L37 85 Q36 100 31 112 L25 111 Q26 96 31 85 Z" },
  { m: "abductors", d: "M40 108 L46 112 L42 124 Q38 116 40 108 Z" },
  { m: "glutes", d: "M46 112 L59 116 L59 138 Q50 141 43 136 Q41 122 46 112 Z" },
  { m: "hamstrings", d: "M43 140 L57 141 Q57 158 54 174 L43 172 Q40 156 43 140 Z" },
  { m: "adductors", d: "M57 140 L59 140 L59 160 L57 160 Z" },
  { m: "calves", d: "M42 182 L51 182 Q53 198 49 216 L43 214 Q39 198 42 182 Z" },
];

function Silhouette() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={0.8} opacity={0.35}>
      <circle cx={60} cy={16} r={11} />
      <path d="M54 27 L54 32 M66 27 L66 32" />
      <path d="M60 34 L42 38 Q28 40 26 52 L24 82 L20 114 L26 116 L34 86 L38 66 L40 106 L40 140 L42 176 L41 228 L50 234 L51 176 L57 140 L60 124 L63 140 L69 176 L70 234 L79 228 L78 176 L80 140 L80 106 L82 66 L86 86 L94 116 L100 114 L96 82 L94 52 Q92 40 78 38 Z" />
    </g>
  );
}

export function BodyMap({
  selected = [],
  secondary = [],
  onToggle,
  compact = false,
}: {
  selected?: Muscle[];
  secondary?: Muscle[];
  onToggle?: (m: Muscle) => void;
  compact?: boolean;
}) {
  const [hover, setHover] = useState<Muscle | null>(null);
  const interactive = !!onToggle;

  const fillFor = (m: Muscle) => {
    if (selected.includes(m)) return "var(--paper)";
    if (secondary.includes(m)) return "var(--mute)";
    if (hover === m) return "var(--line-2)";
    return "var(--ink-3)";
  };

  const renderShapes = (shapes: Shape[]) =>
    shapes.flatMap((s, i) => {
      const common = {
        className: interactive ? "muscle" : undefined,
        fill: fillFor(s.m),
        stroke: "var(--line-2)",
        strokeWidth: 0.6,
        onMouseEnter: () => setHover(s.m),
        onMouseLeave: () => setHover(null),
        onClick: onToggle ? () => onToggle(s.m) : undefined,
      };
      const title = <title>{MUSCLE_LABELS[s.m]}</title>;
      if (s.center) return [<path key={i} d={s.d} {...common}>{title}</path>];
      return [
        <path key={`${i}l`} d={s.d} {...common}>{title}</path>,
        <path key={`${i}r`} d={s.d} transform="translate(120 0) scale(-1 1)" {...common}>{title}</path>,
      ];
    });

  return (
    <div className="select-none">
      <div className={`grid grid-cols-2 gap-2 text-bone ${compact ? "max-w-56" : "max-w-sm"} mx-auto`}>
        {[
          { label: "Front", shapes: FRONT },
          { label: "Back", shapes: BACK },
        ].map((f) => (
          <figure key={f.label} className="flex flex-col items-center">
            <svg viewBox="0 0 120 240" className="w-full" role={interactive ? "group" : "img"} aria-label={`${f.label} muscle map`}>
              <Silhouette />
              {renderShapes(f.shapes)}
            </svg>
            <figcaption className="label mt-1">{f.label}</figcaption>
          </figure>
        ))}
      </div>
      {interactive && (
        <p className="label mt-3 h-4 text-center text-paper">
          {hover ? MUSCLE_LABELS[hover] : selected.length ? `${selected.length} selected` : "Tap a muscle"}
        </p>
      )}
    </div>
  );
}
