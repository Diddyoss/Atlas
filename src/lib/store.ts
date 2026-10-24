"use client";

import { useSyncExternalStore } from "react";
import { MAX_COMPARE } from "./compare";
import type { UserVote } from "./votes";

/** Tiny localStorage-backed store shared across components and tabs. */
function createStore<T>(key: string, initial: T) {
  let value = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T;
    } catch {
      // Storage may be blocked; fall back to in-memory state.
    }
  };

  const emit = () => listeners.forEach((l) => l());

  return {
    subscribe(l: () => void) {
      load();
      listeners.add(l);
      const onStorage = (e: StorageEvent) => {
        if (e.key !== key) return;
        loaded = false;
        load();
        emit();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(l);
        window.removeEventListener("storage", onStorage);
      };
    },
    get() {
      load();
      return value;
    },
    getServer() {
      return initial;
    },
    set(next: T) {
      value = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Ignore quota or privacy-mode failures.
      }
      emit();
    },
  };
}

const compareStore = createStore<string[]>("atlas.compare", []);
const voteStore = createStore<Record<string, UserVote>>("atlas.votes", {});

export function useCompare() {
  const ids = useSyncExternalStore(compareStore.subscribe, compareStore.get, compareStore.getServer);
  return {
    ids,
    has: (id: string) => ids.includes(id),
    full: ids.length >= MAX_COMPARE,
    toggle(id: string) {
      const cur = compareStore.get();
      if (cur.includes(id)) compareStore.set(cur.filter((x) => x !== id));
      else if (cur.length < MAX_COMPARE) compareStore.set([...cur, id]);
    },
    remove(id: string) {
      compareStore.set(compareStore.get().filter((x) => x !== id));
    },
    clear() {
      compareStore.set([]);
    },
    replace(next: string[]) {
      compareStore.set(next.slice(0, MAX_COMPARE));
    },
  };
}

export function useUserVote(machineId: string) {
  const all = useSyncExternalStore(voteStore.subscribe, voteStore.get, voteStore.getServer);
  const vote = all[machineId];
  return {
    vote,
    all,
    set(next: UserVote) {
      voteStore.set({ ...voteStore.get(), [machineId]: next });
    },
  };
}

export function useAllVotes() {
  return useSyncExternalStore(voteStore.subscribe, voteStore.get, voteStore.getServer);
}
