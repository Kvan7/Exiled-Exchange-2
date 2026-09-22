import {
  applyEleAugment,
  calcBase,
  calcBaseDamage,
  calcTotal,
  calcTotalDamage,
  recalculateItemProperties,
} from "@/parser/calc-base";
import {
  calcPropBounds,
  calcPropPercentile,
  propAt20Quality,
} from "@/parser/calc-q20";
import { ItemCategory } from "@/parser";
import { ModifierType, StatCalculated } from "@/parser/modifiers";
import { ParsedItem } from "@/parser/ParsedItem";
import { createTestItem } from "@specs/helper";
import { describe, expect, it } from "vitest";

function calculatedStat(ref: string, value: number): StatCalculated {
  return {
    stat: { ref } as StatCalculated["stat"],
    type: ModifierType.Explicit,
    sources: [
      {
        contributes: { value, min: value, max: value },
      } as StatCalculated["sources"][number],
    ],
  };
}

function item(props: Partial<ParsedItem> = {}): ParsedItem {
  return Object.assign(createTestItem(), props);
}

describe("recalculateItemProperties", () => {
  it("ignores category changes and items without a category", () => {
    const changed = item({ category: ItemCategory.Bow, weaponPHYSICAL: 100 });
    recalculateItemProperties(changed, item({ category: ItemCategory.Helmet }));
    expect(changed.weaponPHYSICAL).toBe(100);

    const uncategorized = item({ weaponPHYSICAL: 100 });
    recalculateItemProperties(uncategorized, item());
    expect(uncategorized.weaponPHYSICAL).toBe(100);
  });

  it("recalculates every weapon property from its base and current modifiers", () => {
    const oldItem = item({
      category: ItemCategory.Bow,
      weaponPHYSICAL: 100,
      weaponAS: 1.2,
      weaponFIRE: 5,
      weaponCOLD: 6,
      weaponLIGHTNING: 7,
      weaponELEMENTAL: 18,
      weaponCRIT: 10,
      weaponSPIRIT: 20,
    });
    const newItem = item({
      category: ItemCategory.Bow,
      weaponPHYSICAL: 100,
      weaponAS: 1.2,
      weaponFIRE: 5,
      weaponCOLD: 6,
      weaponLIGHTNING: 7,
      weaponELEMENTAL: 18,
      weaponCRIT: 10,
      weaponSPIRIT: 20,
      statsByType: [
        calculatedStat("Adds # to # Physical Damage", 10),
        calculatedStat("#% increased Physical Damage", 20),
        calculatedStat("#% increased Attack Speed", 10),
        calculatedStat("Adds # to # Fire Damage", 2),
        calculatedStat("Adds # to # Cold Damage", 3),
        calculatedStat("Adds # to # Lightning Damage", 4),
        calculatedStat("#% to Critical Hit Chance", 1),
        calculatedStat("#% increased Critical Hit Chance", 10),
        calculatedStat("# to Spirit", 5),
        calculatedStat("#% increased Spirit", 25),
      ],
    });

    recalculateItemProperties(newItem, oldItem);

    expect(newItem.weaponPHYSICAL).toBeCloseTo(132);
    expect(newItem.weaponAS).toBeCloseTo(1.32);
    expect(newItem.weaponFIRE).toBeCloseTo(7);
    expect(newItem.weaponCOLD).toBeCloseTo(9);
    expect(newItem.weaponLIGHTNING).toBeCloseTo(11);
    expect(newItem.weaponELEMENTAL).toBeCloseTo(27);
    expect(newItem.weaponCRIT).toBeCloseTo(12.1);
    expect(newItem.weaponSPIRIT).toBeCloseTo(31.25);
  });

  it("recalculates all present armour properties", () => {
    const oldItem = item({
      category: ItemCategory.Shield,
      armourAR: 100,
      armourEV: 80,
      armourES: 60,
      armourRW: 40,
      armourBLOCK: 20,
    });
    const newItem = item({
      category: ItemCategory.Shield,
      armourAR: 100,
      armourEV: 80,
      armourES: 60,
      armourRW: 40,
      armourBLOCK: 20,
      statsByType: [
        calculatedStat("# to Armour", 10),
        calculatedStat("#% increased Armour", 10),
        calculatedStat("# to Evasion Rating", 8),
        calculatedStat("#% increased Evasion Rating", 10),
        calculatedStat("# to maximum Energy Shield", 6),
        calculatedStat("#% increased Energy Shield", 10),
        calculatedStat("# to maximum Runic Ward", 4),
        calculatedStat("#% increased Runic Ward", 10),
        calculatedStat("#% increased Block chance", 10),
      ],
    });

    recalculateItemProperties(newItem, oldItem);

    expect(newItem.armourAR).toBeCloseTo(121);
    expect(newItem.armourEV).toBeCloseTo(96.8);
    expect(newItem.armourES).toBeCloseTo(72.6);
    expect(newItem.armourRW).toBeCloseTo(48.4);
    expect(newItem.armourBLOCK).toBeCloseTo(22);
  });
});

describe("applyEleAugment", () => {
  it.each([
    ["Glacial Rune", "weaponCOLD"],
    ["Lesser Glacial Rune", "weaponCOLD"],
    ["Greater Glacial Rune", "weaponCOLD"],
    ["Storm Rune", "weaponLIGHTNING"],
    ["Lesser Storm Rune", "weaponLIGHTNING"],
    ["Greater Storm Rune", "weaponLIGHTNING"],
    ["Desert Rune", "weaponFIRE"],
    ["Lesser Desert Rune", "weaponFIRE"],
    ["Greater Desert Rune", "weaponFIRE"],
  ] as const)("adds %s damage to a weapon", (augment, property) => {
    const target = item({ category: ItemCategory.Bow });

    applyEleAugment(target, augment, [2, 6]);

    expect(target.weaponELEMENTAL).toBe(4);
    expect(target[property]).toBe(4);
  });

  it("adds to existing elemental values and ignores unrelated augments", () => {
    const target = item({
      category: ItemCategory.Bow,
      weaponELEMENTAL: 10,
      weaponFIRE: 5,
    });
    applyEleAugment(target, "Desert Rune", [2, 6]);
    expect(target.weaponELEMENTAL).toBe(14);
    expect(target.weaponFIRE).toBe(9);

    applyEleAugment(target, "Iron Rune", [2, 6]);
    expect(target.weaponELEMENTAL).toBe(18);
    expect(target.weaponFIRE).toBe(9);
  });

  it("ignores non-weapons and malformed damage ranges", () => {
    const armour = item({ category: ItemCategory.Helmet });
    const caster = item({ category: ItemCategory.Wand });
    const unknown = item({ category: ItemCategory.Unknown });
    const weapon = item({ category: ItemCategory.Bow });

    applyEleAugment(armour, "Glacial Rune", [2, 6]);
    applyEleAugment(caster, "Glacial Rune", [2, 6]);
    applyEleAugment(unknown, "Glacial Rune", [2, 6]);
    applyEleAugment(weapon, "Glacial Rune", [2]);

    expect(armour.weaponELEMENTAL).toBeUndefined();
    expect(caster.weaponELEMENTAL).toBeUndefined();
    expect(unknown.weaponELEMENTAL).toBeUndefined();
    expect(weapon.weaponELEMENTAL).toBeUndefined();
  });
});

describe("base and total calculations", () => {
  const refs = { flat: ["flat"], incr: ["increased"] };

  it("removes and reapplies flat, increased, and quality modifiers", () => {
    const target = item({
      quality: 20,
      statsByType: [
        calculatedStat("flat", 10),
        calculatedStat("increased", 25),
      ],
    });

    expect(calcBase(target, 180, refs)).toBe(110);
    expect(calcBase(target, 137.5, refs, false)).toBe(100);
    expect(calcTotal(100, target, refs)).toBe(165);
    expect(calcTotal(100, target, refs, false)).toBe(137.5);
    expect(calcTotal(100, target, refs, false, true)).toBe(88);
  });

  it("calculates physical weapon base and total damage", () => {
    const weapon = item({
      category: ItemCategory.Bow,
      quality: 20,
      weaponPHYSICAL: 180,
      statsByType: [
        calculatedStat("Adds # to # Physical Damage", 10),
        calculatedStat("#% increased Physical Damage", 25),
      ],
    });

    expect(calcBaseDamage(weapon)).toBe(110);
    expect(calcTotalDamage(weapon, 110)).toBe(180);
  });

  it("returns zero damage for non-weapons", () => {
    const armour = item({ category: ItemCategory.Helmet });
    expect(calcBaseDamage(armour)).toBe(0);
    expect(calcTotalDamage(armour, 100)).toBe(0);
  });
});

describe("property roll calculations", () => {
  const refs = { flat: ["flat"], incr: ["increased"] };

  it("projects a modifiable item to at least 20 quality", () => {
    const target = item({
      quality: 10,
      statsByType: [
        calculatedStat("flat", 10),
        calculatedStat("increased", 20),
      ],
    });

    const result = propAt20Quality(132, refs, target);

    expect(result.roll.value).toBeCloseTo(144);
    expect(result.roll.min).toBeCloseTo(144);
    expect(result.roll.max).toBeCloseTo(144);
    expect(result.sources).toHaveLength(2);
    expect(result.sources.every((source) => !source.contributes)).toBe(true);
  });

  it("keeps current quality for an unmodifiable item", () => {
    const target = item({
      isCorrupted: true,
      quality: 10,
      statsByType: [
        calculatedStat("flat", 10),
        calculatedStat("increased", 20),
      ],
    });

    expect(propAt20Quality(132, refs, target).roll.value).toBeCloseTo(132);
  });

  it("calculates bounds and attributes increased-only contributions", () => {
    const combined = item({
      statsByType: [
        calculatedStat("flat", 10),
        calculatedStat("increased", 20),
      ],
    });
    const combinedBounds = calcPropBounds(132, refs, combined);
    expect(combinedBounds.roll).toEqual({ value: 132, min: 132, max: 132 });
    expect(combinedBounds.sources.every((source) => !source.contributes)).toBe(
      true,
    );

    const increasedOnly = item({
      statsByType: [calculatedStat("increased", 20)],
    });
    expect(
      calcPropBounds(120, { flat: [], incr: ["increased"] }, increasedOnly)
        .sources[0].contributes,
    ).toEqual({ value: 20, min: 20, max: 20 });

    const flatOnly = item({ statsByType: [calculatedStat("flat", 10)] });
    expect(
      calcPropBounds(110, { flat: ["flat"], incr: [] }, flatOnly).sources[0]
        .contributes,
    ).toEqual({ value: 10, min: 10, max: 10 });
  });

  it("calculates and clamps base percentiles", () => {
    const target = item();
    expect(calcPropPercentile(150, [100, 200], refs, target)).toBe(50);
    expect(calcPropPercentile(50, [100, 200], refs, target)).toBe(0);
    expect(calcPropPercentile(250, [100, 200], refs, target)).toBe(100);
  });
});
