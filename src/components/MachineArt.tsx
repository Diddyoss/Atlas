import type { LoadType, Movement } from "@/lib/types";

/**
 * Generated line-art for a machine. It stands in until a real product photo
 * is scraped, and keeps the whole catalogue in one visual language.
 */
type Template = "press" | "tower" | "pulldown" | "row" | "sled" | "legpress" | "legmachine" | "thrust" | "standing";

const TEMPLATE: Record<Movement, Template> = {
  "chest-press": "press",
  "incline-press": "press",
  "shoulder-press": "press",
  dip: "press",
  fly: "tower",
  "rear-delt": "tower",
  "lateral-raise": "tower",
  "ab-crunch": "tower",
  "back-extension": "tower",
  pulldown: "pulldown",
  pullover: "pulldown",
  row: "row",
  curl: "row",
  triceps: "row",
  squat: "sled",
  "hack-squat": "sled",
  "leg-press": "legpress",
  "leg-extension": "legmachine",
  "leg-curl": "legmachine",
  "hip-ab-ad": "legmachine",
  "hip-thrust": "thrust",
  "glute-kickback": "standing",
  calf: "standing",
  shrug: "standing",
};

const S = { stroke: "currentColor", strokeWidth: 2.2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function Plates({ x, y }: { x: number; y: number }) {
  return (
    <g className="plate-spin">
      <circle cx={x} cy={y} r={17} {...S} />
      <circle cx={x} cy={y} r={11} {...S} strokeWidth={1.2} opacity={0.6} />
      <circle cx={x} cy={y} r={3} fill="currentColor" />
      <line x1={x} y1={y - 17} x2={x} y2={y - 11} {...S} strokeWidth={1.2} />
    </g>
  );
}

function Stack({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 2} y={20} width={30} height={110} {...S} strokeWidth={1.4} opacity={0.55} />
      <g className="stack-pump">
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={x + 3} y={70 + i * 8} width={20} height={6} fill="currentColor" opacity={0.85 - i * 0.06} />
        ))}
        <line x1={x + 13} y1={24} x2={x + 13} y2={70} {...S} strokeWidth={1.4} />
      </g>
    </g>
  );
}

function Pulley({ x }: { x: number }) {
  return (
    <g>
      <line x1={x} y1={20} x2={x} y2={130} {...S} />
      <circle cx={x} cy={24} r={6} {...S} />
      <path d={`M${x} 30 L${x - 50} 80`} {...S} strokeWidth={1.2} strokeDasharray="3 3" />
      <rect x={x + 6} y={60} width={18} height={60} fill="currentColor" opacity={0.7} className="stack-pump" />
    </g>
  );
}

function Body({ t, movement }: { t: Template; movement: Movement }) {
  const incline = movement === "incline-press" ? -14 : movement === "shoulder-press" ? -24 : 0;
  switch (t) {
    case "press":
      return (
        <g>
          <path d="M40 130 L40 100 L80 100" {...S} />
          <rect x={44} y={92} width={36} height={8} rx={3} {...S} />
          <g transform={`rotate(${incline} 82 96)`}>
            <rect x={76} y={40} width={9} height={56} rx={3} {...S} />
          </g>
          <path d="M100 130 L100 30 L140 30" {...S} />
          <path d="M100 34 Q70 50 54 72" {...S} />
          <line x1={48} y1={72} x2={60} y2={72} {...S} strokeWidth={4} />
        </g>
      );
    case "tower":
      return (
        <g>
          <path d="M50 130 L50 98 L84 98" {...S} />
          <rect x={52} y={90} width={30} height={8} rx={3} {...S} />
          <rect x={84} y={46} width={8} height={48} rx={3} {...S} />
          <path d="M110 130 L110 22" {...S} />
          <path d="M110 40 L70 48 M110 40 L150 48" {...S} />
          <rect x={62} y={44} width={10} height={20} rx={3} {...S} />
          <rect x={148} y={44} width={10} height={20} rx={3} {...S} />
        </g>
      );
    case "pulldown":
      return (
        <g>
          <path d="M60 130 L60 100 L96 100" {...S} />
          <rect x={60} y={92} width={34} height={8} rx={3} {...S} />
          <rect x={64} y={76} width={26} height={7} rx={3} {...S} />
          <path d="M100 130 L100 16 L60 16" {...S} />
          <path d="M60 16 L50 50" {...S} />
          <line x1={34} y1={52} x2={66} y2={48} {...S} strokeWidth={4} />
        </g>
      );
    case "row":
      return (
        <g>
          <path d="M30 130 L30 104 L64 104" {...S} />
          <rect x={30} y={96} width={32} height={8} rx={3} {...S} />
          <rect x={74} y={58} width={8} height={36} rx={3} {...S} transform="rotate(12 78 76)" />
          <path d="M70 130 L90 70 L130 70 L130 130" {...S} />
          <path d="M120 40 Q100 60 92 82" {...S} />
          <line x1={86} y1={84} x2={98} y2={80} {...S} strokeWidth={4} />
        </g>
      );
    case "sled":
      return (
        <g>
          <path d="M20 130 L170 130" {...S} />
          <path d="M40 130 L140 30" {...S} strokeWidth={3} />
          <path d="M56 128 L156 28" {...S} strokeWidth={1.2} opacity={0.6} />
          <rect x={86} y={62} width={14} height={34} rx={3} {...S} transform="rotate(-45 93 79)" />
          <path d="M100 66 Q110 52 120 58" {...S} />
          <rect x={22} y={118} width={44} height={6} {...S} />
        </g>
      );
    case "legpress":
      return (
        <g>
          <path d="M20 130 L180 130" {...S} />
          <path d="M60 130 L160 30" {...S} strokeWidth={3} />
          <rect x={112} y={52} width={30} height={10} {...S} transform="rotate(-45 127 57)" />
          <path d="M20 118 L58 118 L42 84" {...S} />
          <rect x={22} y={110} width={34} height={8} rx={3} {...S} />
        </g>
      );
    case "legmachine":
      return (
        <g>
          <path d="M40 130 L40 98 L90 98" {...S} />
          <rect x={44} y={90} width={46} height={8} rx={3} {...S} />
          <rect x={44} y={44} width={8} height={46} rx={3} {...S} />
          <path d="M92 94 L120 128" {...S} />
          <circle cx={92} cy={94} r={4} fill="currentColor" />
          <rect x={112} y={118} width={18} height={8} rx={4} {...S} />
          <path d="M130 130 L130 40" {...S} />
        </g>
      );
    case "thrust":
      return (
        <g>
          <path d="M20 130 L180 130" {...S} />
          <rect x={28} y={98} width={48} height={10} rx={3} {...S} />
          <path d="M34 108 L34 130 M70 108 L70 130" {...S} />
          <path d="M120 130 L120 74 L80 82" {...S} />
          <rect x={70} y={78} width={22} height={9} rx={4} {...S} />
          <rect x={130} y={118} width={30} height={6} {...S} />
        </g>
      );
    case "standing":
      return (
        <g>
          <path d="M30 130 L170 130" {...S} />
          <rect x={50} y={120} width={40} height={6} {...S} />
          <path d="M110 130 L110 30 L60 50" {...S} />
          <rect x={56} y={44} width={22} height={9} rx={4} {...S} />
          <path d="M60 50 L60 60" {...S} />
        </g>
      );
  }
}

export function MachineArt({
  movement,
  load,
  className = "",
  live = false,
}: {
  movement: Movement;
  load: LoadType;
  className?: string;
  live?: boolean;
}) {
  const t = TEMPLATE[movement];
  return (
    <svg viewBox="0 0 200 150" className={`art ${live ? "live" : ""} ${className}`} role="img" aria-label="Machine illustration">
      <line x1={8} y1={136} x2={192} y2={136} stroke="currentColor" strokeWidth={0.8} opacity={0.35} strokeDasharray="2 4" />
      <Body t={t} movement={movement} />
      {load === "plate-loaded" && <Plates x={t === "legpress" || t === "sled" ? 150 : 158} y={t === "legpress" || t === "sled" ? 92 : 100} />}
      {load === "selectorized" && <Stack x={160} />}
      {load === "cable" && <Pulley x={170} />}
    </svg>
  );
}
