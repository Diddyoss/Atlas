"use client";

import { motion } from "motion/react";

export function PageHeader({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8 border-b border-rivet pb-6">
      <motion.p
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
        className="label text-ash"
      >
        {kicker}
      </motion.p>
      <h1 className="stencil mt-2 overflow-hidden text-5xl sm:text-7xl">
        {title.split(" ").map((w, i) => (
          <motion.span
            key={i}
            className="mr-[0.2em] inline-block"
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
          </motion.span>
        ))}
      </h1>
      {children && <div className="mt-4 max-w-2xl text-ash">{children}</div>}
    </header>
  );
}
