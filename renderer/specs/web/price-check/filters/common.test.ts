import { ItemCategory, ItemRarity } from "@/parser";
import { ModifierType, StatCalculated } from "@/parser/modifiers";
import { ParsedItem } from "@/parser/ParsedItem";
import {
  explicitModifierCount,
  hasCraftingValue,
  likelyFinishedItem,
  maxUsefulItemLevel,
} from "@/web/price-check/filters/common";
import { createTestItem } from "@specs/helper";
import { describe, expect, it } from "vitest";

function item(props: Partial<ParsedItem> = {}): ParsedItem {
  return Object.assign(createTestItem(), props);
}

describe("maxUsefulItemLevel", () => {
  it.each([
    [ItemCategory.Wand, 81],
    [ItemCategory.Staff, 81],
    [ItemCategory.Relic, 80],
    [ItemCategory.Tablet, 1],
    [ItemCategory.Jewel, 1],
    [ItemCategory.Map, 1],
    [ItemCategory.Bow, 82],
    [undefined, 82],
  ])("returns the cap for %s", (category, expected) => {
    expect(maxUsefulItemLevel(category)).toBe(expected);
  });
});

describe("likelyFinishedItem", () => {
  it("recognizes unique, crafted, fully qualitied, and unmodifiable items", () => {
    const crafted = {
      type: ModifierType.Crafted,
    } as StatCalculated;

    expect(likelyFinishedItem(item({ rarity: ItemRarity.Unique }))).toBe(true);
    expect(likelyFinishedItem(item({ statsByType: [crafted] }))).toBe(true);
    expect(likelyFinishedItem(item({ quality: 20 }))).toBe(true);
    expect(likelyFinishedItem(item({ isCorrupted: true }))).toBe(true);
  });

  it("does not treat an unfinished modifiable item as finished", () => {
    expect(
      likelyFinishedItem(item({ rarity: ItemRarity.Rare, quality: 10 })),
    ).toBe(false);
    expect(
      likelyFinishedItem(item({ quality: 20, qualityType: "Anomalous" })),
    ).toBe(false);
  });
});

describe("hasCraftingValue", () => {
  it.each([
    { isSynthesised: true },
    { isFractured: true },
    { influences: ["Shaper"] },
    { category: ItemCategory.ClusterJewel },
    { category: ItemCategory.Jewel, rarity: ItemRarity.Magic },
    { category: ItemCategory.Bow, itemLevel: 67 },
    {
      augmentSockets: { empty: 0, current: 2, normal: 1, augments: [] },
    },
    { quality: 21 },
  ] as Array<Partial<ParsedItem>>)(
    "recognizes a modifiable crafting base: %o",
    (props) => {
      expect(hasCraftingValue(item(props))).toBeTruthy();
    },
  );

  it("rejects ordinary and unmodifiable items", () => {
    expect(
      hasCraftingValue(
        item({ category: ItemCategory.Bow, itemLevel: 66, quality: 20 }),
      ),
    ).toBe(false);
    expect(
      hasCraftingValue(item({ isSynthesised: true, isCorrupted: true })),
    ).toBe(false);
  });
});

describe("explicitModifierCount", () => {
  function modifier(type: ModifierType, generation?: "prefix" | "suffix") {
    return { info: { type, generation, tags: [] }, stats: [] };
  }

  it("returns zeroes when no random explicit modifiers exist", () => {
    const target = item({
      newMods: [
        modifier(ModifierType.Implicit),
        modifier(ModifierType.Augment),
      ],
    });
    expect(explicitModifierCount(target)).toEqual({
      prefixes: 0,
      suffixes: 0,
      total: 0,
    });
  });

  it("counts all explicit-family prefixes and suffixes", () => {
    const target = item({
      newMods: [
        modifier(ModifierType.Explicit, "prefix"),
        modifier(ModifierType.Fractured, "prefix"),
        modifier(ModifierType.Veiled, "suffix"),
        modifier(ModifierType.Desecrated, "suffix"),
        modifier(ModifierType.Crafted, "suffix"),
        modifier(ModifierType.Sanctum, "prefix"),
        modifier(ModifierType.Implicit, "prefix"),
      ],
    });

    expect(explicitModifierCount(target)).toEqual({
      prefixes: 3,
      suffixes: 3,
      total: 6,
    });
  });
});
