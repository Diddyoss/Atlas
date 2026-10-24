"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { CatalogueItem } from "@/lib/types";
import { LOADING_LABELS, MOVEMENT_LABELS } from "@/lib/types";
import { MUSCLES } from "@/lib/muscles";
import { toCompareEntry } from "@/lib/compare";
import { useCompare } from "@/lib/compare-store";
import { EquipmentVisual } from "./EquipmentVisual";
import { MiniCurve } from "./ResistanceCurve";

export function EquipmentCard({ item, index = 0 }: { item: CatalogueItem; index?: number }) {
  const compare = useCompare();
  const inCompare = compare.has(item.slug);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index, 12) * 0.035 }}
      className="group relative flex flex-col border border-rivet bg-plate transition-colors hover:border-ash"
    >
      <Link href={`/equipment/${item.slug}`} className="flex flex-1 flex-col">
        <div className="relative">
          <EquipmentVisual item={item} className="aspect-[10/7]" />
          {item.vintage && (
            <span className="label absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] -rotate-2 truncate border-2 border-chalk bg-ink/90 px-2 py-0.5 text-[0.62rem] text-chalk">
              Discontinued{item.years ? ` · ${item.years}` : ""}
            </span>
          )}
          {item.editorialFavorite && (
            <span className="label absolute right-3 top-3 z-10 bg-chalk px-2 py-0.5 text-ink">★ Pick</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <p className="label text-ash">
              {item.brand.name}
              {item.series ? ` · ${item.series}` : ""}
            </p>
            <h3 className="stencil mt-1 text-2xl group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
              {item.name}
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Tag>{MOVEMENT_LABELS[item.movement]}</Tag>
            <Tag>{LOADING_LABELS[item.loading]}</Tag>
            {item.isoLateral && <Tag>Iso-lateral</Tag>}
            {item.estimated && <Tag>Estimated</Tag>}
          </div>
          <div className="mt-auto flex items-end justify-between gap-3">
            <p className="text-xs text-ash">{item.primaryMuscles.map((m) => MUSCLES[m].label).join(" · ")}</p>
            <MiniCurve curve={item.resistanceProfile.curve} />
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => compare.toggle(toCompareEntry(item))}
        disabled={!inCompare && compare.full}
        className={`label border-t border-rivet px-4 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:text-weld ${
          inCompare ? "bg-chalk text-ink" : "text-ash hover:bg-rivet hover:text-chalk"
        }`}
      >
        {inCompare ? "✓ In compare — remove" : compare.full ? "Compare full (4)" : "+ Add to compare"}
      </button>
    </motion.article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="label border border-rivet px-1.5 py-0.5 text-[0.62rem] text-ash">{children}</span>;
}
