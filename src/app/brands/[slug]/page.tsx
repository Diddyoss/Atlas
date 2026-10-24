import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND_MAP, BRANDS } from "@/data/brands";
import { BrandDetail } from "@/components/BrandDetail";

export function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = BRAND_MAP[slug];
  return b ? { title: b.name, description: b.blurb } : {};
}

export default async function BrandPage({ params }: PageProps<"/brands/[slug]">) {
  const { slug } = await params;
  const b = BRAND_MAP[slug];
  if (!b) notFound();
  return <BrandDetail b={b} />;
}
