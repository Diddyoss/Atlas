"use client";

import { useCompare } from "@/lib/store";

export function CompareButton({ id, size = "sm" }: { id: string; size?: "sm" | "lg" }) {
  const { has, toggle, full } = useCompare();
  const on = has(id);
  const disabled = !on && full;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      disabled={disabled}
      aria-pressed={on}
      title={disabled ? "Compare holds up to 4 machines" : on ? "Remove from compare" : "Add to compare"}
      className={`inline-flex items-center gap-2 border font-mono uppercase tracking-wider transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        size === "lg" ? "px-4 py-2.5 text-xs" : "px-2.5 py-1 text-[10px]"
      } ${on ? "border-paper bg-paper text-ink" : "border-line-2 text-bone hover:border-paper"}`}
    >
      <span key={String(on)} className="pop inline-block">{on ? "✓" : "+"}</span>
      {on ? "Comparing" : "Compare"}
    </button>
  );
}
