"use client";

import { motion } from "motion/react";
import type { CompareEntry } from "@/lib/compare";
import { useCompare } from "@/lib/compare-store";

export function CompareButton({ entry }: { entry: CompareEntry }) {
  const compare = useCompare();
  const on = compare.has(entry.slug);
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => compare.toggle(entry)}
      disabled={!on && compare.full}
      className={`label border-2 px-5 py-3 transition-colors disabled:cursor-not-allowed disabled:border-rivet disabled:text-weld ${
        on ? "border-chalk bg-chalk text-ink" : "border-chalk text-chalk hover:bg-chalk hover:text-ink"
      }`}
    >
      {on ? "✓ In compare" : compare.full ? "Compare is full" : "+ Add to compare"}
    </motion.button>
  );
}
