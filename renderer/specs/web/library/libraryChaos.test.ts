import { ParsedModifier } from "@/parser/advanced-mod-desc";
import { ModifierType } from "@/parser/modifiers";
import { __testExports, ColumnOpts } from "@/web/library/widget";
import { describe, expect, it } from "vitest";

describe("modFilter", () => {
  it.each([
    [{ explicit: true, implicit: false, enchant: false, augment: false }, [0]],
    [
      { explicit: true, implicit: false, enchant: true, augment: false },
      [0, 2],
    ],
    [
      { explicit: true, implicit: false, enchant: false, augment: true },
      [0, 3],
    ],
    [
      { explicit: true, implicit: false, enchant: true, augment: true },
      [0, 2, 3],
    ],
    [
      { explicit: true, implicit: true, enchant: false, augment: false },
      [0, 1],
    ],
  ])(
    "Returns correct mods",
    (filter: Record<string, boolean>, expected: number[]) => {
      const mods = [
        { info: { generation: "suffix" }, stats: [] },
        { info: { type: ModifierType.Implicit }, stats: [] },
        { info: { type: ModifierType.Enchant }, stats: [] },
        { info: { type: ModifierType.Augment }, stats: [] },
      ];
      const set = new Set(expected);
      for (let i = 0; i < expected.length; i++) {
        expect(
          __testExports.modFilter(
            mods[i] as unknown as ParsedModifier,
            filter as unknown as ColumnOpts["keep"],
          ),
        ).toBe(set.has(i));
      }
    },
  );
});
