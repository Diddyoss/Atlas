# IRON ATLAS

**Live preview:** https://diddyoss.github.io/Atlas/

A dark, black-and-white, industrial compendium for comparing strength equipment, built for gym goers and bodybuilders.

- **1,600+ machines from 24 brands, 97% with photos.** About 80 are hand-reviewed; the rest come from manufacturer and dealer catalogues and have estimated profiles.
- **Active brands:** Panatta, Gymleco, gym80, Nautilus, Newtech, Atlantis, Arsenal Strength, Precor, Hammer Strength, Hoist, Prime Fitness, Technogym, Life Fitness, Watson, Matrix, Rogue and Eleiko.
- **Vintage vault.** Out-of-business brands (Flex, classic Cybex, classic MedX, Icarian, Bodymasters, Nebula, classic Universal) and discontinued lines from active brands, such as the original Nautilus Pullover. Filter them in or out with the Era control, or open `/vintage`.
- **Search** by name, brand, series or alias ("hammer row", "blue monster").
- **Search by function:** tap muscles on the front/back body map (a label names each muscle on hover or tap), or filter by movement pattern, loading type, iso-lateral design or *hand-reviewed only*. Filters live in the URL, so any search can be shared.
- **Compare up to 4 machines**:
  - overlaid resistance curves and feel radars
  - accessibility (entry, adjustment, beginner-friendliness, starting load, wheelchair transfer)
  - community favorites and ratings
  - specs
  - best-in-row markers, an *only differences* toggle, and a share link
- **Machine pages**: the resistance profile (including Prime's adjustable SmartCam settings), muscles worked, feel and accessibility scores, pros/cons, sources, and voting.
- **Motion everywhere.** Shutter page transitions, stencil text reveals, self-drawing curves, spring-loaded compare tray, brand marquee, scroll reveals. All of it respects `prefers-reduced-motion`.

## Data honesty

- **Feel scores and resistance curves** are editorial estimates. They are written from published reviews, forum consensus and brand material, not lab measurements. The UI says so.
- **Specs** are filled in only where a source states them. Brand and dealer pages used are listed on each machine's page.
- **Community votes** are stored in SQLite (`data/community.db`) when the server runs. The static GitHub Pages preview has no server, so votes there are saved only in the visitor's browser.

## Running it

Requires Node 24 or newer (uses the built-in `node:sqlite`).

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # vitest unit tests
npm run validate     # schema-check the catalogue and report missing photos
npm run typecheck
npm run build && npm start
```

## Catalogue discovery and photos

`npm run discover` builds most of the catalogue. It reads public product feeds and catalogue pages, keeps the strength machines, and downloads a photo for each:

| Brand | Source |
| --- | --- |
| Prime, Hoist, Gymleco | the brands' own Shopify stores |
| Hammer Strength, Life Fitness | lifefitness.com catalogue |
| Atlantis | atlantisstrength.com |
| gym80 | gym80.de API |
| Nautilus | Core Health & Fitness store |
| Newtech | ntws.co.kr |
| Panatta | Primo Fitness (US dealer; panattasport.com blocks automated access) |
| Arsenal Strength | Performaxx (AU distributor) |
| Watson | Gym Equipment UK |
| Vintage Cybex, Icarian and Nautilus; Precor; Technogym; Matrix | Fitness Superstore and Global Fitness (remanufactured listings; precor.com renders its catalogue client-side) |

```bash
npm run discover                        # all sources
npm run discover -- --only panatta      # one source (others reuse their cached results)
npm run discover -- --from-cache        # re-process without fetching product lists again
npm run validate
```

How it works:

- **Classification.** Each product is classified into a movement pattern by name (`scripts/discover/classify.ts`). Accessories, cardio and parts are dropped.
- **Curated machines.** Products that match a hand-curated machine (same brand, movement and series) just give it a photo and source link.
- **Everything else** becomes an **estimated** entry. Its curve, muscles and scores come from the movement template (`data/templates.ts`) with small brand nudges. It is labelled "Estimated" in the UI and can be hidden with the *Hand-reviewed only* filter.
- **Politeness.** Requests honour robots.txt and crawl delays, identify the bot, and are queued per host.

Machines without a reachable photo (most MedX, Bodymasters, Nebula, Universal and Flex models) show a blueprint-style schematic. `npm run scrape -- --brand <slug> --fallback-only` retries the dealer pages cited on curated machines.

Every photo is credited with a link to its source page. **Product photos belong to their owners.** They are included here for a personal, non-commercial comparison project.

## Deploying the preview (GitHub Pages)

`.github/workflows/pages.yml` runs validation and tests on every push to `main`, then builds a static export (`STATIC_EXPORT=1`) with the repository name as the base path. API routes are left out of the static build. To enable it:

1. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Push to `main` (or run the workflow manually). The site appears at https://diddyoss.github.io/Atlas/.

For the full experience, including shared community votes and the leaderboard, run the server build (`npm run build && npm start`) on any Node host with a persistent disk.

## Project layout

```
app/                 routes: home, catalogue, equipment/[slug], brands, vintage, compare, api/*
components/          UI: BodyMap, CatalogueBrowser, CompareView, ResistanceCurve, FeelRadar, …
data/brands.json     brand records (status: active | defunct)
data/equipment/*.ts  curated machine data (type-checked, validated with Zod)
data/scraped/        scraper output, merged in at build time (curated fields always win)
lib/                 types, search, compare helpers, SQLite access, vote validation
scripts/             validate, scrape, flatten-export
tests/               vitest
```
