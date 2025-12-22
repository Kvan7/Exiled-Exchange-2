import { CLIENT_STRINGS as _$ } from "@/assets/data";
import { __testExports } from "@/parser/Parser";
import { beforeEach, describe, expect, it, test } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import {
  ArmourHighValueRareItem,
  HighDamageRareItem,
  MagicItem,
  NormalItem,
  RareItem,
  RareWithImplicit,
  TestItem,
  UniqueItem,
  WandRareItem,
} from "./items";
import { loadForLang } from "@/assets/data";
import { ParsedItem } from "@/parser";

describe("itemTextToSections", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test("empty string should not throw", () => {
    expect(() => __testExports.itemTextToSections("")).not.toThrow();
  });

  it.each([
    [RareItem.rawText, RareItem.sectionCount],
    [MagicItem.rawText, MagicItem.sectionCount],
    [NormalItem.rawText, NormalItem.sectionCount],
    [UniqueItem.rawText, UniqueItem.sectionCount],
    [RareWithImplicit.rawText, RareWithImplicit.sectionCount],
    [HighDamageRareItem.rawText, HighDamageRareItem.sectionCount],
    [ArmourHighValueRareItem.rawText, ArmourHighValueRareItem.sectionCount],
    [WandRareItem.rawText, WandRareItem.sectionCount],
  ])("standard item", (text: string, sectionCount: number) => {
    const sections = __testExports.itemTextToSections(text);
    expect(sections.length).toBe(sectionCount);
  });
});

describe("parseWeapon", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test("Magic Weapon", () => {
    const sections = __testExports.itemTextToSections(MagicItem.rawText);
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseWeapon(sections[1], parsedItem);

    // console.log(sections);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.weaponPHYSICAL).toBe(MagicItem.weaponPHYSICAL);
    expect(parsedItem.weaponELEMENTAL).toBe(MagicItem.weaponELEMENTAL);
    expect(parsedItem.weaponAS).toBe(MagicItem.weaponAS);
    expect(parsedItem.weaponCRIT).toBe(MagicItem.weaponCRIT);
    expect(parsedItem.weaponReload).toBe(MagicItem.weaponReload);
  });
  test("Rare Weapon", () => {
    const sections = __testExports.itemTextToSections(RareItem.rawText);
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseWeapon(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.weaponPHYSICAL).toBe(RareItem.weaponPHYSICAL);
    expect(parsedItem.weaponELEMENTAL).toBe(RareItem.weaponELEMENTAL);
    expect(parsedItem.weaponAS).toBe(RareItem.weaponAS);
    expect(parsedItem.weaponCRIT).toBe(RareItem.weaponCRIT);
    expect(parsedItem.weaponReload).toBe(RareItem.weaponReload);
  });
  test("High Damage Rare Weapon", () => {
    const sections = __testExports.itemTextToSections(
      HighDamageRareItem.rawText,
    );
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseWeapon(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.weaponPHYSICAL).toBe(HighDamageRareItem.weaponPHYSICAL);
    expect(parsedItem.weaponELEMENTAL).toBe(HighDamageRareItem.weaponELEMENTAL);
    expect(parsedItem.weaponAS).toBe(HighDamageRareItem.weaponAS);
    expect(parsedItem.weaponCRIT).toBe(HighDamageRareItem.weaponCRIT);
    expect(parsedItem.weaponReload).toBe(HighDamageRareItem.weaponReload);
    expect(parsedItem.quality).toBe(HighDamageRareItem.quality);
  });
});

describe("parseArmour", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test("Normal Armour", () => {
    const sections = __testExports.itemTextToSections(NormalItem.rawText);
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseArmour(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.armourAR).toBe(NormalItem.armourAR);
    expect(parsedItem.armourEV).toBe(NormalItem.armourEV);
    expect(parsedItem.armourES).toBe(NormalItem.armourES);
    expect(parsedItem.quality).toBe(NormalItem.quality);
    expect(parsedItem.armourBLOCK).toBe(NormalItem.armourBLOCK);
  });
  test("Unique Armour", () => {
    const sections = __testExports.itemTextToSections(UniqueItem.rawText);
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseArmour(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.armourAR).toBe(UniqueItem.armourAR);
    expect(parsedItem.armourEV).toBe(UniqueItem.armourEV);
    expect(parsedItem.armourES).toBe(UniqueItem.armourES);
    expect(parsedItem.quality).toBe(UniqueItem.quality);
    expect(parsedItem.armourBLOCK).toBe(UniqueItem.armourBLOCK);
  });
  test("High Armour Rare", () => {
    const sections = __testExports.itemTextToSections(
      ArmourHighValueRareItem.rawText,
    );
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseArmour(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.armourAR).toBe(ArmourHighValueRareItem.armourAR);
    expect(parsedItem.armourEV).toBe(ArmourHighValueRareItem.armourEV);
    expect(parsedItem.armourES).toBe(ArmourHighValueRareItem.armourES);
    expect(parsedItem.quality).toBe(ArmourHighValueRareItem.quality);
    expect(parsedItem.armourBLOCK).toBe(ArmourHighValueRareItem.armourBLOCK);
  });
});

describe("parseRequirements", () => {
  it.each([
    ["Normal", NormalItem],
    ["Magic", MagicItem],
    ["Rare", RareItem],
    ["Unique", UniqueItem],
    ["RareWithImplicit", RareWithImplicit],
    ["HighDamageRare", HighDamageRareItem],
    ["ArmourHighValueRare", ArmourHighValueRareItem],
    ["WandRare", WandRareItem],
  ])(
    "%s, items parse requirements",
    async (testName: string, item: TestItem) => {
      setupTests();
      await loadForLang("en");
      const sections = __testExports.itemTextToSections(item.rawText);
      const parsedItem = {} as ParsedItem;

      const res = __testExports.parseRequirements(
        sections.find((s) => s.some((l) => l.startsWith(_$.REQUIRES)))!,
        parsedItem,
      );

      expect(res).toBe("SECTION_PARSED");
      expect(parsedItem.requires).toEqual(item.requires);
    },
  );

  it.each([
    [
      "en",
      "Requires: Level 28, 57 (augmented) Str",
      { level: 28, str: 57, dex: 0, int: 0 },
    ],
    [
      "cmn-Hant",
      "需求: 等級 80, 108 (unmet) 智慧",
      { level: 80, str: 0, dex: 0, int: 108 },
    ],
    [
      "ja",
      "装備条件：レベル 72, 70 筋力, 70 知性",
      { level: 72, str: 70, dex: 0, int: 70 },
    ],
    [
      "ko",
      "요구 사항: 레벨 78, 89 힘, 89 (unmet) 민첩",
      { level: 78, str: 89, dex: 89, int: 0 },
    ],
    [
      "cmn-Hant",
      "需求: 等級 78, 54 力量, 138 智慧",
      { level: 78, str: 54, dex: 0, int: 138 },
    ],
    [
      "ru",
      "Требуется: Уровень 80, 59 (unmet) Ловк, 59 Инт",
      {
        level: 80,
        str: 0,
        dex: 59,
        int: 59,
      },
    ],
  ])(
    "%s requires regex works",
    async (
      lang: string,
      str: string,
      expectedResult: ParsedItem["requires"],
    ) => {
      setupTests();
      await loadForLang(lang);
      const parsedItem = {} as ParsedItem;

      const res = __testExports.parseRequirements([str], parsedItem);

      expect(res).toBe("SECTION_PARSED");
      expect(parsedItem.requires).toEqual(expectedResult);
    },
  );
});
