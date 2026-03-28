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
import { init } from "@/assets/data";
import { ItemCategory, ItemRarity, ParsedItem } from "@/parser";

describe("[e2e] parseModifiers", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
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

describe("[unit] parseModifiers", () => {
  let parsedItem: ParsedItem = {} as unknown as ParsedItem;

  beforeEach(async () => {
    setupTests();
    await init("en");
    parsedItem = new TestItem("");
    parsedItem.rarity = ItemRarity.Rare;
    parsedItem.category = ItemCategory.Bow;
  });

  it("Should parse explicit modifiers", () => {
    const section = `{ Fractured Prefix Modifier "Electrocuting" (Tier: 2) — Damage, Elemental, Lightning, Attack }
Adds 10(1-16) to 273(239-300) Lightning Damage
{ Prefix Modifier "Razor-sharp" (Tier: 3) — Damage, Physical, Attack }
Adds 24(23-35) to 51(39-59) Physical Damage
{ Master Crafted Prefix Modifier "Overpowering" (Tier: 2) — Damage, Elemental, Attack }
109(100-119)% increased Elemental Damage with Attacks
{ Suffix Modifier "of the Drought" (Tier: 1) — Mana, Physical, Attack }
Leeches 7.59(7-7.9)% of Physical Damage as Mana
{ Desecrated Suffix Modifier "of Siphoning" (Tier: 3) — Mana }
Gain 21(21-27) Mana per enemy killed
{ Suffix Modifier "of Acclaim" (Tier: 1) — Attack, Speed }
18(17-19)% increased Attack Speed
`;

    const res = __testExports.parseModifiers(section.split("\n"), parsedItem);
    expect(res).toBe("SECTION_PARSED");
  });

  it("Should parse implicit modifiers", () => {
    const section = `{ Implicit Modifier — Attack }
Loads an additional bolt
`;

    const res = __testExports.parseModifiers(section.split("\n"), parsedItem);
    expect(res).toBe("SECTION_PARSED");
  });

  it("Should parse granted skill modifiers", () => {
    const section = `Grants Skill: Level 18 Cackling Companions
`;

    const res = __testExports.parseModifiers(section.split("\n"), parsedItem);
    expect(res).toBe("SECTION_PARSED");
  });

  it("Should parse augment modifiers", () => {
    const section = `18% increased Physical Damage (rune)
Gain 24 Mana per enemy killed (rune)
`;

    const res = __testExports.parseModifiers(section.split("\n"), parsedItem);
    expect(res).toBe("SECTION_PARSED");
  });

  it("Should parse rune modifiers", () => {
    const section = `45% increased Elemental Damage with Attacks (enchant)
`;

    const res = __testExports.parseModifiers(section.split("\n"), parsedItem);
    expect(res).toBe("SECTION_PARSED");
  });
});
