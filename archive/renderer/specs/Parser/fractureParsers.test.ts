import { __testExports, ParserState } from "@/parser/Parser";
import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";
import { ModifierType } from "@/parser/modifiers";

describe("Parse Fractured Items", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

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
