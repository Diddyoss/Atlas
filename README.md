# IRON ATLAS

**Live preview:** https://diddyoss.github.io/Atlas/

A dark, black-and-white, industrial compendium for comparing strength equipment, built for gym goers and bodybuilders.

- **77 machines from 22 brands.** Active brands: Hammer Strength, Life Fitness, Panatta, Newtech, Prime Fitness, Watson, Atlantis, Nautilus, Arsenal Strength, Gym80, Matrix, Technogym, Hoist, Rogue and Eleiko.
- **Vintage vault.** Out-of-business brands (Flex, classic Cybex, classic MedX, Icarian, Bodymasters, Nebula, classic Universal) and discontinued lines from active brands, such as the original Nautilus Pullover. Filter them in or out with the Era control, or open `/vintage`.
- **Search** by name, brand, series or alias ("hammer row", "blue monster"), or **by function**: tap muscles on the front/back body map, filter by movement pattern, loading type or iso-lateral design. Filters live in the URL, so any search can be shared.
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

## Photos and the scraper

Machines show a blueprint-style schematic until a photo is available. `npm run scrape` collects product photos and source links:

```bash
npm run scrape -- --brand atlantis --dry   # report matches, write nothing
npm run scrape -- --brand all              # download, convert to webp, write data/scraped/*.json
npm run validate
```

1. **Brand sites first.** Adapters in `scripts/scrape/adapters.ts` list each brand's catalogue pages. Product pages are matched to catalogue entries by fuzzy name.
2. **Third-party fallback.** Dealer and reseller pages already cited in a machine's sources are tried next, then Wikimedia Commons (openly licensed photos, best for vintage gear).
3. **Polite by design.** The scraper honours robots.txt and crawl delays, identifies itself, and waits between requests. Several brand sites block bots or render client-side. For client-side sites, install Playwright (`npm i -D playwright && npx playwright install chromium`).

Every photo is credited with a link to its source. **Product photos belong to their owners.** Check each site's terms before publishing scraped images, which is why none are committed here by default.

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
