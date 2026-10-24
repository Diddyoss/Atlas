import { describe, expect, it } from "vitest";
import { MACHINE_MAP } from "@/data/machines";
import { buildRows, parseIds, winnerIndex } from "@/lib/compare";
import { resistanceCurve } from "@/lib/curve";
import { approval, mergeVote, seedTally } from "@/lib/votes";

const pend = ["atlantis-pendulum-squat", "panatta-super-pendulum-squat", "watson-pendulum-squat"].map((id) => MACHINE_MAP[id]);

describe("compare", () => {
  it("flags rows that differ and marks a single winner", () => {
    const rows = buildRows(pend);
    expect(rows.find((r) => r.label === "Movement")!.differs).toBe(false);
    const feel = rows.find((r) => r.label === "Feel")!;
    expect(feel.differs).toBe(true);
    const best = Math.max(...feel.numeric!);
    expect(winnerIndex(feel)).toBe(feel.numeric!.indexOf(best));
  });

  it("parses, dedupes and caps ids", () => {
    expect(parseIds("a,b,a,c,d,e")).toEqual(["a", "b", "c", "d"]);
    expect(parseIds(null)).toEqual([]);
  });

  it("gives machines with the same curve shape distinct curves", () => {
    const [a, b] = pend.map((m) => resistanceCurve(m));
    expect(a).not.toEqual(b);
    expect(Math.max(...a)).toBeCloseTo(1);
  });

  it("puts descending curves' peak in the stretch and ascending at lockout", () => {
    const desc = resistanceCurve(MACHINE_MAP["panatta-super-lat-machine"]);
    const asc = resistanceCurve(MACHINE_MAP["panatta-hip-thrust"]);
    expect(desc.indexOf(Math.max(...desc))).toBeLessThan(desc.length / 3);
    expect(asc.indexOf(Math.max(...asc))).toBeGreaterThan((desc.length * 2) / 3);
  });
});

describe("votes", () => {
  it("adds a user's vote to the seeded tally", () => {
    const m = pend[0];
    const base = seedTally(m);
    const merged = mergeVote(base, { thumb: "up", scores: { feel: 5 } });
    expect(merged.up).toBe(base.up + 1);
    expect(merged.scores.feel.count).toBe(base.scores.feel.count + 1);
    expect(approval(merged)).toBeGreaterThanOrEqual(approval(base));
  });
});
