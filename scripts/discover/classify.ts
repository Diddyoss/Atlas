import type { Loading, Movement } from "../../lib/types";

/** Things that show up in product feeds but aren't machines. */
const NOT_A_MACHINE =
  /\b(attachments?|handles?|pads?|kits?|replacements?|mounts?|upgrades?|collars?|olympic plates?|weight plates?|bumper plates?|plate sets?|plate trees?|plate racks?|bumpers?|bundles?|dumbbells?|kettlebells?|storage|weight trees?|hat|shirt|socks|beanie|gift|cups?|abmat|mats?|flooring|straps?|carabiners?|j-hooks?|spotter|band pegs?|balls?|targets?|bags?|ropes?|covers?|cushions?|upholstery|shrouds?|parts?|fee|installation|assembly|treadmills?|bikes?|ellipticals?|cycles?|rowers?|steppers?|climbers?|arc trainers?|ergometers?|ube|crosstrainers?|flexstriders?|stairs?|stairmaster|consoles?|tv|grippers?|neck|tibia|wrist|(?:dumbbell|barbell|plate|storage|bar) stands?|packages?|coming soon|(?<!t[- ])bars?|ez curl|straight bar|sled|plyo|boxes?|benches? only|bench attachment|lockers?|weight horns?|platforms?|accessory rack|accessories|(?:barbell|disk|disc|plates?|curl|bell|wall) racks?|rack wall|narrow rack|safety (?:arms?|stops?)|set of weights)\b|\s(?:for|to fit)\s/i;

type Rule = [RegExp, Movement];

// Order matters: specific phrases before generic ones.
const RULES: Rule[] = [
  [/pendulum/i, "pendulum-squat"],
  [/calf|calves|heel raise/i, "calf"],
  [/hack/i, "hack-squat"],
  [/leg press|legpress|leg-press|squat press|seated leg press|leg ?& ?glute press|leg sled/i, "leg-press"],
  [/leg ext|knee ext|quad ext|leg machine/i, "leg-extension"],
  [/leg curl|ham(string)? curl|nordic|glute[- ]ham|kneeling curl|prone curl|seated curl/i, "leg-curl"],
  [/hip thrust|glute|gluteus|booty|kickback|kick back|rear kick|multi[- ]?hip|hip extension|reverse hyper|hip press/i, "hip-thrust"],
  [/abduct|adduct|inner thigh|outer thigh|thigh/i, "abduction"],
  [/pec(\s*\/\s*|\s*&\s*|\s+)rear|rear delt\s*\/\s*pec|fly ?\/ ?rear|chest ?& ?back fly/i, "chest-fly"],
  [/rear delt|reverse fly|reverse butterfly|butterfly reverse|rear deltoid/i, "rear-delt"],
  [/lateral raise|\blateral\b|delt(oid)? raise|side raise|shoulder raise/i, "lateral-raise"],
  [/pullover|pull over/i, "pullover"],
  [/pull ?down|lat machine|lat pull|\blat\b|\bchin\b|pull-?up/i, "pulldown"],
  [/\brows?\b|t-bar|tbar|shrug/i, "row"],
  [/\bpec\b|\bfly\b|butterfly|pec deck|chest fly/i, "chest-fly"],
  [/incline/i, "incline-press"],
  [/tricep|triceps|pushdown|push down|\bdip\b|arm ext|over ?head ext|french press|skull ?crush/i, "triceps"],
  [/shoulder press|overhead press|military|delt(oid)? press|viking press|shoulder/i, "shoulder-press"],
  [/chest press|bench press|flat press|decline|\bchest\b|multi[- ]?press|converging press|horizontal press|press machine|wide chest/i, "chest-press"],
  [/bicep|biceps|arm curl|preacher|\bcurl\b/i, "biceps"],
  [/back ext|low back|lower back|lumbar|hyperext|hyper ext|back machine|posterior chain|\bback\b/i, "lower-back"],
  [/abdominal|ab crunch|\bab\b|\babs\b|crunch|torso|rotary|rotation|oblique|leg raise|knee raise|sit[- ]?up|roman chair|core|twist/i, "core"],
  [/belt squat|v-?squat|squat|lunge|jammer|ground base/i, "squat"],
  [/functional trainer|freedom trainer|humansport|kinesis|cable column|crossover|dual pulley|dual adjustable|cable|multi[- ]?station|\bstation\b|multi gym|multi[- ]?flex|jungle|pulley|smith|bench|rack|cage/i, "multi"],
];

export function classify(name: string): Movement | null {
  if (NOT_A_MACHINE.test(name)) return null;
  // "ISO-Lateral Row" is a row, not a lateral raise
  const n = name.replace(/iso-?lateral/gi, " ");
  for (const [re, m] of RULES) if (re.test(n)) return m;
  return null;
}

export function inferLoading(name: string, hint?: Loading): Loading {
  if (hint) return hint;
  if (/plate[- ]?load|\bplate\b|lever|iso-?lateral|ground base|leverage|pendulum|belt squat|hack|t-bar/i.test(name)) return "plate";
  if (/functional trainer|cable|crossover|pulley|column/i.test(name)) return "cable";
  if (/bench|rack|cage|smith|platform/i.test(name)) return "bench-rack";
  return "selectorized";
}

export const isIsoLateral = (name: string) =>
  /iso-?lateral|unilateral|independent|dual[- ]axis|\bdual\b|converging|diverging/i.test(name);

/**
 * Strip what the card already shows elsewhere: a leading brand or series name ("Hammer Strength Select Lat
 * Pulldown" → "Lat Pulldown") and catalogue model codes ("Olympic Flat Bench 9NN-B7503-60ARS").
 */
export function shortenName(name: string, brandNames: string[], series?: string) {
  let n = name;
  const lead = [...brandNames, "Precor", series ?? ""]
    .filter(Boolean)
    // "Plate-Loaded" should also strip "Plate Loaded"
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[\s-]+/g, "[\\s-]+"));
  for (let pass = 0; pass < 3; pass++) {
    for (const l of lead) n = n.replace(new RegExp(`^${l}(\\s+series)?\\b\\s*[-–:|]?\\s*`, "i"), "");
  }
  n = n
    // Codes are all-caps after tidyName, so "45-Degree" and "4-Way" survive
    .replace(/\b\d[A-Z0-9]*(-[A-Z0-9]*[A-Z][A-Z0-9]*|-\d+[A-Z]+[A-Z0-9]*)+\b/g, "")
    // Trailing catalogue codes ("Pec Fly / Rear Delt DSL0505")
    .replace(/\s+[A-Z]{2,4}\d{3,5}[A-Z]?$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return n.length >= 3 ? n : name;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[®™]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
}

const decode = (s: string) =>
  s
    .replace(/&#8211;|&#8212;/g, "–")
    .replace(/&#8217;|&#039;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    // Feeds that were double-encoded as Latin-1 ("45Â°", "â€“")
    .replace(/Â(?=[°®™])/g, "")
    .replace(/â€“|â€”/g, "–")
    .replace(/â€™/g, "'")
    .replace(/<[^>]+>/g, "");

/** Clean feed titles: drop condition notes and trademarks, title-case shouting, keep model codes. */
export function tidyName(raw: string) {
  const s = decode(raw)
    .replace(/\bt\s*[–-]\s*bar\b/gi, "T-Bar")
    .replace(/\((remanufactured|refurbished|new|used|serviced|pre-?owned|cosmetic[^)]*)\)/gi, "")
    .replace(/^(used|refurbished|remanufactured)\s+/i, "")
    .replace(/[®™]/g, "")
    .replace(/[ㄱ-힝]+/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  const words = s.split(" ").map((w) => {
    if (/^(iso-lateral)$/i.test(w)) return "ISO-Lateral";
    if (/^(roc-it|vr1|vr2|vr3|mts|hlp)$/i.test(w)) return w.toUpperCase();
    // Units and abbreviations, allowing trailing punctuation ("Kg,")
    const bare = w.replace(/[,.;:]$/, "");
    const tail = w.slice(bare.length);
    if (/^(lb|lbs|kg|mm|cm)$/i.test(bare)) return bare.toLowerCase() + tail;
    if (/^(ez|pu)$/i.test(bare)) return bare.toUpperCase() + tail;
    if (/^[/&|–-]$/.test(w)) return w;
    // Model codes keep capitals segment by segment ("9NN-B7503-60ARS"); words stay words ("45-Degree")
    return w
      .split("-")
      .map((seg) => (/\d/.test(seg) && /^[A-Za-z0-9./]+$/.test(seg) ? seg.toUpperCase() : cap(seg)))
      .join("-");
  });
  return words
    .join(" ")
    .replace(/\(([a-z]{1,2}-?\d{2,4}[a-z]?)\)/gi, (_, c: string) => `(${c.toUpperCase()})`)
    .replace(/\s+\/\s*|\s*\/\s+/g, " / ")
    .replace(/^[-–|\s]+|[-–|\s]+$/g, "");
}
