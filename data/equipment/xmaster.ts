import { brandItems } from "../define";

// XMaster's own site blocks automated access, so these come from a published review and a retail
// listing; prices are estimated from weight and a stock photo stands in for product shots.
export default brandItems("xmaster", [
  {
    slug: "xmaster-chrome-olympic-grip-plates",
    name: "Chrome Olympic Grip Plates · 230 lb set",
    series: "Free weights",
    aliases: ["chrome plates", "grip plates", "olympic plates"],
    loading: "free-weight",
    movement: "plates",
    primary: [],
    curve: "flat",
    curveNotes: "Plates load barbells and plate-loaded machines; they don't train anything on their own.",
    feel: [7, 8, 5, 5, 8, 8],
    access: [8, 8, 8],
    startKg: 1,
    weightKg: 104,
    pros: ["Thinner than standard plates, so more fits on a sleeve", "Built-in grip handles", "Tight weight tolerance (about 1%)"],
    cons: ["Chrome is noisy and can chip if dropped", "Not for dropping from overhead"],
    note: "Steel plates with a chrome finish and grip handles. Thin profile suits plate-loaded machines with short horns.",
    sources: [{ label: "Shredded Dad review", url: "https://shreddeddad.com/xmaster-chrome-weight-plates/" }],
  },
  {
    slug: "xmaster-urethane-grip-olympic-plates",
    name: "Urethane Grip Olympic Plates · 1,020 lb kit",
    series: "Free weights",
    aliases: ["urethane plates", "grip plates", "olympic plates", "black plates"],
    loading: "free-weight",
    movement: "plates",
    primary: [],
    curve: "flat",
    curveNotes: "Plates load barbells and plate-loaded machines; they don't train anything on their own.",
    feel: [8, 8, 5, 5, 9, 8],
    access: [8, 8, 8],
    startKg: 1,
    weightKg: 463,
    pros: ["Steel core with a polyurethane coating", "Non-slip handles", "Quiet and floor-friendly"],
    cons: ["Pricier per kilo than rubber or iron"],
    note: "Commercial kit of 2-inch urethane grip plates (10–45 lb), enough to load several bars and plate-loaded machines.",
    sources: [
      {
        label: "Pacifiko retail listing",
        url: "https://www.pacifiko.com/compras-en-linea/xmaster-fitness-urethane-black-grip-plate-tamano-45lb-pair&pid=MWQ0NGM0ZT",
      },
    ],
  },
]);
