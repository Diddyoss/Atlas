"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_MAP } from "@/data/brands";
import { MACHINE_MAP } from "@/data/machines";
import { MAX_COMPARE } from "@/lib/compare";
import { useCompare } from "@/lib/store";
import { MachineArt } from "./MachineArt";

export function CompareTray() {
  const { ids, remove, clear } = useCompare();
  const path = usePathname();
  const machines = ids.map((id) => MACHINE_MAP[id]).filter(Boolean);
  if (machines.length === 0 || path.startsWith("/compare")) return null;

  return (
    <div className="tray-in fixed inset-x-0 bottom-0 z-40 border-t border-paper bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 py-3">
        <span className="label hidden shrink-0 sm:block">
          Compare {machines.length}/{MAX_COMPARE}
        </span>
        <ul className="flex gap-2">
          {machines.map((m) => (
            <li key={m.id} className="rise flex shrink-0 items-center gap-2 border border-line bg-ink-2 py-1 pl-1 pr-2">
              <MachineArt movement={m.movement} load={m.load} className="h-8 w-10 text-bone" />
              <span className="max-w-36 truncate text-xs">
                <span className="text-mute">{BRAND_MAP[m.brand].name} </span>
                {m.name}
              </span>
              <button onClick={() => remove(m.id)} className="text-mute hover:text-paper" aria-label={`Remove ${m.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex shrink-0 gap-2">
          <button onClick={clear} className="px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-mute hover:text-paper">
            Clear
          </button>
          <Link
            href={`/compare?ids=${ids.join(",")}`}
            className={`bg-paper px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink transition-opacity ${
              machines.length < 2 ? "pointer-events-none opacity-40" : "hover:opacity-85"
            }`}
          >
            Compare →
          </Link>
        </div>
      </div>
    </div>
  );
}
