"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { CatalogueItem } from "@/lib/types";
import { stretchBias } from "@/lib/compare";
import { ResistanceCurve } from "./ResistanceCurve";

export function ProfileViewer({ profile }: { profile: CatalogueItem["resistanceProfile"] }) {
  const variants = profile.variants ?? [];
  const [active, setActive] = useState<number | "all">(variants.length ? "all" : 0);
  const series =
    variants.length === 0
      ? [{ label: "Profile", curve: profile.curve }]
      : active === "all"
        ? variants
        : [variants[active]];
  const bias = stretchBias(series[0].curve);

  return (
    <div>
      {variants.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1 border border-rivet p-1">
          {(["all", ...variants.map((_, i) => i)] as const).map((v) => (
            <button
              key={String(v)}
              onClick={() => setActive(v)}
              className={`label relative flex-1 px-3 py-2 ${active === v ? "text-ink" : "text-ash hover:text-chalk"}`}
            >
              {active === v && <motion.span layoutId="variant" className="absolute inset-0 bg-chalk" />}
              <span className="relative">{v === "all" ? "Overlay all" : variants[v].label}</span>
            </button>
          ))}
        </div>
      )}
      <ResistanceCurve key={String(active)} series={series} />
      <div className="mt-4 flex flex-wrap gap-6">
        <Stat label="Shape" value={profile.shape} />
        {series.length === 1 && (
          <Stat label="Stretch bias" value={bias > 0 ? `+${bias}` : String(bias)} hint="early − late load" />
        )}
      </div>
      <p className="mt-4 text-sm text-ash">{profile.notes}</p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="label text-weld">{label}</p>
      <p className="stencil text-2xl">{value}</p>
      {hint && <p className="font-mono text-[10px] text-weld">{hint}</p>}
    </div>
  );
}
