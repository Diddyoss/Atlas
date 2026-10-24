import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND_MAP } from "@/data/brands";
import { getMachine, MACHINES } from "@/data/machines";
import { MachineDetail } from "@/components/MachineDetail";

export function generateStaticParams() {
  return MACHINES.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/machines/[id]">): Promise<Metadata> {
  const { id } = await params;
  const m = getMachine(id);
  if (!m) return {};
  return { title: `${BRAND_MAP[m.brand].name} ${m.name}`, description: m.description };
}

export default async function MachinePage({ params }: PageProps<"/machines/[id]">) {
  const { id } = await params;
  const m = getMachine(id);
  if (!m) notFound();
  return <MachineDetail m={m} />;
}
