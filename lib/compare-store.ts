"use client";

import { useSyncExternalStore } from "react";
import { MAX_COMPARE } from "./compare";

const KEY = "ironatlas:compare";
const listeners = new Set<() => void>();
let cache: string[] | null = null;
const EMPTY: string[] = [];

function read(): string[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string").slice(0, MAX_COMPARE) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: string[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode); keep in-memory state
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCompare() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    ids,
    full: ids.length >= MAX_COMPARE,
    has: (slug: string) => ids.includes(slug),
    toggle: (slug: string) => {
      const cur = read();
      if (cur.includes(slug)) write(cur.filter((s) => s !== slug));
      else if (cur.length < MAX_COMPARE) write([...cur, slug]);
    },
    remove: (slug: string) => write(read().filter((s) => s !== slug)),
    set: (next: string[]) => write(next.slice(0, MAX_COMPARE)),
    clear: () => write([]),
  };
}
