import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogueBrowser } from "@/components/CatalogueBrowser";
import { PageHeader } from "@/components/PageHeader";
import { getBrand, getBrands, getItemsByBrand, toListItem } from "@/lib/catalogue";

export function generateStaticParams() {
  return getBrands().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const brand = getBrand((await params).slug);
  return brand ? { title: brand.name, description: brand.blurb } : {};
}

export default function BrandPage({ params }: PageProps<"/brands/[slug]">) {
  return (
    <Suspense fallback={<div className="label p-10 text-ash">Loading brand…</div>}>
      <BrandDetail params={params} />
    </Suspense>
  );
}

async function BrandDetail({ params }: Pick<PageProps<"/brands/[slug]">, "params">) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();
  const items = getItemsByBrand(slug).map(toListItem);
  const defunct = brand.status === "defunct";

  return (
    <div className={defunct ? "grain relative" : ""}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <PageHeader
          kicker={`${brand.country}${brand.founded ? ` · est. ${brand.founded}` : ""}${defunct ? ` · ${brand.defunctYear ? `closed ${brand.defunctYear}` : "defunct"}` : ""}`}
          title={brand.name}
        >
          {brand.blurb}
        </PageHeader>
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <Fact label="Status" value={defunct ? "Vintage / defunct" : "In production"} />
          <Fact label="Signature" value={brand.signature} />
          <Fact label="In the catalogue" value={`${items.length} machines`} />
        </div>
        {brand.note && <p className="mb-8 border-l-4 border-chalk pl-4 text-sm text-ash">{brand.note}</p>}
        {brand.website && (
          <a href={brand.website} target="_blank" rel="noreferrer" className="label mb-10 inline-block text-ash underline hover:text-chalk">
            Official site ↗
          </a>
        )}
        <Suspense fallback={null}>
          <CatalogueBrowser items={items} brands={[{ slug: brand.slug, name: brand.name, status: brand.status }]} />
        </Suspense>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-rivet bg-steel p-4">
      <p className="label text-weld">{label}</p>
      <p className="stencil mt-1 text-2xl">{value}</p>
    </div>
  );
}
