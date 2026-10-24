import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a server-less copy for GitHub Pages: API routes (*.ts) are left out and
// community votes fall back to the visitor's browser storage.
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = isStatic ? (process.env.PAGES_BASE_PATH ?? "") : "";

const nextConfig: NextConfig = {
  cacheComponents: !isStatic,
  partialPrefetching: !isStatic,
  ...(isStatic && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
    pageExtensions: ["tsx"],
  }),
  env: {
    NEXT_PUBLIC_STATIC: isStatic ? "1" : "",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  turbopack: {
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
