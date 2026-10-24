import { useSyncExternalStore } from "react";

/**
 * In-memory router for the single-file build. Artifact pages can't use path
 * routes, so the current route lives here and history entries carry it.
 */
export interface Route {
  path: string;
  search: string;
}

let route: Route = { path: "/", search: "" };
const listeners = new Set<() => void>();

export function parseHref(href: string): Route {
  const [path, search = ""] = href.split("?");
  const clean = path.replace(/\/+$/, "") || "/";
  return { path: clean, search };
}

function emit() {
  listeners.forEach((l) => l());
}

export function navigate(href: string, { replace = false, scroll = true } = {}) {
  route = parseHref(href);
  try {
    const state = { atlas: href };
    if (replace) history.replaceState(state, "");
    else history.pushState(state, "");
  } catch {
    // History may be unavailable in a sandboxed frame; routing still works.
  }
  emit();
  if (scroll) window.scrollTo({ top: 0 });
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", (e) => {
    const href = (e.state as { atlas?: string } | null)?.atlas ?? "/";
    route = parseHref(href);
    emit();
  });
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => route,
  );
}
