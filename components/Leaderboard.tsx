"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { IS_STATIC } from "@/lib/use-community";

type Row = { slug: string; name: string; brand: string; favorites: number; ratings: number; vintage: boolean };

export function Leaderboard({ fallback }: { fallback: Omit<Row, "favorites" | "ratings">[] }) {
  const [rows, setRows] = useState<Row[] | null>(IS_STATIC ? [] : null);

  useEffect(() => {
    if (IS_STATIC) return;
    fetch("/api/community/leaderboard")
      .then((r) => r.json())
      .then((j: { top: Row[] }) => setRows(j.top))
      .catch(() => setRows([]));
  }, []);

  const empty = rows !== null && rows.length === 0;
  const list: Row[] = rows && rows.length ? rows : fallback.map((f) => ({ ...f, favorites: 0, ratings: 0 }));
  const max = Math.max(1, ...list.map((r) => r.favorites));

  return (
    <div>
      {empty && (
        <p className="label mb-4 text-weld">
          {IS_STATIC
            ? "Static preview: the shared leaderboard needs the server build. Showing editorial picks."
            : "No community votes yet. Showing editorial picks — open any machine and hit Favorite."}
        </p>
      )}
      <ol className="divide-y divide-rivet border-y border-rivet">
        {list.slice(0, 8).map((r, i) => (
          <motion.li
            key={r.slug}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/equipment/${r.slug}`} className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 py-3">
              <span className="stencil text-3xl text-weld group-hover:text-chalk">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <p className="label text-ash">
                  {r.brand}
                  {r.vintage ? " · vintage" : ""}
                </p>
                <p className="truncate text-lg group-hover:underline">{r.name}</p>
                {r.favorites > 0 && (
                  <div className="mt-1 h-1 bg-rivet">
                    <motion.div
                      className="h-full bg-chalk"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(r.favorites / max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                    />
                  </div>
                )}
              </div>
              <span className="font-mono text-sm text-ash">{r.favorites > 0 ? `★ ${r.favorites}` : "★ pick"}</span>
            </Link>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
