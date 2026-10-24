"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Suspense } from "react";
import { MAX_COMPARE } from "@/lib/compare";
import { useCompare } from "@/lib/compare-store";
import { MOVEMENT_LABELS } from "@/lib/types";

export function CompareTray() {
  return (
    <Suspense fallback={null}>
      <Tray />
    </Suspense>
  );
}

function Tray() {
  const { entries, remove, clear } = useCompare();
  const path = usePathname();
  const show = entries.length > 0 && path.replace(/\/$/, "") !== "/compare";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 140 }}
          animate={{ y: 0 }}
          exit={{ y: 140 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-chalk bg-ink/95 backdrop-blur"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-8">
            <span className="label hidden text-ash md:block">
              Compare
              <br />
              {entries.length}/{MAX_COMPARE}
            </span>
            <div className="scrollbar-none flex flex-1 gap-2 overflow-x-auto">
              {Array.from({ length: MAX_COMPARE }, (_, i) => {
                const e = entries[i];
                return (
                  <div key={i} className="relative h-14 min-w-[150px] flex-1 border border-dashed border-rivet">
                    <AnimatePresence mode="popLayout">
                      {e && (
                        <motion.div
                          key={e.slug}
                          initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 22 }}
                          className="absolute inset-0 flex items-center justify-between gap-2 border border-ash bg-plate px-3"
                        >
                          <div className="min-w-0">
                            <p className="label truncate text-[0.6rem] text-ash">
                              {e.brand} · {MOVEMENT_LABELS[e.movement]}
                            </p>
                            <p className="truncate text-sm">{e.name}</p>
                          </div>
                          <button onClick={() => remove(e.slug)} aria-label={`Remove ${e.name}`} className="text-ash hover:text-chalk">
                            ×
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-1">
              <Link
                href={`/compare?ids=${entries.map((e) => e.slug).join(",")}`}
                className={`label px-4 py-2.5 text-center ${entries.length >= 2 ? "bg-chalk text-ink" : "pointer-events-none bg-rivet text-weld"}`}
              >
                Compare →
              </Link>
              <button onClick={clear} className="label text-[0.6rem] text-weld hover:text-chalk">
                Clear
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
