import { __testExports } from "@/parser/Parser";
import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { RareMap, RareMapFakeAllProps, TestItem } from "./items";
import { loadForLang } from "@/assets/data";
import { ParsedItem } from "@/parser/ParsedItem";

describe("parseMap", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  it.each([
    [RareMap.rawText, RareMap.mapTier],
    [RareMapFakeAllProps.rawText, RareMapFakeAllProps.mapTier],
  ])(
    "%#, Each mod section is recognized",
    (rawText: string, mapTier: number | undefined) => {
      const sections = __testExports.itemTextToSections(rawText);
      const parsedItem = {} as ParsedItem;
      const res = __testExports.parseWaystone(sections[1], parsedItem);
      expect(res).toBe("SECTION_PARSED");
      expect(parsedItem.mapTier).toBe(mapTier);
    },
  );
  it.each([
    [RareMap.rawText, RareMap],
    [RareMapFakeAllProps.rawText, RareMapFakeAllProps],
  ])(
    "%#, Each mod section adds correct count to newMods",
    (rawText: string, testItem: TestItem) => {
      const sections = __testExports.itemTextToSections(rawText);
      const parsedItem = {} as ParsedItem;

      const res = __testExports.parseWaystone(sections[1], parsedItem);
      expect(res).toBe("SECTION_PARSED");
      expect(parsedItem.mapPackSize).toBe(testItem.mapPackSize);
      expect(parsedItem.mapItemRarity).toBe(testItem.mapItemRarity);
      expect(parsedItem.mapRevives).toBe(testItem.mapRevives);
      expect(parsedItem.mapDropChance).toBe(testItem.mapDropChance);
      expect(parsedItem.mapMagicMonsters).toBe(testItem.mapMagicMonsters);
      expect(parsedItem.mapRareMonsters).toBe(testItem.mapRareMonsters);
    },
  );
});
