// Builds the whole app into one self-contained HTML file for hosting as a
// claude.ai Artifact. Run `npm run build` first: the Tailwind CSS comes from
// the Next.js export in ./out.
import { build } from "esbuild";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const shim = (f) => fileURLToPath(new URL(`./shims/${f}`, import.meta.url));

const result = await build({
  entryPoints: [fileURLToPath(new URL("./entry.tsx", import.meta.url))],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  target: "es2020",
  tsconfig: `${root}tsconfig.json`,
  define: { "process.env.NODE_ENV": '"production"' },
  alias: { "next/link": shim("link.tsx"), "next/navigation": shim("navigation.ts"), "next/form": shim("form.tsx") },
  logLevel: "error",
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const cssDir = `${root}out/_next/static/chunks/`;
const cssFiles = (await readdir(cssDir)).filter((f) => f.endsWith(".css"));
let css = (await Promise.all(cssFiles.map((f) => readFile(cssDir + f, "utf8")))).join("\n");
// next/font faces point at files that aren't shipped; Google Fonts serves them instead.
css = css.replace(/@font-face\{[^}]*\}/g, "");

const html = `<title>Atlas Machine Index</title>
<meta name="description" content="Compare commercial strength machines by brand, muscle and resistance profile.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
:root {
  color-scheme: dark;
  --font-archivo: "Archivo", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
}
${css}
header.sticky { top: env(safe-area-inset-top, 0px); }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 60; background: var(--ink); }
</style>
<div id="root"></div>
<script>${js}</script>
`;
await mkdir(`${root}dist`, { recursive: true });
await writeFile(`${root}dist/atlas.html`, html);
console.log(`dist/atlas.html — ${(html.length / 1024).toFixed(0)} KB`);
