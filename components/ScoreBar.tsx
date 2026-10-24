"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref}>
      <div className="flex justify-between">
        <span className="label text-ash">{label}</span>
        <span className="font-mono text-sm">{value}</span>
      </div>
      <div className="mt-1.5 flex h-2 gap-[3px]">
        {Array.from({ length: max }, (_, i) => (
          <motion.span
            key={i}
            className={`flex-1 ${i < Math.round(value) ? "bg-chalk" : "bg-rivet"}`}
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ delay: i * 0.04, duration: 0.25 }}
          />
        ))}
      </div>
    </div>
  );
}
