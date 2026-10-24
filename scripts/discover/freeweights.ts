import type { ListPrice, Movement } from "../../lib/types";
import { tidyName } from "./classify";
import { shopifyAll, type Raw, type ShopifyProduct, type Source } from "./sources";

/**
 * Free weights are sold per pair, per bar or per plate, so each product becomes one or more *sets*
 * priced from its real variant prices:
 * - a variant that is already a set ("5 - 50 LB Set") is used as-is;
 * - otherwise per-pair or per-bar variants are added up into a complete set;
 * - plates are added up into a standard commercial plate kit.
 * The set's total mass is kept for freight.
 */

const LB = 0.4536;

/** A commercial plate kit: enough to load several bars and plate-loaded machines */
const PLATE_KIT_LB: Record<number, number> = { 45: 12, 35: 4, 25: 8, 10: 8, 5: 8, 2.5: 8 };
const PLATE_KIT_KG: Record<number, number> = { 20: 12, 15: 4, 10: 8, 5: 8, 2.5: 8 };
const BUMPER_KIT_LB: Record<number, number> = { 45: 8, 35: 4, 25: 6, 15: 4, 10: 6 };
const BUMPER_KIT_KG: Record<number, number> = { 20: 8, 15: 4, 10: 6, 5: 6 };

type Variant = { title: string; price: number };
const variantsOf = (p: ShopifyProduct): Variant[] =>
  (p.variants ?? []).map((v) => ({ title: v.title, price: Number(v.price) })).filter((v) => v.price > 0 && v.price < 1e6);

/** Mass of a "5 - 50 LB" range of dumbbell pairs (or single bars) in steps */
function rangeMassKg(text: string, pairs: boolean): number | undefined {
  const m = text.match(/([\d.]+)\s*-\s*([\d.]+)\s*(lb|kg)/i);
  if (!m) return undefined;
  const [lo, hi] = [Number(m[1]), Number(m[2])];
  // Racks step by 1 (1–10 kg), 2.5 (2.5–25 kg), 5 (5–50 lb) or 10 (20–110 lb bars)
  const step = lo < 2.5 ? 1 : lo % 5 === 0 ? (hi - lo >= 50 && lo >= 20 ? 10 : 5) : 2.5;
  let total = 0;
  for (let w = lo; w <= hi + 1e-9; w += step) total += w;
  return total * (pairs ? 2 : 1) * (/lb/i.test(m[3]) ? LB : 1);
}

/** Price and mass of a plate kit built from per-plate variants ("45 LB", "20 kg") */
function plateKit(variants: Variant[], bumper: boolean) {
  const byWeight = new Map<number, number>();
  let unit: "lb" | "kg" | null = null;
  for (const v of variants) {
    const m = v.title.match(/([\d.]+)\s*(lb|kg)\b/i);
    if (!m || /set/i.test(v.title)) continue;
    unit = m[2].toLowerCase() as "lb" | "kg";
    if (!byWeight.has(Number(m[1]))) byWeight.set(Number(m[1]), v.price);
  }
  if (!unit) return null;
  const kit = unit === "lb" ? (bumper ? BUMPER_KIT_LB : PLATE_KIT_LB) : bumper ? BUMPER_KIT_KG : PLATE_KIT_KG;
  let price = 0;
  let mass = 0;
  for (const [w, qty] of Object.entries(kit)) {
    const each = byWeight.get(Number(w));
    if (each === undefined) continue;
    price += each * qty;
    mass += Number(w) * qty;
  }
  // Without the big plates it isn't a usable kit
  if (!byWeight.has(unit === "lb" ? 45 : 20)) return null;
  return { price, massKg: unit === "lb" ? mass * LB : mass, label: `${Math.round(unit === "lb" ? mass : mass / LB)} lb kit` };
}

const fwPrice = (amount: number, currency: ListPrice["currency"], taxIncluded = 0): Raw["price"] =>
  amount >= 50 ? { amount: Math.round(amount * 100) / 100, currency, taxIncluded, condition: "new" } : undefined;

/** Hammer Strength and Life Fitness free weights from Life Fitness's facility store */
export const facilityShop: Source = {
  id: "lf-facility-shop",
  brands: ["hammer-strength", "life-fitness"],
  run: async () => {
    const store = "https://facilityshop.lifefitness.com";
    const TYPES: Record<string, Movement> = {
      Dumbbell: "dumbbells",
      "Fixed Barbell": "fixed-barbells",
      "Olympic Plate": "plates",
      "Bumper Plate": "plates",
      Plate: "plates",
      Barbell: "barbell",
      "Curl Bar": "fixed-barbells",
    };
    const out: Raw[] = [];
    for (const p of await shopifyAll(store)) {
      const movement = TYPES[p.product_type];
      if (!movement || !p.images.length || /adjustable dumbbell stand|holder|collar/i.test(p.title)) continue;
      const brandSlug = p.vendor === "Hammer Strength" ? "hammer-strength" : "life-fitness";
      const base = tidyName(p.title.replace(/^hammer strength\s+/i, ""));
      const url = `${store}/products/${p.handle}`;
      const common = { brandSlug, series: "Free weights", loading: "free-weight" as const, movement, url, image: p.images[0].src, credit: "Life Fitness facility store" };
      const variants = variantsOf(p);

      if (movement === "plates") {
        const kit = plateKit(variants, /bumper/i.test(p.title));
        if (kit) out.push({ ...common, name: `${base} · ${kit.label}`, price: fwPrice(kit.price, "USD"), weightKg: kit.massKg });
        continue;
      }
      const sets = variants.filter((v) => /set/i.test(v.title));
      if (sets.length) {
        // One entry per published set ("5 - 50 LB Set", "EZ Curl / 20 - 110 LB Set")
        for (const v of sets) {
          const range = v.title.replace(/\s*\[.*?\]/, "").replace(/^(grey|black) \/ (colored|grey) \/ /i, "");
          out.push({
            ...common,
            name: `${base} · ${range.replace(/\s*-\s*/, "–").replace(/\bLB\b/, "lb")}`,
            price: fwPrice(v.price, "USD"),
            weightKg: rangeMassKg(v.title, movement === "dumbbells"),
          });
        }
      } else if (movement === "barbell" || /curl bar/i.test(p.product_type)) {
        for (const v of variants.slice(0, 2)) {
          // Women's and technique bars are lighter than 20 kg
          const kg = Number(`${p.title} ${v.title}`.match(/(\d+)\s*kg/i)?.[1] ?? 20);
          out.push({ ...common, name: variants.length > 1 ? `${base} · ${v.title}` : base, price: fwPrice(v.price, "USD"), weightKg: kg });
        }
      } else {
        // No published set: add up the straight bars / pairs into a complete set
        const singles = variants.filter((v) => /\d+(\.\d+)?\s*lb/i.test(v.title) && !/ez curl/i.test(v.title));
        const masses = singles.map((v) => Number(v.title.match(/([\d.]+)\s*lb/i)![1]));
        if (singles.length >= 4) {
          out.push({
            ...common,
            name: `${base} · ${Math.min(...masses)}–${Math.max(...masses)} lb set`,
            price: fwPrice(singles.reduce((s, v) => s + v.price, 0), "USD"),
            weightKg: masses.reduce((s, m) => s + m, 0) * (movement === "dumbbells" ? 2 : 1) * LB,
          });
        }
      }
    }
    return out;
  },
};

/** Prime Fitness's Intek Strength line: published bundles */
export const intek: Source = {
  id: "intek",
  brands: ["prime-fitness"],
  run: async () => {
    const store = "https://www.primefitnessusa.com";
    const out: Raw[] = [];
    for (const p of await shopifyAll(store, "intek-strength")) {
      const t = p.title.toUpperCase();
      const amount = Number(p.variants?.[0]?.price);
      if (!p.images.length || amount < 300) continue;
      const movement: Movement | null = /DUMBBELL/.test(t) ? "dumbbells" : /PLATE|BUMPER/.test(t) ? "plates" : /\bBAR\b/.test(t) ? "barbell" : null;
      if (!movement) continue;
      const range = rangeMassKg(p.title, true);
      // Plate bundles don't state their mass; a basic pair set (45 to 2.5 lb) is 245 lb, "complete" doubles it
      const plateMass = /COMPLETE/.test(t) ? 490 * LB : 245 * LB;
      out.push({
        brandSlug: "prime-fitness",
        name: tidyName(p.title.replace(/^intek\s*(\|\s*)?/i, "").replace(/\s*\|\s*/g, " · ")),
        series: "Intek",
        loading: "free-weight",
        movement,
        url: `${store}/products/${p.handle}`,
        image: p.images[0].src,
        credit: "Prime Fitness (Intek Strength)",
        price: fwPrice(amount, "USD"),
        weightKg: movement === "dumbbells" ? (range ?? 2100 * LB) : movement === "plates" ? plateMass : 20,
      });
    }
    return out;
  },
};

/** Gymleco's dumbbell sets, fixed barbells, Olympic bars and plates (SEK incl. 25% VAT) */
export const gymlecoFreeWeights: Source = {
  id: "gymleco-free-weights",
  brands: ["gymleco"],
  run: async () => {
    const store = "https://gymleco.com";
    const all = await shopifyAll(store);
    const out: Raw[] = [];
    const setMaterials = new Set<string>();
    const material = (t: string) => t.match(/rubber|chrome|hex|polyurethane|urethane/i)?.[0].toLowerCase() ?? "";
    const sorted = [...all].sort((a, b) => Number(/set/i.test(b.title)) - Number(/set/i.test(a.title)));
    for (const p of sorted) {
      if (!p.images.length || /rack|holder|stand|handle|pad|lift|jack|collar|bench|rig|wall|buildable/i.test(p.title)) continue;
      const t = p.title;
      const variants = variantsOf(p);
      const url = `${store}/products/${p.handle}`;
      const common = { brandSlug: "gymleco", series: "Free weights", loading: "free-weight" as const, url, image: p.images[0].src, credit: "Gymleco (official store)" };
      // Swedish decimals ("2,5-50 kg") read as model codes later, so normalise them first
      const name = tidyName(
        t
          .replace(/^gymleco\s+/i, "")
          .replace(/^set\s*-\s*/i, "")
          .replace(/(\d),(\d)/g, "$1.$2")
          .replace(/(\d)\s*-\s*(\d)/g, "$1–$2")
          .replace(/(\d)kg\b/gi, "$1 kg"),
      );

      if (/dumbbell/i.test(t)) {
        if (/set/i.test(t) && variants.length === 1) {
          setMaterials.add(material(t));
          out.push({ ...common, movement: "dumbbells", name: `${name} (set)`, price: fwPrice(variants[0].price, "SEK", 0.25), weightKg: rangeMassKg(t.replace(/(\d),(\d)/g, "$1.$2"), true) });
        } else if (variants.length >= 4 && variants.every((v) => /2 x/i.test(v.title)) && !setMaterials.has(material(t))) {
          // Sold per pair: the complete rack of pairs
          const masses = variants.map((v) => Number(v.title.replace(",", ".").match(/([\d.]+)\s*kg/i)?.[1] ?? 0));
          out.push({
            ...common,
            movement: "dumbbells",
            name: `${name} (complete set of ${variants.length} pairs)`,
            price: fwPrice(variants.reduce((s, v) => s + v.price, 0), "SEK", 0.25),
            weightKg: masses.reduce((s, m) => s + m * 2, 0),
          });
        }
      } else if (/fixed barbell|curl ?bar|super curl/i.test(t)) {
        const kg = variants.map((v) => Number(v.title.match(/([\d.]+)\s*kg/i)?.[1] ?? 0)).filter(Boolean);
        if (kg.length >= 3) {
          out.push({ ...common, movement: "fixed-barbells", name: `${name} · ${Math.min(...kg)}–${Math.max(...kg)} kg set`, price: fwPrice(variants.reduce((s, v) => s + v.price, 0), "SEK", 0.25), weightKg: kg.reduce((s, m) => s + m, 0) });
        } else if (variants.length === 1) {
          out.push({ ...common, movement: "fixed-barbells", name, price: fwPrice(variants[0].price, "SEK", 0.25), weightKg: 10 });
        }
      } else if (/olympic.*barbell|bend barbell/i.test(t) && variants.length === 1) {
        out.push({ ...common, movement: "barbell", name, price: fwPrice(variants[0].price, "SEK", 0.25), weightKg: 20 });
      } else if (p.product_type === "Weight plates" || /plates/i.test(t)) {
        if (/set/i.test(t) && variants.length === 1) {
          out.push({ ...common, movement: "plates", name: `${name} (set)`, price: fwPrice(variants[0].price, "SEK", 0.25), weightKg: 150 });
          continue;
        }
        const kit = plateKit(variants, /bumper/i.test(t));
        if (kit) out.push({ ...common, movement: "plates", name: `${name} · ${kit.label}`, price: fwPrice(kit.price, "SEK", 0.25), weightKg: kit.massKg });
      }
    }
    return out;
  },
};
