import { __testExports } from "@/parser/Parser";
import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import {
  ArmourHighValueRareItem,
  HighDamageRareItem,
  MagicItem,
  NormalShield,
  RareItem,
  RareWithImplicit,
  TestItem,
  TwoImplicitItem,
  TwoLineOneImplicitItem,
  UniqueItem,
  WandRareItem,
} from "./items";
import { loadForLang } from "@/assets/data";
import { ItemCategory, ParsedItem } from "@/parser";

describe("parseModifiers", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });

  it.each([
    // [NormalItem, NormalItem.sectionCount],
    [MagicItem, [4]],
    [RareItem, [4]],
    [UniqueItem, [4]],
    [RareWithImplicit, [3, 4]],
    [HighDamageRareItem, [5, 6, 7]],
    [ArmourHighValueRareItem, [5, 6]],
    [WandRareItem, [3, 4]],
    [TwoImplicitItem, [3, 4]],
    [TwoLineOneImplicitItem, [2, 3]],
  ])(
    "%#, Each mod section is recognized",
    (testItem: TestItem, modifierSections: number[]) => {
      const sections = __testExports.itemTextToSections(testItem.rawText);
      const parsedItem: ParsedItem = {
        rarity: testItem.rarity,
        category: testItem.category,
        itemLevel: testItem.itemLevel,
        isUnidentified: false,
        isCorrupted: false,
        newMods: [],
        statsByType: [],
        unknownModifiers: [],
        influences: [],
        info: testItem.info,
        rawText: undefined!,
      };

      modifierSections.forEach((section) => {
        const res = __testExports.parseModifiers(sections[section], parsedItem);
        expect(res).toBe("SECTION_PARSED");
      });
    },
  );

  it.each([
    ["MagicItem:explicit", MagicItem, 4, MagicItem.explicitCount],
    ["RareItem:explicit", RareItem, 4, RareItem.explicitCount],
    ["UniqueItem:uniqueAffix", UniqueItem, 4, UniqueItem.uniqueAffixCount],
    [
      "RareWithImplicit:implicit",
      RareWithImplicit,
      3,
      RareWithImplicit.implicitCount,
    ],
    [
      "RareWithImplicit:explicit",
      RareWithImplicit,
      4,
      RareWithImplicit.explicitCount,
    ],
    ["HighDamageRareItem:fixed", HighDamageRareItem, 5, 1],
    [
      "HighDamageRareItem:implicit",
      HighDamageRareItem,
      6,
      HighDamageRareItem.implicitCount,
    ],
    [
      "HighDamageRareItem:explicit",
      HighDamageRareItem,
      7,
      HighDamageRareItem.explicitCount,
    ],
    ["ArmourHighValueRareItem:fixed", ArmourHighValueRareItem, 5, 1],
    [
      "ArmourHighValueRareItem:explicit",
      ArmourHighValueRareItem,
      6,
      ArmourHighValueRareItem.explicitCount,
    ],
    ["WandRareItem:implicit", WandRareItem, 3, WandRareItem.implicitCount],
    ["WandRareItem:explicit", WandRareItem, 4, WandRareItem.explicitCount],
    ["NormalShield:implicit", NormalShield, 4, NormalShield.implicitCount],
    [
      "TwoImplicitItem:implicit",
      TwoImplicitItem,
      3,
      TwoImplicitItem.implicitCount,
    ],
    [
      "TwoImplicitItem:explicit",
      TwoImplicitItem,
      4,
      TwoImplicitItem.explicitCount,
    ],
    [
      "TwoLineOneImplicitItem:implicit",
      TwoLineOneImplicitItem,
      2,
      TwoLineOneImplicitItem.implicitCount,
    ],
    [
      "TwoLineOneImplicitItem:explicit",
      TwoLineOneImplicitItem,
      3,
      TwoLineOneImplicitItem.explicitCount,
    ],
  ])(
    "%s, Each mod section adds correct count to newMods",
    (
      testName: string,
      testItem: TestItem,
      section: number,
      expectedCount: number,
    ) => {
      const sections = __testExports.itemTextToSections(testItem.rawText);
      const parsedItem: ParsedItem = {
        rarity: testItem.rarity,
        category: testItem.category,
        itemLevel: testItem.itemLevel,
        isUnidentified: false,
        isCorrupted: false,
        newMods: [],
        statsByType: [],
        unknownModifiers: [],
        influences: [],
        info: testItem.info,
        rawText: undefined!,
      };

      const res = __testExports.parseModifiers(sections[section], parsedItem);
      expect(res).toBe("SECTION_PARSED");
      expect(parsedItem.newMods.length).toBe(expectedCount);
      expect(parsedItem.unknownModifiers.length).toBe(
        testItem.category === ItemCategory.Shield ? 1 : 0,
      );
    },
  );
});
