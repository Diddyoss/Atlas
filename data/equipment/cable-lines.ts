import { estimateEquipment } from "@/data/templates";
import type { Equipment } from "@/lib/types";

/**
 * Cable lines from brands whose catalogue feeds didn't include them. Added by hand from the brands'
 * published line-ups; profiles are estimated from the movement template and no photo or price is
 * attached yet, so `npm run discover` or a reviewer should fill those in.
 */
const NOTE =
  "Added by hand from the brand's published line-up. Its profile and scores are estimated from the movement type, and it has no photo or listed price yet.";

const entry = (e: Omit<Parameters<typeof estimateEquipment>[0], "isoLateral" | "discontinued">, aliases: string[]): Equipment => ({
  ...estimateEquipment({ ...e, isoLateral: true, discontinued: false }),
  aliases,
  editorialNote: NOTE,
});

export const cableLines: Equipment[] = [
  entry(
    {
      slug: "lf-signature-cable-crossover",
      brandSlug: "life-fitness",
      name: "Signature Cable Crossover",
      series: "Signature",
      movement: "cable-crossover",
      loading: "cable",
      source: { label: "Life Fitness", url: "https://www.lifefitness.com/en-us/catalog/strength-training" },
    },
    ["cable crossover", "crossover station"],
  ),
  entry(
    {
      slug: "lf-axiom-dual-adjustable-pulley",
      brandSlug: "life-fitness",
      name: "Axiom Dual Adjustable Pulley",
      series: "Axiom",
      movement: "functional-trainer",
      loading: "cable",
      source: { label: "Life Fitness", url: "https://www.lifefitness.com/en-us/catalog/strength-training" },
    },
    ["functional trainer", "dap"],
  ),
  entry(
    {
      slug: "hoist-mi6-functional-trainer",
      brandSlug: "hoist",
      name: "Mi6 Functional Trainer",
      series: "Mi",
      movement: "functional-trainer",
      loading: "cable",
      source: { label: "Hoist Fitness", url: "https://www.hoistfitness.com" },
    },
    ["functional trainer", "home functional trainer"],
  ),
];
