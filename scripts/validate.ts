import brandsJson from "../data/brands.json";
import scrapedJson from "../data/scraped/index.json";
import { BrandSchema, EquipmentSchema, ScrapedSchema } from "../lib/types";
import { allEquipment as curated, buildCatalogue } from "../lib/catalogue";

let errors = 0;
const fail = (msg: string) => {
  errors++;
  console.error(`✗ ${msg}`);
};

const brands = brandsJson.map((b) => {
  const r = BrandSchema.safeParse(b);
  if (!r.success) fail(`brand ${b.slug}: ${r.error.message}`);
  return b;
});

const seen = new Set<string>();
for (const item of curated) {
  const r = EquipmentSchema.safeParse(item);
  if (!r.success) fail(`equipment ${item.slug}: ${r.error.message}`);
  if (seen.has(item.slug)) fail(`duplicate slug ${item.slug}`);
  seen.add(item.slug);
}

for (const s of scrapedJson) {
  const r = ScrapedSchema.safeParse(s);
  if (!r.success) fail(`scraped ${(s as { slug?: string }).slug}: ${r.error.message}`);
  else if (!seen.has(r.data.slug)) fail(`scraped entry ${r.data.slug} has no curated item`);
}

const catalogue = buildCatalogue(brands as never, curated, scrapedJson as never);
const noImage = catalogue.filter((i) => i.images.length === 0);
const noSource = catalogue.filter((i) => i.sources.length === 0 && i.images.length === 0);

console.log(
  `\n${brands.length} brands, ${catalogue.length} machines (${catalogue.filter((i) => i.vintage).length} vintage, ${catalogue.filter((i) => i.estimated).length} estimated)`,
);
const perBrand = brands.map((b) => `${b.slug}:${catalogue.filter((i) => i.brandSlug === b.slug).length}`);
console.log(perBrand.join("  "));
console.log(`${catalogue.length - noImage.length}/${catalogue.length} have images`);
if (noImage.length) {
  const shown = noImage.slice(0, 8).map((i) => i.slug);
  console.log(`  missing images: ${shown.join(", ")}${noImage.length > shown.length ? ` … +${noImage.length - shown.length} more` : ""}`);
}
if (noSource.length) console.log(`  ${noSource.length} have neither image nor source link`);

if (errors) {
  console.error(`\n${errors} error(s)`);
  process.exit(1);
}
console.log("\n✓ catalogue valid");
