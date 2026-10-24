"use client";

import { useRouter } from "next/navigation";
import { BodyMap } from "./BodyMap";

/** Home-page body map: clicking a muscle opens the catalogue filtered to it. */
export function MuscleJump() {
  const router = useRouter();
  return <BodyMap onToggle={(m) => router.push(`/catalogue?muscles=${m}`)} />;
}
