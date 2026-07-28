import { __testExports, ParserState } from "@/parser/Parser";
import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";
import { createTestItem } from "@specs/helper";
import { ParsedItem } from "@/parser";

describe("Parse Unidentified Sections", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  it("can parse normal Unidentified", () => {
    const parsedItem = {} as unknown as ParserState;
    const lines = ["Unidentified"];

    const res = __testExports.parseUnidentified(lines, parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.isUnidentified).toBeTruthy();
    expect(parsedItem.unidentifiedTier).toBeUndefined();
  });

  it("can parse Unidentified with tier", () => {
    const parsedItem = {} as unknown as ParserState;
    const lines = ["Unidentified (Tier 4)"];

    const res = __testExports.parseUnidentified(lines, parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.isUnidentified).toBeTruthy();
    expect(parsedItem.unidentifiedTier).toBe(4);
  });

  it.each([
    [["Item Level: 54"]],
    [
      [
        "{ Implicit Modifier — Elemental, Cold, Resistance }",
        "+23(20-30)% to Cold Resistance",
      ],
    ],
    [["Item Class: Rings", "Rarity: Magic", "Sapphire Ring"]],
  ])("%#. shouldn't be unidentified", (lines: string[]) => {
    const parsedItem = {} as unknown as ParserState;

    const res = __testExports.parseUnidentified(lines, parsedItem);

    expect(res).toBe("SECTION_SKIPPED");
    expect(parsedItem.isUnidentified).toBeFalsy();
    expect(parsedItem.unidentifiedTier).toBeUndefined();
  });
});

describe("parseTrials", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  it.each([
    [["Area Level: 25", "Number of Trials: 1"], 25, 1],
    [["Area Level: 58", "Number of Trials: 2"], 58, 2],
    [["Area Level: 70", "Number of Trials: 3"], 70, 3],
    [["Area Level: 80", "Number of Trials: 4"], 80, 4],
  ])(
    "%#. should parse Djinn Barya",
    (lines: string[], area: number, count: number) => {
      const parsedItem: ParsedItem = {
        ...createTestItem(),
        info: { ...createTestItem().info, refName: "Djinn Barya" },
      };

      const res = __testExports.parseTrials(lines, parsedItem);

      expect(res).toBe("SECTION_PARSED");
      expect(parsedItem.areaLevel).toBe(area);
      expect(parsedItem.trials).toBeDefined();
      expect(parsedItem.trials!.numberOfTrials).toEqual(count);
    },
  );

  it.each([
    [["Area Level: 27", "Number of Trials: 1"], 27, 1],
    [["Area Level: 56", "Number of Trials: 2"], 56, 2],
    [["Area Level: 69", "Number of Trials: 3"], 69, 3],
    [
      ["Area Level: 75", "Number of Trials: 4", "Victorious"],
      75,
      4,
      "Victorious",
    ],
    [["Area Level: 76", "Number of Trials: 4", "Cowardly"], 76, 4, "Cowardly"],
    [["Area Level: 79", "Number of Trials: 4", "Deadly"], 79, 4, "Deadly"],
  ])(
    "%#. should parse Inscribed Ultimatum",
    (lines: string[], area: number, count: number, hint?: string) => {
      const parsedItem: ParsedItem = {
        ...createTestItem(),
        info: { ...createTestItem().info, refName: "Inscribed Ultimatum" },
      };

      const res = __testExports.parseTrials(lines, parsedItem);

      expect(res).toBe("SECTION_PARSED");
      expect(parsedItem.areaLevel).toBe(area);
      expect(parsedItem.trials).toBeDefined();
      expect(parsedItem.trials!.numberOfTrials).toEqual(count);
      expect(parsedItem.trials!.ultimatumHint).toEqual(hint);
    },
  );

  it.each([
    ["Divine Crown", ["Area Level: 27", "Number of Trials: 1"]],
    ["Withered Wand", ["Area Level: 56", "Number of Trials: 2"]],
    ["Uncut Support Gem (Level 5)", ["Area Level: 69", "Number of Trials: 3"]],
    ["Ornate Belt", ["Area Level: 75", "Number of Trials: 4", "Victorious"]],
    ["Rider Bow", ["Area Level: 76", "Number of Trials: 4", "Cowardly"]],
    ["", ["Area Level: 79", "Number of Trials: 4", "Deadly"]],
  ])("%#. should skip non trial items", (refName: string, lines: string[]) => {
    const parsedItem: ParsedItem = {
      ...createTestItem(),
      info: { ...createTestItem().info, refName },
    };

    const res = __testExports.parseTrials(lines, parsedItem);

    expect(res).toBe("PARSER_SKIPPED");
    expect(parsedItem.areaLevel).toBeUndefined();
    expect(parsedItem.trials).toBeUndefined();
  });
});
