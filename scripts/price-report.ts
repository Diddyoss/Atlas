/** Read-only: Singapore price summary per brand and basis. `npx tsx scripts/price-report.ts` */
import { getBrands, getCatalogue } from "../lib/catalogue";
import { formatSgd } from "../lib/pricing";

const items = getCatalogue();
const pct = (xs: number[], p: number) => xs[Math.min(xs.length - 1, Math.floor((xs.length - 1) * p))];
for (const b of getBrands()) {
  const mine = items.filter((i) => i.brandSlug === b.slug);
  if (!mine.length) continue;
  const prices = mine.map((i) => i.price.sgd).sort((a, c) => a - c);
  const bases = ["listed", "resale", "estimate"].map((k) => `${k[0]}${mine.filter((i) => i.price.basis === k).length}`).join(" ");
  console.log(
    `${b.name.padEnd(20)} n=${String(mine.length).padStart(3)}  min ${formatSgd(prices[0]).padStart(9)}  median ${formatSgd(pct(prices, 0.5)).padStart(9)}  max ${formatSgd(prices.at(-1)!).padStart(10)}  [${bases}]`,
  );
}
const out = items.filter((i) => i.price.sgd > 60000 || i.price.sgd < 800);
console.log(`\noutliers (<S$800 or >S$60k): ${out.length}`);
for (const i of out.slice(0, 15)) console.log(`  ${formatSgd(i.price.sgd)}  ${i.brand.name} ${i.name} [${i.price.basis}]`);
