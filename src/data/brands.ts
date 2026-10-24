import type { Brand } from "@/lib/types";

export const BRANDS: Brand[] = [
  {
    slug: "hammer-strength",
    name: "Hammer Strength",
    country: "USA",
    founded: 1989,
    status: "active",
    url: "https://www.lifefitness.com/en-us/catalog/strength-training/hammer-strength",
    blurb:
      "Gary Jones' iso-lateral plate-loaded designs defined the converging press. Now part of Life Fitness and still the default in American performance rooms.",
    build: 0.86,
  },
  {
    slug: "life-fitness",
    name: "Life Fitness",
    country: "USA",
    founded: 1977,
    status: "active",
    url: "https://www.lifefitness.com",
    blurb:
      "The largest commercial strength catalogue in the world. Insignia and Signature selectorized lines are known for easy setup and consistent feel.",
    build: 0.8,
  },
  {
    slug: "panatta",
    name: "Panatta",
    country: "Italy",
    founded: 1975,
    status: "active",
    url: "https://www.panattasport.com",
    blurb:
      "Italian heavy-gauge steel with bodybuilding-first biomechanics. The Freeweight HP and Monolith lines are favourites of physique athletes.",
    build: 0.88,
  },
  {
    slug: "prime",
    name: "Prime Fitness",
    country: "USA",
    founded: 2011,
    status: "active",
    url: "https://www.primefitnessusa.com",
    blurb:
      "Adjustable strength curves. Prime's Hybrid and Evolution machines let you dial the resistance profile to match your strongest range.",
    build: 0.84,
  },
  {
    slug: "atlantis",
    name: "Atlantis",
    country: "Canada",
    founded: 1983,
    status: "active",
    url: "https://www.atlantisstrength.com",
    blurb:
      "Québec-built tanks with an enormous range. Their plate-loaded pendulum and leg machines are standards in hardcore gyms.",
    build: 0.85,
  },
  {
    slug: "watson",
    name: "Watson",
    country: "UK",
    founded: 1994,
    status: "active",
    url: "https://www.watsongym.co.uk",
    blurb:
      "Handmade in Lincolnshire. Watson's Animal range is famous for brutal plate-loaded leverage and oversized frames.",
    build: 0.9,
  },
  {
    slug: "newtech",
    name: "Newtech",
    country: "Spain",
    founded: 1997,
    status: "active",
    url: "https://www.newtechfitness.com",
    blurb:
      "Spanish plate-loaded specialist with aggressive converging paths and stretched-position loading.",
    build: 0.82,
  },
  {
    slug: "nautilus",
    name: "Nautilus",
    country: "USA",
    founded: 1970,
    status: "active",
    url: "https://www.corehandf.com/nautilus",
    blurb:
      "The company that invented the cam. Today's Nautilus Leverage and Impact lines carry on under Core Health & Fitness.",
    build: 0.79,
  },
  {
    slug: "gym80",
    name: "gym80",
    country: "Germany",
    founded: 1980,
    status: "active",
    url: "https://www.gym80.de",
    blurb:
      "German engineering with a cult following. Pure Kraft plate-loaded and Sygnum selectorized lines are built like bridges.",
    build: 0.9,
  },
  {
    slug: "arsenal",
    name: "Arsenal Strength",
    country: "USA",
    founded: 2014,
    status: "active",
    url: "https://www.arsenalstrength.com",
    blurb:
      "Modern bodybuilding-focused plate-loaded designs, from the Reloaded line to signature leg machines.",
    build: 0.83,
  },
  // Legacy and out-of-production lines
  {
    slug: "nautilus-classic",
    name: "Nautilus (Arthur Jones era)",
    country: "USA",
    founded: 1970,
    ceased: 1986,
    status: "legacy",
    url: "https://en.wikipedia.org/wiki/Nautilus,_Inc.",
    blurb:
      "Arthur Jones' original cam machines. Jones sold Nautilus in 1986; the Pullover and Compound Leg are still hunted by collectors.",
    build: 0.78,
  },
  {
    slug: "medx",
    name: "MedX",
    country: "USA",
    founded: 1986,
    status: "legacy",
    url: "https://en.wikipedia.org/wiki/Arthur_Jones_(inventor)",
    blurb:
      "Arthur Jones' second act. MedX's commercial lines, especially the Avenger series, used precision cams and counterweighted arms. The company now focuses on medical rehab equipment.",
    build: 0.85,
  },
  {
    slug: "cybex",
    name: "Cybex (classic lines)",
    country: "USA",
    founded: 1970,
    status: "legacy",
    url: "https://www.cybexintl.com",
    blurb:
      "The brand lives on under Life Fitness, but the Eagle and VR2 generations are discontinued.",
    build: 0.8,
  },
  {
    slug: "flex",
    name: "Flex Fitness",
    country: "USA",
    founded: 1980,
    status: "legacy",
    url: "https://en.wikipedia.org/wiki/List_of_fitness_equipment_manufacturers",
    blurb:
      "Plate-loaded workhorses common in 1990s and 2000s hardcore gyms. Flex closed down, but plenty of its machines are still in use.",
    build: 0.76,
  },
  {
    slug: "icarian",
    name: "Icarian",
    country: "USA",
    founded: 1983,
    status: "legacy",
    url: "https://en.wikipedia.org/wiki/Precor",
    blurb:
      "California-built selectorized and plate-loaded gear; the name was later folded into Precor. Its hack squat and leg press still turn up in old-school gyms.",
    build: 0.74,
  },
];

export const BRAND_MAP = Object.fromEntries(BRANDS.map((b) => [b.slug, b]));

export function getBrand(slug: string): Brand {
  const b = BRAND_MAP[slug];
  if (!b) throw new Error(`Unknown brand: ${slug}`);
  return b;
}
