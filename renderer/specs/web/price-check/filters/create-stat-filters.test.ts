import { ItemRarity, ParsedItem } from "@/parser/ParsedItem";
import { __testExports } from "@/web/price-check/filters/create-stat-filters";
import { describe, expect, it } from "vitest";
import { createTestItem } from "@specs/helper";
import { StatFilterRoll } from "@/web/price-check/filters/interfaces";

describe("item mod count tests", () => {
  it.each([
    [ItemRarity.Normal, 0],
    [ItemRarity.Magic, 1],
    [ItemRarity.Rare, 3],
  ])("%#. Should return correct base for %s", (rarity, expected) => {
    const item: ParsedItem = {
      ...createTestItem(),
      rarity,
    };

    const res = __testExports.itemMaxModifiersBySlot(item, []);

    expect(res).toEqual([expected * 2, expected, expected]);
  });

  function createTestStatByRef(
    ref: string,
    roll: number,
  ): { statRef: string; roll: StatFilterRoll } {
    return {
      statRef: ref,
      roll: {
        value: roll,
      } as unknown as StatFilterRoll,
    };
  }

  it.each([
    [ItemRarity.Rare, [], 3, 3],
    [ItemRarity.Rare, [{ ref: "# to all Attributes", roll: 1 }], 3, 3],
    [ItemRarity.Magic, [{ ref: "# Suffix Modifier allowed", roll: 2 }], 1, 3],
    [ItemRarity.Magic, [{ ref: "# Prefix Modifier allowed", roll: -1 }], 0, 1],
    [ItemRarity.Rare, [{ ref: "# Suffix Modifier allowed", roll: 2 }], 3, 5],
    [ItemRarity.Rare, [{ ref: "# Suffix Modifier allowed", roll: 1 }], 3, 4],
    [ItemRarity.Rare, [{ ref: "# Suffix Modifier allowed", roll: -1 }], 3, 2],
    [ItemRarity.Rare, [{ ref: "# Suffix Modifier allowed", roll: -2 }], 3, 1],
    [ItemRarity.Rare, [{ ref: "# Suffix Modifier allowed", roll: -3 }], 3, 0],
    [ItemRarity.Rare, [{ ref: "# Prefix Modifier allowed", roll: 2 }], 5, 3],
    [ItemRarity.Rare, [{ ref: "# Prefix Modifier allowed", roll: 1 }], 4, 3],
    [ItemRarity.Rare, [{ ref: "# Prefix Modifier allowed", roll: -1 }], 2, 3],
    [ItemRarity.Rare, [{ ref: "# Prefix Modifier allowed", roll: -2 }], 1, 3],
    [ItemRarity.Rare, [{ ref: "# Prefix Modifier allowed", roll: -3 }], 0, 3],
    [
      ItemRarity.Rare,
      [
        { ref: "# Prefix Modifier allowed", roll: 1 },
        { ref: "# Suffix Modifier allowed", roll: 1 },
      ],
      4,
      4,
    ],
    [
      ItemRarity.Rare,
      [
        { ref: "# Prefix Modifier allowed", roll: 2 },
        { ref: "# Suffix Modifier allowed", roll: -1 },
      ],
      5,
      2,
    ],
    [
      ItemRarity.Rare,
      [
        { ref: "# Prefix Modifier allowed", roll: -1 },
        { ref: "# Suffix Modifier allowed", roll: 2 },
      ],
      2,
      5,
    ],
    [
      ItemRarity.Rare,
      [
        { ref: "# Prefix Modifier allowed", roll: -2 },
        { ref: "# Suffix Modifier allowed", roll: -2 },
      ],
      1,
      1,
    ],
    [
      ItemRarity.Rare,
      [
        { ref: "# Prefix Modifier allowed", roll: -3 },
        { ref: "# Suffix Modifier allowed", roll: 2 },
      ],
      0,
      5,
    ],
  ])(
    "%#. should change amount for items with stats that modify max mods",
    (
      rarity: ItemRarity,
      stats: Array<{ ref: string; roll: number }>,
      expectedPrefix,
      expectedSuffix,
    ) => {
      const item: ParsedItem = {
        ...createTestItem(),
        rarity,
      };

      const res = __testExports.itemMaxModifiersBySlot(
        item,
        stats.map((stat) => createTestStatByRef(stat.ref, stat.roll)),
      );

      expect(res).toEqual([
        expectedPrefix + expectedSuffix,
        expectedPrefix,
        expectedSuffix,
      ]);
    },
  );
});
