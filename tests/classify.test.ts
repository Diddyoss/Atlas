import { describe, expect, it } from "vitest";
import { classify, inferLoading, isIsoLateral, shortenName, slugify, tidyName } from "../scripts/discover/classify";
import { estimateEquipment } from "@/data/templates";
import { EquipmentSchema } from "@/lib/types";

describe("classify", () => {
  it.each([
    ["ISO-Lateral Row", "row"],
    ["Iso-Lateral Super Incline Press", "incline-press"],
    ["Plate Loaded Pendulum Squat", "pendulum-squat"],
    ["Super Hack Squat", "hack-squat"],
    ["Leg Ext / Leg Curl Combo", "leg-extension"],
    ["Seated Leg Curl", "leg-curl"],
    ["Pec Fly / Rear Delt", "chest-fly"],
    ["Rear Delt Fly", "rear-delt"],
    ["Standing Lateral Raise", "lateral-raise"],
    ["Lat Pulldown / Low Row", "pulldown"],
    ["Chest Support T-Bar Row", "row"],
    ["Glute Drive", "hip-thrust"],
    ["Inner/Outer Thigh", "abduction"],
    ["Seated Calf Raise", "calf"],
    ["Biceps Curl", "biceps"],
    ["Seated Dip", "triceps"],
    ["Low Back Extension", "lower-back"],
    ["Abdominal Crunch", "core"],
    ["Belt Squat", "squat"],
    ["Functional Trainer", "functional-trainer"],
    ["Dual Adjustable Pulley", "functional-trainer"],
    ["Kinesis One", "functional-trainer"],
    ["Adjustable Cable Crossover", "cable-crossover"],
    ["High Low Pulley", "cable-crossover"],
    ["8-Station Tower", "cable-crossover"],
    ["Power Rack With Dual Adjustable Pulley", "multi"],
    ["Jungle Machine HLP", "multi"],
    ["Cable Crossover Multigym", "multi"],
  ])("%s → %s", (name, movement) => {
    expect(classify(name)).toBe(movement);
  });

  it("doesn't read 'machine' as a chin-up", () => {
    expect(classify("Smith Machine Selectorized")).toBe("multi");
    expect(classify("Selection Pectoral Pec Fly Machine")).toBe("chest-fly");
    expect(classify("Calf Hack Machine")).toBe("calf");
  });

  it.each(["Olympic Bar Holder", "Weight Plates 25kg", "Spotter Arms | PAIR", "Treadmill 95T", "Gift Card", "Replacement Pad Kit"])(
    "rejects non-machines: %s",
    (name) => {
      expect(classify(name)).toBeNull();
    },
  );
});

describe("naming helpers", () => {
  it("infers loading type", () => {
    expect(inferLoading("Plate Loaded Leg Press")).toBe("plate");
    expect(inferLoading("Dual Adjustable Pulley")).toBe("cable");
    expect(inferLoading("Leg Extension")).toBe("selectorized");
    expect(inferLoading("Leg Extension", "plate")).toBe("plate");
  });

  it("detects iso-lateral designs", () => {
    expect(isIsoLateral("Iso-Lateral Front Lat Pulldown")).toBe(true);
    expect(isIsoLateral("Leg Press")).toBe(false);
  });

  it("tidies feed titles", () => {
    expect(tidyName("CYBEX VR2 LEG PRESS (Remanufactured)")).toBe("Cybex VR2 Leg Press");
    expect(tidyName("Inspiration®  Chest Press")).toBe("Inspiration Chest Press");
    expect(slugify("Prime Plate-Loaded Leg Ext / Leg Curl Combo")).toBe("prime-plate-loaded-leg-ext-leg-curl-combo");
  });

  it("drops repeated brand/series prefixes and model codes", () => {
    expect(shortenName("Hammer Strength Select Lat Pulldown", ["Hammer Strength"], "Select")).toBe("Lat Pulldown");
    expect(shortenName("VR3 Lat Pull", ["Cybex"], "VR3")).toBe("Lat Pull");
    expect(shortenName("Insignia Series Calf Extension", ["Life Fitness"], "Insignia")).toBe("Calf Extension");
    expect(shortenName("Instinct Olympic Flat Bench 9NN-B7503-60ARS", ["Nautilus"], "Instinct")).toBe("Olympic Flat Bench");
    expect(shortenName(tidyName("45-degree leg press"), ["Flex Fitness"])).toBe("45-Degree Leg Press");
    expect(shortenName(tidyName("Inspiration Triceps Extension 9-IPTE5-60BZ"), ["Nautilus"], "Inspiration")).toBe("Triceps Extension");
    expect(shortenName(tidyName("Half Rack 9-HDHR2"), ["Nautilus"])).toBe("Half Rack");
    expect(tidyName("4-way neck")).toBe("4-Way Neck");
  });
});

describe("estimated entries", () => {
  it("produce schema-valid equipment flagged as estimated", () => {
    const e = estimateEquipment({
      slug: "x-row",
      brandSlug: "panatta",
      name: "Row",
      movement: "row",
      loading: "plate",
      isoLateral: true,
      discontinued: false,
      source: { label: "Dealer", url: "https://example.com/row" },
    });
    expect(EquipmentSchema.safeParse(e).success).toBe(true);
    expect(e.estimated).toBe(true);
    expect(e.feel.build).toBeGreaterThan(7); // Panatta build-quality nudge
  });
});
