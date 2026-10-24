"use client";

import { useSyncExternalStore } from "react";
import { MAX_COMPARE, type CompareEntry } from "./compare";

const KEY = "ironatlas:compare:v2";
const listeners = new Set<() => void>();
let cache: CompareEntry[] | null = null;
const EMPTY: CompareEntry[] = [];

const isEntry = (e: unknown): e is CompareEntry =>
  typeof e === "object" && e !== null && typeof (e as CompareEntry).slug === "string" && typeof (e as CompareEntry).name === "string";

function read(): CompareEntry[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter(isEntry).slice(0, MAX_COMPARE) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: CompareEntry[]) {
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
  const entries = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ids = entries.map((e) => e.slug);
  return {
    entries,
    ids,
    full: entries.length >= MAX_COMPARE,
    has: (slug: string) => ids.includes(slug),
    toggle: (entry: CompareEntry) => {
      const cur = read();
      if (cur.some((e) => e.slug === entry.slug)) write(cur.filter((e) => e.slug !== entry.slug));
      else if (cur.length < MAX_COMPARE) write([...cur, entry]);
    },
    remove: (slug: string) => write(read().filter((e) => e.slug !== slug)),
    set: (next: CompareEntry[]) => write(next.slice(0, MAX_COMPARE)),
    clear: () => write([]),
  };
}
