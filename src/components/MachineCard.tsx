import Link from "next/link";
import { BRAND_MAP } from "@/data/brands";
import { LOAD_LABELS, MOVEMENT_LABELS, MUSCLE_LABELS, type Machine } from "@/lib/types";
import { CompareButton } from "./CompareButton";
import { MachineVisual } from "./MachineVisual";
import { MiniCurve } from "./MiniCurve";

export function MachineCard({ m, index = 0 }: { m: Machine; index?: number }) {
  const brand = BRAND_MAP[m.brand];
  return (
    <article
      className="card rise group relative flex flex-col border border-line bg-ink-2"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="grid-bg relative aspect-[4/3] border-b border-line p-6">
        <MachineVisual m={m} />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="label bg-ink px-1.5 py-0.5 text-bone">{LOAD_LABELS[m.load]}</span>
          {m.unilateral && <span className="label bg-paper px-1.5 py-0.5 text-ink">Iso</span>}
          {brand.status === "legacy" && <span className="label bg-hazard px-1.5 py-0.5 text-ink">Vintage</span>}
        </div>
        <div className="absolute right-3 top-3 z-10">
          <CompareButton id={m.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="label">{brand.name}{m.line ? ` · ${m.line}` : ""}</p>
          <h3 className="mt-1 text-lg font-bold leading-tight text-paper">
            <Link href={`/machines/${m.id}`} className="after:absolute after:inset-0">
              {m.name}
            </Link>
          </h3>
        </div>
        <p className="text-xs text-mute">
          {MOVEMENT_LABELS[m.movement]} · {m.primary.map((x) => MUSCLE_LABELS[x]).join(", ")}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3">
          <MiniCurve m={m} />
          <div className="text-right">
            <p className="label">Feel</p>
            <p className="font-mono text-2xl leading-none text-paper">{m.ratings.feel.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
