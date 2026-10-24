import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { getBrands, getItemsByBrand } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Brands" };

export default function BrandsPage() {
  const brands = getBrands();
  const groups = [
    { title: "On the floor", list: brands.filter((b) => b.status === "active") },
    { title: "In the vault", list: brands.filter((b) => b.status === "defunct") },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <PageHeader kicker={`${brands.length} manufacturers`} title="The Makers" />
      {groups.map((g) => (
        <section key={g.title} className="mb-14">
          <h2 className="label mb-4 flex items-center gap-3 text-ash">
            <span className="hazard inline-block h-3 w-10" />
            {g.title}
          </h2>
          <div className="grid gap-px bg-rivet sm:grid-cols-2 lg:grid-cols-3">
            {g.list.map((b, i) => (
              <Reveal key={b.slug} delay={(i % 3) * 0.06}>
                <Link href={`/brands/${b.slug}`} className="group relative block h-full overflow-hidden bg-ink p-6">
                  <span className="absolute inset-0 origin-left scale-x-0 bg-chalk transition-transform duration-500 ease-out group-hover:scale-x-100" />
                  <div className="relative transition-colors duration-500 group-hover:text-ink">
                    <div className="flex items-baseline justify-between">
                      <p className="label opacity-60">
                        {b.country}
                        {b.founded ? ` · est. ${b.founded}` : ""}
                      </p>
                      <p className="label opacity-60">{getItemsByBrand(b.slug).length} machines</p>
                    </div>
                    <p className="stencil mt-3 text-4xl">{b.name}</p>
                    <p className="label mt-2 opacity-70">{b.signature}</p>
                    <p className="mt-4 line-clamp-3 text-sm opacity-70">{b.blurb}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
