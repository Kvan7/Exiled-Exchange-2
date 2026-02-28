import { __testExports, ParserState } from "@/parser/Parser";
import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";

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
