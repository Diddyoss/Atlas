import Image from "next/image";
import type { CatalogueItem } from "@/lib/types";
import { MOVEMENT_LABELS, LOADING_LABELS } from "@/lib/types";

type Props = {
  item: Pick<CatalogueItem, "images" | "name" | "loading" | "movement">;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Product photo when we have one, otherwise a blueprint-style schematic of the loading type. */
export function EquipmentVisual({ item, className = "", sizes = "(max-width: 640px) 100vw, 33vw", priority }: Props) {
  const img = item.images[0];
  return (
    <div className={`relative overflow-hidden bg-steel ${className}`}>
      {img ? (
        <Image
          src={img.src.startsWith("/") ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${img.src}` : img.src}
          alt={item.name}
          fill
          sizes={sizes}
          priority={priority}
          className="photo-mono object-contain p-3"
        />
      ) : (
        <Blueprint loading={item.loading} label={MOVEMENT_LABELS[item.movement]} />
      )}
    </div>
  );
}

function Blueprint({ loading, label }: { loading: CatalogueItem["loading"]; label: string }) {
  return (
    <svg viewBox="0 0 200 140" className="bg-grid absolute inset-0 h-full w-full [background-size:16px_16px]" aria-hidden>
      <g fill="none" stroke="var(--color-ash)" strokeWidth="1.5" className="transition-transform duration-700 group-hover:translate-x-1">
        {/* base frame */}
        <path d="M30 118H170M40 118V60M40 60H90" />
        {loading === "plate" && (
          <>
            <path d="M40 75L135 45" />
            <circle cx="140" cy="44" r="22" />
            <circle cx="140" cy="44" r="14" strokeDasharray="2 3" />
            <circle cx="140" cy="44" r="3" fill="var(--color-ash)" />
          </>
        )}
        {loading === "selectorized" && (
          <>
            <path d="M120 118V28H160V118" />
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x="125" y={70 + i * 6} width="30" height="4" />
            ))}
            <path d="M140 28V66M90 60L140 28" strokeDasharray="3 2" />
          </>
        )}
        {loading === "cable" && (
          <>
            <path d="M60 118V24M150 118V24M60 24H150" />
            <circle cx="60" cy="30" r="5" />
            <circle cx="150" cy="30" r="5" />
            <path d="M60 35L100 80M150 35L110 80" strokeDasharray="3 2" />
          </>
        )}
        {(loading === "free-weight" || loading === "bench-rack") && (
          <>
            <path d="M55 118V22M145 118V22M55 22H145" />
            <path d="M35 58H165" strokeWidth="3" />
            <rect x="38" y="44" width="8" height="28" />
            <rect x="154" y="44" width="8" height="28" />
            <path d="M75 100H125V92H75Z" />
          </>
        )}
      </g>
      <text x="12" y="20" fill="var(--color-ash)" fontFamily="var(--font-mono)" fontSize="7" letterSpacing="1.5">
        {label.toUpperCase()}
      </text>
      <text x="12" y="132" fill="var(--color-weld)" fontFamily="var(--font-mono)" fontSize="6" letterSpacing="1.2">
        {LOADING_LABELS[loading].toUpperCase()} · NO PHOTO YET
      </text>
    </svg>
  );
}
