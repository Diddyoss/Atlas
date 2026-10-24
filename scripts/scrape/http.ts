import robotsParser from "robots-parser";

export const USER_AGENT = "IronAtlasCatalogueBot/0.1 (+personal, non-commercial equipment comparison; respects robots.txt)";
const DELAY_MS = 1500;

type Robots = ReturnType<typeof robotsParser>;
const robotsCache = new Map<string, Robots | null>();
const lastHit = new Map<string, number>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function robotsFor(url: URL): Promise<Robots | null> {
  if (robotsCache.has(url.origin)) return robotsCache.get(url.origin)!;
  const robotsUrl = `${url.origin}/robots.txt`;
  let robots: Robots | null = null;
  try {
    const res = await fetch(robotsUrl, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(10_000) });
    // A missing robots.txt means everything is allowed; any other failure we treat the same way
    robots = robotsParser(robotsUrl, res.ok ? await res.text() : "");
  } catch {
    robots = robotsParser(robotsUrl, "");
  }
  robotsCache.set(url.origin, robots);
  return robots;
}

export class DisallowedError extends Error {}

/**
 * Documented public APIs whose operators invite programmatic use with a descriptive User-Agent,
 * even though their robots.txt keeps crawlers out of the same path.
 */
const SANCTIONED_APIS = ["https://commons.wikimedia.org/w/api.php"];

/** Polite fetch: checks robots.txt, waits between requests to the same host, identifies itself. */
export async function politeFetch(raw: string, init: { accept?: string } = {}) {
  const url = new URL(raw);
  const robots = await robotsFor(url);
  const sanctioned = SANCTIONED_APIS.some((api) => url.href.startsWith(api));
  if (!sanctioned && robots && robots.isAllowed(url.href, USER_AGENT) === false) {
    throw new DisallowedError(`robots.txt disallows ${url.href}`);
  }
  const delay = Math.max(DELAY_MS, (robots?.getCrawlDelay(USER_AGENT) ?? 0) * 1000);
  const wait = (lastHit.get(url.host) ?? 0) + delay - Date.now();
  if (wait > 0) await sleep(wait);
  lastHit.set(url.host, Date.now());

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: init.accept ?? "text/html,application/json;q=0.9,*/*;q=0.5" },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.href}`);
  return res;
}

export async function fetchText(url: string) {
  return (await politeFetch(url)).text();
}

export async function fetchJson<T>(url: string): Promise<T> {
  return (await politeFetch(url, { accept: "application/json" })).json() as Promise<T>;
}

export async function fetchBuffer(url: string) {
  const res = await politeFetch(url, { accept: "image/*" });
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`Not an image (${type}) at ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
