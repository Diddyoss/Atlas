import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Community, FeelRating } from "./votes";

const FEEL_COLS = ["smoothness", "stability", "stretch", "rom", "ergonomics", "build"] as const;

let db: DatabaseSync | null = null;

function open() {
  if (db) return db;
  const file = process.env.IRONATLAS_DB ?? path.join(process.cwd(), "data", "community.db");
  mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS favorites (
      voter TEXT NOT NULL,
      slug TEXT NOT NULL,
      created INTEGER NOT NULL,
      PRIMARY KEY (voter, slug)
    );
    CREATE TABLE IF NOT EXISTS ratings (
      voter TEXT NOT NULL,
      slug TEXT NOT NULL,
      ${FEEL_COLS.map((c) => `${c} INTEGER NOT NULL`).join(",\n      ")},
      updated INTEGER NOT NULL,
      PRIMARY KEY (voter, slug)
    );
    CREATE INDEX IF NOT EXISTS favorites_slug ON favorites (slug);
    CREATE INDEX IF NOT EXISTS ratings_slug ON ratings (slug);
  `);
  return db;
}

export function getCommunity(slug: string, voter?: string): Community {
  const d = open();
  const fav = d.prepare("SELECT COUNT(*) AS n FROM favorites WHERE slug = ?").get(slug) as { n: number };
  const avg = d
    .prepare(`SELECT COUNT(*) AS n, ${FEEL_COLS.map((c) => `AVG(${c}) AS ${c}`).join(", ")} FROM ratings WHERE slug = ?`)
    .get(slug) as Record<string, number>;
  const mineFav = voter ? d.prepare("SELECT 1 FROM favorites WHERE voter = ? AND slug = ?").get(voter, slug) : undefined;
  const mineRating = voter
    ? (d.prepare(`SELECT ${FEEL_COLS.join(", ")} FROM ratings WHERE voter = ? AND slug = ?`).get(voter, slug) as
        | FeelRating
        | undefined)
    : undefined;

  return {
    favorites: fav.n,
    ratings: {
      count: avg.n,
      avg: avg.n
        ? (Object.fromEntries(FEEL_COLS.map((c) => [c, Math.round(avg[c] * 10) / 10])) as FeelRating)
        : null,
    },
    mine: { favorite: Boolean(mineFav), rating: mineRating ? { ...mineRating } : null },
  };
}

export function toggleFavorite(voter: string, slug: string) {
  const d = open();
  const del = d.prepare("DELETE FROM favorites WHERE voter = ? AND slug = ?").run(voter, slug);
  if (del.changes === 0) {
    d.prepare("INSERT INTO favorites (voter, slug, created) VALUES (?, ?, ?)").run(voter, slug, Date.now());
  }
}

export function setRating(voter: string, slug: string, feel: FeelRating) {
  open()
    .prepare(
      `INSERT INTO ratings (voter, slug, ${FEEL_COLS.join(", ")}, updated)
       VALUES (?, ?, ${FEEL_COLS.map(() => "?").join(", ")}, ?)
       ON CONFLICT (voter, slug) DO UPDATE SET ${FEEL_COLS.map((c) => `${c} = excluded.${c}`).join(", ")}, updated = excluded.updated`,
    )
    .run(voter, slug, ...FEEL_COLS.map((c) => feel[c]), Date.now());
}

export function getLeaderboard(limit = 10) {
  return open()
    .prepare(
      `SELECT f.slug, COUNT(*) AS favorites,
              (SELECT COUNT(*) FROM ratings r WHERE r.slug = f.slug) AS ratings
       FROM favorites f GROUP BY f.slug ORDER BY favorites DESC, f.slug LIMIT ?`,
    )
    .all(limit) as { slug: string; favorites: number; ratings: number }[];
}

export function getFavoriteCounts(slugs: string[]) {
  if (!slugs.length) return {};
  const rows = open()
    .prepare(`SELECT slug, COUNT(*) AS n FROM favorites WHERE slug IN (${slugs.map(() => "?").join(",")}) GROUP BY slug`)
    .all(...slugs) as { slug: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.slug, r.n]));
}
