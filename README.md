# ATLAS — Strength Machine Index

A dark, industrial catalogue and comparison tool for commercial gym machines, built for gym goers and bodybuilders.

- **85 machines** from 10 active brands: Hammer Strength, Life Fitness, Panatta, Prime, Atlantis, Watson, Newtech, Nautilus, gym80 and Arsenal Strength.
- **Vintage section** with 15 discontinued machines from classic Nautilus (Arthur Jones era), MedX, Cybex Eagle/VR2, Flex and Icarian. It is kept out of the main catalogue unless you switch to it.
- **Search** by brand, machine name or function. Gym slang works too: "hammies", "pecs", "booty", "lats".
- **Body-map filter**: tap muscles on a front/back figure. Machines that mainly target that muscle rank first.
- **Compare up to 4 machines**: overlaid resistance curves, a score radar, community votes, and a head-to-head spec table with an *only differences* toggle and per-row winners. You can share a comparison by its URL.
- **Community votes**: a recommend/pass vote plus 1–5 scores for feel, smoothness, stability, accessibility, durability and space efficiency.

## Data honesty

- Specs (weight, dimensions, loads) are **approximate**, derived from typical values for each movement type.
- Scores are **editorial estimates**, based on brand build quality plus per-machine adjustments.
- Resistance curves are **modelled**, not measured.
- Community tallies start from a **seeded baseline**. Your votes are kept in `localStorage` until a backend is added.
- The UI labels all of the above.

## Images

Each machine shows generated line-art until a real photo is available. To pull product photos:

1. Add `machine-id → product page URL` pairs to `scripts/product-pages.json`.
2. Run `npm run scrape:images`. The script reads each page's `og:image` and writes `src/data/images.json`. The app uses those photos automatically and credits the source.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest unit tests
npm run typecheck
npm run lint
npm run build      # static export to ./out
```

## Deploying a preview (GitHub Pages)

`.github/workflows/pages.yml` builds the static export with the `/atlas` base path and deploys it. To turn it on:

1. Go to **Settings → Pages → Source** and select **GitHub Actions**.
2. If you deploy from a branch other than `main`, add that branch under **Settings → Environments → github-pages → Deployment branches**.

The site will then be at `https://diddyoss.github.io/atlas/`.
