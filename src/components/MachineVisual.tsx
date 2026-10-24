import type { Machine } from "@/lib/types";
import { MachineArt } from "./MachineArt";

/** Shows the scraped product photo when there is one, otherwise the line-art. */
export function MachineVisual({ m, live = false, className = "" }: { m: Machine; live?: boolean; className?: string }) {
  if (m.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote brand images, unoptimised static export
      <img src={m.image} alt={m.name} loading="lazy" className={`h-full w-full object-contain grayscale ${className}`} />
    );
  }
  return <MachineArt movement={m.movement} load={m.load} live={live} className={`h-full w-full text-bone ${className}`} />;
}
