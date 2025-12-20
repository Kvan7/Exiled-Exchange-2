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
  UniqueItem,
  WandRareItem,
} from "./items";
import { loadForLang } from "@/assets/data";
import { ParsedItem } from "@/parser";

function findAndParseRequirementsSection(
  sections: string[][],
  parsedItem: ParsedItem,
) {
  for (const section of sections) {
    if (section[0].startsWith("Requires: ")) {
      return __testExports.parseRequirements(section, parsedItem);
    }
  }
}

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
    expect(findAndParseRequirementsSection(sections, parsedItem)).toBe(
      "SECTION_PARSED",
    );
    expect(parsedItem.weaponPHYSICAL).toBe(MagicItem.weaponPHYSICAL);
    expect(parsedItem.weaponELEMENTAL).toBe(MagicItem.weaponELEMENTAL);
    expect(parsedItem.weaponAS).toBe(MagicItem.weaponAS);
    expect(parsedItem.weaponCRIT).toBe(MagicItem.weaponCRIT);
    expect(parsedItem.weaponReload).toBe(MagicItem.weaponReload);
    expect(parsedItem.requires).toEqual(MagicItem.requires);
  });
  test("Rare Weapon", () => {
    const sections = __testExports.itemTextToSections(RareItem.rawText);
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseWeapon(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(findAndParseRequirementsSection(sections, parsedItem)).toBe(
      "SECTION_PARSED",
    );
    expect(parsedItem.weaponPHYSICAL).toBe(RareItem.weaponPHYSICAL);
    expect(parsedItem.weaponELEMENTAL).toBe(RareItem.weaponELEMENTAL);
    expect(parsedItem.weaponAS).toBe(RareItem.weaponAS);
    expect(parsedItem.weaponCRIT).toBe(RareItem.weaponCRIT);
    expect(parsedItem.weaponReload).toBe(RareItem.weaponReload);
    expect(parsedItem.requires).toEqual(RareItem.requires);
  });
  test("High Damage Rare Weapon", () => {
    const sections = __testExports.itemTextToSections(
      HighDamageRareItem.rawText,
    );
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseWeapon(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(findAndParseRequirementsSection(sections, parsedItem)).toBe(
      "SECTION_PARSED",
    );
    expect(parsedItem.weaponPHYSICAL).toBe(HighDamageRareItem.weaponPHYSICAL);
    expect(parsedItem.weaponELEMENTAL).toBe(HighDamageRareItem.weaponELEMENTAL);
    expect(parsedItem.weaponAS).toBe(HighDamageRareItem.weaponAS);
    expect(parsedItem.weaponCRIT).toBe(HighDamageRareItem.weaponCRIT);
    expect(parsedItem.weaponReload).toBe(HighDamageRareItem.weaponReload);
    expect(parsedItem.quality).toBe(HighDamageRareItem.quality);
    expect(parsedItem.requires).toEqual(HighDamageRareItem.requires);
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
    expect(findAndParseRequirementsSection(sections, parsedItem)).toBe(
      "SECTION_PARSED",
    );
    expect(parsedItem.armourAR).toBe(NormalItem.armourAR);
    expect(parsedItem.armourEV).toBe(NormalItem.armourEV);
    expect(parsedItem.armourES).toBe(NormalItem.armourES);
    expect(parsedItem.quality).toBe(NormalItem.quality);
    expect(parsedItem.armourBLOCK).toBe(NormalItem.armourBLOCK);
    expect(parsedItem.requires).toEqual(NormalItem.requires);
  });
  test("Unique Armour", () => {
    const sections = __testExports.itemTextToSections(UniqueItem.rawText);
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseArmour(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(findAndParseRequirementsSection(sections, parsedItem)).toBe(
      "SECTION_PARSED",
    );
    expect(parsedItem.armourAR).toBe(UniqueItem.armourAR);
    expect(parsedItem.armourEV).toBe(UniqueItem.armourEV);
    expect(parsedItem.armourES).toBe(UniqueItem.armourES);
    expect(parsedItem.quality).toBe(UniqueItem.quality);
    expect(parsedItem.armourBLOCK).toBe(UniqueItem.armourBLOCK);
    expect(parsedItem.requires).toEqual(UniqueItem.requires);
  });
  test("High Armour Rare", () => {
    const sections = __testExports.itemTextToSections(
      ArmourHighValueRareItem.rawText,
    );
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseArmour(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(findAndParseRequirementsSection(sections, parsedItem)).toBe(
      "SECTION_PARSED",
    );
    expect(parsedItem.armourAR).toBe(ArmourHighValueRareItem.armourAR);
    expect(parsedItem.armourEV).toBe(ArmourHighValueRareItem.armourEV);
    expect(parsedItem.armourES).toBe(ArmourHighValueRareItem.armourES);
    expect(parsedItem.quality).toBe(ArmourHighValueRareItem.quality);
    expect(parsedItem.armourBLOCK).toBe(ArmourHighValueRareItem.armourBLOCK);
    expect(parsedItem.requires).toEqual(ArmourHighValueRareItem.requires);
  });
});
