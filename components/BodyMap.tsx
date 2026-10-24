"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MUSCLES, type MuscleId } from "@/lib/muscles";

type Shape = { id: MuscleId; points: string };

// Left half of each view (viewBox 0 0 200 360); mirrored across x=100 for the other side.
const FRONT: Shape[] = [
  { id: "upper-chest", points: "100,62 72,64 66,76 100,79" },
  { id: "chest", points: "100,79 66,76 64,96 78,104 100,102" },
  { id: "front-delts", points: "70,62 57,62 54,70 53,80 60,88 66,76" },
  { id: "side-delts", points: "56,62 46,70 44,86 52,80 54,70" },
  { id: "biceps", points: "51,88 61,91 58,124 46,122" },
  { id: "forearms", points: "46,126 58,128 54,168 42,166" },
  { id: "abs", points: "100,104 83,106 83,170 100,174" },
  { id: "obliques", points: "80,104 66,100 68,150 81,166" },
  { id: "abductors", points: "67,156 60,176 63,202 72,182" },
  { id: "quads", points: "82,176 72,182 64,204 67,262 84,266 92,214" },
  { id: "adductors", points: "100,180 85,176 93,214 97,240 100,204" },
  { id: "calves", points: "68,276 84,276 82,340 71,340" },
];

const BACK: Shape[] = [
  { id: "traps", points: "100,46 82,58 72,64 100,96" },
  { id: "rear-delts", points: "72,64 57,62 50,74 56,86 68,77" },
  { id: "side-delts", points: "56,62 46,70 44,86 50,80" },
  { id: "upper-back", points: "100,96 72,64 67,80 77,110 100,116" },
  { id: "lats", points: "67,80 61,100 70,140 86,150 77,110" },
  { id: "lower-back", points: "100,116 77,110 86,150 100,158" },
  { id: "triceps", points: "51,88 61,90 58,124 46,122" },
  { id: "forearms", points: "46,126 58,128 54,168 42,166" },
  { id: "glutes", points: "100,160 85,152 68,158 66,188 84,198 100,192" },
  { id: "hamstrings", points: "98,200 84,198 66,190 66,258 84,262 96,240" },
  { id: "calves", points: "68,268 86,268 84,332 70,332" },
];

const SILHOUETTE = "M100,10 a18,18 0 1,0 0.1,0 M90,46 h20 v10 h-20 Z";

type Props = {
  selected?: MuscleId[];
  secondary?: MuscleId[];
  onToggle?: (id: MuscleId) => void;
  compact?: boolean;
};

type Tip = { id: MuscleId; x: number; y: number };

export function BodyMap({ selected = [], secondary = [], onToggle, compact }: Props) {
  const [hover, setHover] = useState<MuscleId | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const interactive = Boolean(onToggle);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  /** Place the label at a viewport point, kept inside the map's box. */
  const showTip = (id: MuscleId, clientX: number, clientY: number, autoHide = false) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    clearTimeout(hideTimer.current);
    setTip({ id, x: Math.min(Math.max(clientX - box.left, 56), box.width - 56), y: clientY - box.top });
    // Touch has no "leave" event, so a tapped label fades on its own
    if (autoHide) hideTimer.current = setTimeout(() => setTip(null), 1600);
  };

  const tipStatus = (id: MuscleId) => {
    if (interactive) return selected.includes(id) ? "Selected · tap to remove" : "Tap to filter";
    if (selected.includes(id)) return "Primary mover";
    if (secondary.includes(id)) return "Secondary";
    return "Not targeted";
  };

  const fill = (id: MuscleId) => {
    if (selected.includes(id)) return "var(--color-chalk)";
    if (secondary.includes(id)) return "var(--color-ash)";
    if (hover === id) return "var(--color-weld)";
    return "var(--color-plate)";
  };

  const view = (shapes: Shape[], title: string) => (
    <svg viewBox="0 0 200 350" className="w-full" role="group" aria-label={`${title} muscle map`}>
      <path d={SILHOUETTE} fill="var(--color-rivet)" />
      {[false, true].map((mirror) => (
        <g key={String(mirror)} transform={mirror ? "translate(200,0) scale(-1,1)" : undefined}>
          {shapes.map((s) => {
            const active = selected.includes(s.id);
            return (
              <polygon
                key={s.id}
                points={s.points}
                fill={fill(s.id)}
                stroke={active ? "var(--color-ink)" : "var(--color-weld)"}
                strokeWidth={1}
                strokeLinejoin="round"
                className={`transition-[fill] duration-300 ${interactive ? "cursor-pointer" : ""}`}
                onPointerEnter={(e) => {
                  setHover(s.id);
                  if (e.pointerType === "mouse") showTip(s.id, e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  if (e.pointerType === "mouse") showTip(s.id, e.clientX, e.clientY);
                }}
                onPointerLeave={(e) => {
                  setHover(null);
                  if (e.pointerType === "mouse") setTip(null);
                }}
                onPointerUp={(e) => {
                  if (e.pointerType !== "mouse") showTip(s.id, e.clientX, e.clientY, true);
                }}
                onFocus={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  showTip(s.id, r.left + r.width / 2, r.top);
                }}
                onBlur={() => setTip(null)}
                onClick={() => onToggle?.(s.id)}
                role={interactive ? "button" : undefined}
                aria-label={interactive ? `${active ? "Remove" : "Filter by"} ${MUSCLES[s.id].label}` : MUSCLES[s.id].label}
                aria-pressed={interactive ? active : undefined}
                tabIndex={interactive && !mirror ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle?.(s.id);
                  }
                }}
              />
            );
          })}
        </g>
      ))}
      <text x="100" y="348" textAnchor="middle" className="fill-weld font-mono text-[9px] tracking-[0.2em]">
        {title.toUpperCase()}
      </text>
    </svg>
  );

  return (
    <div>
      <div ref={wrapRef} className={`relative grid grid-cols-2 gap-2 ${compact ? "max-w-[220px]" : ""}`}>
        {view(FRONT, "Front")}
        {view(BACK, "Back")}
        <AnimatePresence>
          {tip && (
            <motion.div
              key="tip"
              role="tooltip"
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+12px)] whitespace-nowrap border border-chalk bg-ink px-3 py-1.5 shadow-[4px_4px_0_var(--color-rivet)]"
              style={{ left: tip.x, top: tip.y }}
            >
              <p className="stencil text-lg leading-none">{MUSCLES[tip.id].label}</p>
              <p className="label mt-1 text-[0.58rem] text-ash">
                {MUSCLES[tip.id].group} · {tipStatus(tip.id)}
              </p>
              <span className="absolute -bottom-[6px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-chalk bg-ink" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {interactive && (
        <p className="label mt-2 h-4 text-center text-ash" aria-live="polite">
          {hover ? MUSCLES[hover].label : selected.length ? `${selected.length} selected` : "Tap a muscle"}
        </p>
      )}
    </div>
  );
}
