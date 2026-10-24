import type { Equipment, ListPrice } from "./types";

/**
 * What a machine costs to buy and land in Singapore, in SGD.
 *
 * - Listed prices are converted at approximate exchange rates with any sales tax removed.
 * - Machines are shipped from where the brand (or the used dealer) sells them: freight is a flat
 *   amount per machine by origin and size, so heavy North American iron costs the most to land.
 * - New machines carry a local distributor margin; low-volume specialist imports carry an extra premium.
 * - 9% GST applies to the landed value (price + freight).
 * - Machines with no published price are estimated from their type, loading and brand tier; machines
 *   no longer made use a used-market estimate.
 *
 * Every number here is an estimate for a fictional budget, not a quote.
 */

/** Approximate SGD per unit, late 2026 */
export const FX: Record<ListPrice["currency"], number> = { USD: 1.3, AUD: 0.86, SEK: 0.125, EUR: 1.45, GBP: 1.7 };
export const GST = 0.09;
const DISTRIBUTOR_MARGIN = 0.18;

type Region = "north-america" | "europe" | "east-asia";

const ORIGIN: Record<string, Region> = {
  panatta: "europe",
  gym80: "europe",
  technogym: "europe",
  watson: "europe",
  eleiko: "europe",
  gymleco: "europe",
  newtech: "east-asia",
  matrix: "east-asia",
};

/** Flat SGD freight per machine (sea freight, customs brokerage, delivery and install) */
const FREIGHT: Record<Region, Record<"light" | "standard" | "heavy", number>> = {
  "north-america": { light: 700, standard: 1800, heavy: 2900 },
  europe: { light: 550, standard: 1400, heavy: 2300 },
  "east-asia": { light: 250, standard: 600, heavy: 1000 },
};

/**
 * Specialist brands with little distribution in Asia: grey imports, small production runs, special
 * orders and long lead times make them noticeably dearer in Singapore than their home price suggests.
 */
const IMPORT_PREMIUM: Record<string, number> = {
  "prime-fitness": 0.25,
  atlantis: 0.25,
  "arsenal-strength": 0.25,
  nautilus: 0.2,
  watson: 0.1,
  newtech: 0.05,
};

/** A converted price above this is a placeholder ("call for price"), not a real listing */
const MAX_PLAUSIBLE_SGD = 60_000;

/** New-price level relative to a typical commercial machine */
const BRAND_TIER: Record<string, number> = {
  gym80: 1.35,
  technogym: 1.3,
  panatta: 1.1,
  "prime-fitness": 1.3,
  "hammer-strength": 1.2,
  eleiko: 1.2,
  "life-fitness": 1.15,
  atlantis: 1.15,
  matrix: 1.05,
  cybex: 1.05,
  medx: 1.3,
  precor: 1.0,
  nautilus: 1.0,
  "arsenal-strength": 1.0,
  hoist: 0.95,
  newtech: 0.95,
  watson: 0.9,
  gymleco: 0.9,
  rogue: 0.8,
};

const HEAVY = new Set<Equipment["movement"]>(["leg-press", "hack-squat", "pendulum-squat", "squat"]);
const SMALL = new Set<Equipment["movement"]>(["calf", "biceps", "triceps", "lateral-raise", "core", "abduction", "rear-delt"]);

/** Typical new price in USD for this kind of machine from an average commercial brand */
export function typicalNewUsd(item: Pick<Equipment, "movement" | "loading" | "name">): number {
  const n = item.name.toLowerCase();
  if (item.loading === "bench-rack") {
    if (/smith/.test(n)) return 4200;
    if (/rack|cage|rig/.test(n)) return 2600;
    if (/bench/.test(n)) return 1100;
    return 1800;
  }
  if (item.movement === "multi") {
    if (/jungle|station|multi.?gym|\d-stack/.test(n)) return 14000;
    if (/smith/.test(n)) return 4500;
    return 6500;
  }
  const combo = /dual|combo|\/|&/.test(n) ? 1.2 : 1;
  if (item.loading === "plate") return (HEAVY.has(item.movement) ? 7200 : SMALL.has(item.movement) ? 3600 : 4800) * combo;
  if (item.loading === "cable") return 6500 * combo;
  return (HEAVY.has(item.movement) ? 8200 : SMALL.has(item.movement) ? 5200 : 6200) * combo;
}

/** Used machines from discontinued lines trade at roughly this share of a comparable new machine */
const VINTAGE_RESALE = 0.4;

export type PriceBreakdown = {
  sgd: number;
  basis: "listed" | "resale" | "estimate";
  /** Machine price converted to SGD, excluding tax */
  machine: number;
  freight: number;
  margin: number;
  premium: number;
  gst: number;
  note: string;
};

const round10 = (n: number) => Math.round(n / 10) * 10;

export function priceInSgd(
  item: Pick<Equipment, "brandSlug" | "movement" | "loading" | "name" | "listPrice" | "discontinued">,
  vintage: boolean,
): PriceBreakdown {
  const region = ORIGIN[item.brandSlug] ?? "north-america";
  const name = item.name.toLowerCase();
  const size =
    item.loading === "bench-rack" && /bench/.test(name) && !/smith|rack/.test(name)
      ? "light"
      : HEAVY.has(item.movement) || item.movement === "multi" || /smith|rack/.test(name)
        ? "heavy"
        : "standard";
  const listed = item.listPrice;
  const lp = listed && (listed.amount / (1 + listed.taxIncluded)) * FX[listed.currency] <= MAX_PLAUSIBLE_SGD ? listed : undefined;

  let machine: number;
  let isNew: boolean;
  let basis: PriceBreakdown["basis"];
  let note: string;
  if (lp) {
    machine = (lp.amount / (1 + lp.taxIncluded)) * FX[lp.currency];
    isNew = lp.condition === "new";
    basis = isNew ? "listed" : "resale";
    note = `${lp.condition === "new" ? "List" : "Used/remanufactured"} price ${lp.currency} ${lp.amount.toLocaleString("en-US")} from ${lp.source}`;
  } else {
    const usd = typicalNewUsd(item) * (BRAND_TIER[item.brandSlug] ?? 1);
    isNew = !vintage;
    machine = usd * FX.USD * (isNew ? 1 : VINTAGE_RESALE);
    basis = "estimate";
    note = isNew
      ? "No published price: estimated from machine type, loading and brand tier"
      : "No longer made: estimated used-market price for a serviced machine";
  }
  // Used machines bought from a US dealer ship from the US whatever the brand's origin
  const freight = FREIGHT[isNew ? region : "north-america"][size];
  const margin = isNew ? machine * DISTRIBUTOR_MARGIN : 0;
  const premium = isNew ? machine * (IMPORT_PREMIUM[item.brandSlug] ?? 0) : 0;
  const gst = (machine + freight + margin + premium) * GST;
  return {
    sgd: round10(machine + freight + margin + premium + gst),
    basis,
    machine: round10(machine),
    freight,
    margin: round10(margin),
    premium: round10(premium),
    gst: round10(gst),
    note,
  };
}

export const formatSgd = (n: number) => `S$${Math.round(n).toLocaleString("en-US")}`;

export const PRICE_BASIS: Record<PriceBreakdown["basis"], string> = {
  listed: "From a published price, landed in Singapore",
  resale: "From a used/remanufactured listing, landed in Singapore",
  estimate: "Estimated: no published price",
};
