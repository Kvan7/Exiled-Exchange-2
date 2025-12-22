import { __testExports, ParserState } from "@/parser/Parser";
import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import {
  FracturedItem,
  FracturedItemNoModMarked,
  RareItem,
  TestItem,
} from "./items";
import { loadForLang } from "@/assets/data";
import { ParsedItem } from "@/parser/ParsedItem";
import { ModifierType } from "@/parser/modifiers";

describe("Parse Fractured Items", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  it.each([
    [FracturedItem, true],
    [FracturedItemNoModMarked, true],
    [RareItem, undefined],
  ])(
    "%#, Each mod section is recognized",
    (item: TestItem, isFractured: boolean | undefined) => {
      const sections = __testExports.itemTextToSections(item.rawText);
      const parsedItem = {} as ParsedItem;
      __testExports.parseFracturedText(
        sections[sections.length - 1],
        parsedItem,
      );
      expect(parsedItem.isFractured).toBe(isFractured);
    },
  );

  it("adds fractured if some mod is fractured", () => {
    const parsedItem = {
      newMods: [
        {
          info: { type: ModifierType.Fractured, tags: [] },
          stats: [],
        },
        {
          info: { type: ModifierType.Explicit, tags: [] },
          stats: [],
        },
        {
          info: { type: ModifierType.Explicit, tags: [] },
          stats: [],
        },
      ],
    } as unknown as ParserState;
    __testExports.parseFractured(parsedItem);
    expect(parsedItem.isFractured).toBe(true);
  });

  it("does nothing if no mod is fractured", () => {
    const parsedItem = {
      newMods: [
        {
          info: { type: ModifierType.Implicit, tags: [] },
          stats: [],
        },
        {
          info: { type: ModifierType.Explicit, tags: [] },
          stats: [],
        },
      ],
    } as unknown as ParserState;
    __testExports.parseFractured(parsedItem);
    expect(parsedItem.isFractured).toBeUndefined();
  });
});
