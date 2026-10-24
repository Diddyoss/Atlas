import Link from "next/link";

export function Marquee({ items }: { items: { slug: string; name: string; defunct: boolean }[] }) {
  const row = [...items, ...items];
  return (
    <div className="group relative overflow-hidden border-b border-rivet bg-steel py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-steel to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-steel to-transparent" />
      <div className="flex w-max animate-marquee gap-10 group-hover:[animation-play-state:paused]">
        {row.map((b, i) => (
          <Link
            key={`${b.slug}-${i}`}
            href={`/brands/${b.slug}`}
            className={`stencil whitespace-nowrap text-3xl transition-colors hover:text-chalk ${b.defunct ? "text-weld" : "text-ash"}`}
          >
            {b.name}
            <span className="ml-10 text-rivet">✕</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
