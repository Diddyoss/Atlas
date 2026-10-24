import { fetchJson } from "./http";
import type { PageInfo } from "./extract";

/**
 * How to find product pages for a brand. Start URLs are catalogue/listing pages; any same-site link
 * whose path matches `productLink` is treated as a product page. Sites change, so expect to tune these.
 */
export type Adapter = {
  brand: string;
  startUrls: string[];
  productLink: RegExp;
  /** Site renders products client-side; needs `npm i -D playwright && npx playwright install chromium` */
  render?: boolean;
  /** Optional structured-API path that replaces HTML crawling */
  api?: () => Promise<PageInfo[]>;
  maxProducts?: number;
};

type WpProduct = { link: string; title: { rendered: string }; featured_media: number; _embedded?: { "wp:featuredmedia"?: { source_url: string }[] } };

export const ADAPTERS: Adapter[] = [
  {
    brand: "panatta",
    startUrls: ["https://www.panattasport.com/en/"],
    productLink: /\/en\/(product|free-weight-special|freeweight-hp|freeweight-one|monolith)\//,
    // Panatta runs WordPress and exposes products through its public REST API
    api: async () => {
      const out: PageInfo[] = [];
      for (let page = 1; page <= 5; page++) {
        const batch = await fetchJson<WpProduct[]>(
          `https://www.panattasport.com/en/wp-json/wp/v2/product?per_page=100&page=${page}&_embed=wp:featuredmedia`,
        ).catch(() => []);
        if (!batch.length) break;
        for (const p of batch) {
          out.push({
            url: p.link,
            name: p.title.rendered.replace(/<[^>]+>/g, "").replace(/&#8217;/g, "'"),
            image: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
          });
        }
      }
      return out;
    },
  },
  { brand: "prime-fitness", startUrls: ["https://www.primefitnessusa.com/collections/all"], productLink: /\/products\// },
  { brand: "watson", startUrls: ["https://www.watsongym.co.uk/"], productLink: /\/(product|products|shop)\// },
  { brand: "atlantis", startUrls: ["https://www.atlantisstrength.com/"], productLink: /\/(product|products|equipment)\// },
  {
    brand: "hammer-strength",
    startUrls: ["https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/hammer-strength"],
    productLink: /\/catalog\/.+\/(hammer-strength|plate-loaded)\/.+/,
    render: true,
  },
  {
    brand: "life-fitness",
    startUrls: ["https://www.lifefitness.com/en-us/catalog/strength-training/selectorized"],
    productLink: /\/catalog\/strength-training\/selectorized\/.+/,
    render: true,
  },
  { brand: "nautilus", startUrls: ["https://www.corehandf.com/nautilus"], productLink: /\/nautilus\/.+/ },
  { brand: "arsenal-strength", startUrls: ["https://www.arsenalstrength.com/"], productLink: /\/(product|products)\// },
  { brand: "gym80", startUrls: ["https://www.gym80.de/en/"], productLink: /\/(product|produkt|products)\// },
  { brand: "matrix", startUrls: ["https://www.matrixfitness.com/us/eng/group-training/strength"], productLink: /\/strength\/.+/ },
  { brand: "technogym", startUrls: ["https://www.technogym.com/en-US/category/strength/"], productLink: /\/product\// },
  { brand: "hoist", startUrls: ["https://www.hoistfitness.com/collections/commercial"], productLink: /\/products\// },
  { brand: "rogue", startUrls: ["https://www.roguefitness.com/power-racks"], productLink: /^\/rogue-/ },
  { brand: "eleiko", startUrls: ["https://eleiko.com/en/c/benches"], productLink: /\/p\// },
  // Newtech publishes mainly via social media; defunct brands have no sites. These rely on fallbacks.
];
