// Next's static export writes RSC segment files as nested folders (`__next.catalogue/__PAGE__.txt`),
// but the client router requests flattened names (`__next.catalogue.__PAGE__.txt`). Static hosts like
// GitHub Pages can't rewrite, so copy every nested segment file to its flattened name.
import { copyFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const out = path.resolve(process.argv[2] ?? "out");
let copied = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith("__next.")) flatten(full, dir, name);
    else walk(full);
  }
}

function flatten(segDir, parent, prefix) {
  for (const name of readdirSync(segDir)) {
    const full = path.join(segDir, name);
    if (statSync(full).isDirectory()) flatten(full, parent, `${prefix}.${name}`);
    else {
      copyFileSync(full, path.join(parent, `${prefix}.${name}`));
      copied++;
    }
  }
}

walk(out);
console.log(`flatten-export: wrote ${copied} segment files`);
