"use client";

import Link from "next/link";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function HomeHero({ stats }: { stats: { label: string; value: number }[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const reduce = useReducedMotion();

  return (
    <section ref={ref} className="relative overflow-hidden border-b border-rivet">
      {!reduce && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-scan h-24 w-full bg-gradient-to-b from-transparent via-chalk/[0.04] to-transparent" />
        </div>
      )}
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[1.3fr_1fr] lg:py-24">
        <div>
          <motion.p
            className="label flex items-center gap-3 text-ash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="inline-block h-2 w-2 animate-blink bg-chalk" />
            Equipment compendium for lifters
          </motion.p>
          <h1 className="stencil mt-4 text-[clamp(3.5rem,11vw,9rem)]">
            {["Know", "your", "iron."].map((w, i) => (
              <span key={w} className="block overflow-hidden">
                <motion.span
                  className={`block ${i === 2 ? "text-transparent [-webkit-text-stroke:2px_var(--color-chalk)]" : ""}`}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.35 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-6 max-w-xl text-lg text-ash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            Search strength machines by brand, name or the muscle you want to grow. Compare resistance curves, feel,
            accessibility and community favorites. Includes legends from brands that no longer exist.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
          >
            <Link href="/catalogue" className="label bg-chalk px-6 py-4 text-ink transition-transform hover:-translate-y-0.5">
              Browse the catalogue →
            </Link>
            <Link
              href="/compare?ids=panatta-super-pendulum-squat,watson-pendulum-squat,newtech-pendulum-squat"
              className="label border-2 border-chalk px-6 py-4 transition-colors hover:bg-chalk hover:text-ink"
            >
              Try a comparison
            </Link>
          </motion.div>
          <div className="mt-12 grid max-w-lg grid-cols-3 border border-rivet">
            {stats.map((s) => (
              <div key={s.label} className="border-r border-rivet p-4 last:border-r-0">
                <CountUp value={s.value} />
                <p className="label text-weld">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <motion.div style={{ rotate, y }} className="relative mx-auto w-full max-w-md">
          <Plate />
        </motion.div>
      </div>
    </section>
  );
}

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration: 1.6, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => controls.stop();
  }, [inView, mv, value]);
  return (
    <p ref={ref} className="stencil text-4xl tabular-nums">
      {display}
    </p>
  );
}

function Plate() {
  return (
    <motion.svg
      viewBox="0 0 400 400"
      className="w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
      initial={{ scale: 0.6, opacity: 0, rotate: -90 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      aria-hidden
    >
      <defs>
        <radialGradient id="plate-g" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="70%" stopColor="#161616" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </radialGradient>
        <path id="plate-text" d="M200,200 m-150,0 a150,150 0 1,1 300,0 a150,150 0 1,1 -300,0" />
      </defs>
      <circle cx="200" cy="200" r="190" fill="url(#plate-g)" stroke="#4a4a4a" strokeWidth="2" />
      <circle cx="200" cy="200" r="172" fill="none" stroke="#2a2a2a" strokeWidth="10" />
      <text className="fill-ash font-mono" fontSize="15" letterSpacing="7">
        <textPath href="#plate-text">IRON ATLAS · 20 KG · CALIBRATED · IRON ATLAS · 44 LB · </textPath>
      </text>
      <circle cx="200" cy="200" r="120" fill="none" stroke="#2f2f2f" strokeWidth="2" />
      {Array.from({ length: 3 }, (_, i) => {
        const a = (i * 120 * Math.PI) / 180;
        return <ellipse key={i} cx={200 + Math.cos(a) * 85} cy={200 + Math.sin(a) * 85} rx="26" ry="16" transform={`rotate(${i * 120 + 90} ${200 + Math.cos(a) * 85} ${200 + Math.sin(a) * 85})`} fill="#0a0a0a" stroke="#3a3a3a" />;
      })}
      <circle cx="200" cy="200" r="46" fill="#d6d6d2" />
      <circle cx="200" cy="200" r="38" fill="#9a9a96" />
      <circle cx="200" cy="200" r="26" fill="#0a0a0a" />
      <text x="200" y="140" textAnchor="middle" className="stencil fill-chalk" fontSize="44">
        20
      </text>
    </motion.svg>
  );
}
