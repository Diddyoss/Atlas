import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

/** Delete downloaded photos that no catalogue entry references any more. Returns how many were removed. */
export function pruneImages(root: string) {
  const referenced = new Set<string>();
  for (const dir of ["generated", "scraped"]) {
    const index = path.join(root, "data", dir, "index.json");
    if (!existsSync(index)) continue;
    for (const e of JSON.parse(readFileSync(index, "utf8")) as { images?: { src: string }[] }[]) {
      for (const img of e.images ?? []) referenced.add(img.src);
    }
  }
  const base = path.join(root, "public", "equipment");
  if (!existsSync(base)) return 0;
  let removed = 0;
  for (const brand of readdirSync(base)) {
    for (const file of readdirSync(path.join(base, brand))) {
      if (!referenced.has(`/equipment/${brand}/${file}`)) {
        rmSync(path.join(base, brand, file));
        removed++;
      }
    }
  }
  return removed;
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  console.log(`pruned ${pruneImages(path.resolve(import.meta.dirname, "../.."))} unreferenced images`);
}
