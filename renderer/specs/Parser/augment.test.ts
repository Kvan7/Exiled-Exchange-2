import { init, STAT_BY_REF } from "@/assets/data";
import { ParsedModifier } from "@/parser/advanced-mod-desc";
import { ModifierType, StatCalculated } from "@/parser/modifiers";
import { __testExports } from "@/parser/Parser";
import { setupTests } from "@specs/vitest.setup";
import { beforeEach, describe, expect, it } from "vitest";

function makeCalcStat(ref: string, value: number): StatCalculated {
  const stat = STAT_BY_REF(ref)!;

  return {
    stat,
    type: ModifierType.Augment,
    sources: [
      {
        contributes: {
          value,
        },
        modifier: {
          info: {
            type: ModifierType.Augment,
            tags: [],
          },
          stats: [],
        },
        stat: {
          stat,
        },
      },
    ],
  } as unknown as StatCalculated;
}

describe("determineAugments", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  it("should return correct baseTypes", () => {
    const expectedRef = ["Greater Iron Rune", "Greater Iron Rune"];

    const result = __testExports.determineAugments(
      {
        info: {
          type: ModifierType.Augment,
        },
      } as unknown as ParsedModifier,
      makeCalcStat("#% increased Physical Damage", 36),
    );

    expect(result.map((augment) => augment.refName)).toEqual(expectedRef);
  });

  it("Works for one item", () => {
    const expectedRef = ["Lesser Storm Rune"];

    const result = __testExports.determineAugments(
      {
        info: {
          type: ModifierType.Augment,
        },
      } as unknown as ParsedModifier,
      makeCalcStat("#% to Lightning Resistance", 10),
    );

    expect(result.map((augment) => augment.refName)).toEqual(expectedRef);
  });
});

describe("BFS", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  it("should return valid combination", () => {
    const result = __testExports.modifiedBfs(36, [], [14, 16, 18, 20]);

    expect(result).toEqual([18, 18]);
  });

  it.each([
    [40, [14, 16, 18, 20], [20, 20]],
    [20, [14, 16, 18, 20], [20]],
    [19, [14, 16, 18, 20], null],
    [15, [5, 7.5, 10], [7.5, 7.5]],
    [34, [14, 16, 18], [18, 16]],
    [10, [10], [10]],
    [10, [], null],
    [40, [10, 20, 30], [20, 20]],
  ])(
    "%#. should return valid combination for %o and %o",
    (target, options, expected) => {
      const result = __testExports.modifiedBfs(target, [], options);

      expect(result).toEqual(expected);
    },
  );
});
