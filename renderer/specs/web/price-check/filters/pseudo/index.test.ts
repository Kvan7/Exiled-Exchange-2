import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init, Stat, StatBetter } from "@/assets/data";
import { ModifierType, StatCalculated } from "@/parser/modifiers";
import { __testExports, filterPseudo } from "@/web/price-check/filters/pseudo";
import { FiltersCreationContext } from "@/web/price-check/filters/create-stat-filters";
import { ParsedItem } from "@/parser";

describe("filterPseudoSources", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
    vi.clearAllMocks();
  });

  it("should do nothing if no stats", () => {
    const stats: StatCalculated[] = [];
    const mapFn = vi.fn();
    mapFn.mockImplementation(() => true);
    const result = __testExports.filterPseudoSources(stats, mapFn);

    expect(result).toHaveLength(0);
  });

  it("should do nothing if no stats have any sources", () => {
    const stats: StatCalculated[] = [
      { sources: [] },
      { sources: [] },
      { sources: [], type: ModifierType.Explicit },
    ] as unknown as StatCalculated[];
    const mapFn = vi.fn();
    mapFn.mockImplementation(() => true);
    const result = __testExports.filterPseudoSources(stats, mapFn);

    expect(result).toHaveLength(0);
  });

  it("should add all, for each source if all return true", () => {
    const stats: StatCalculated[] = [
      { sources: [{}] },
      { sources: [{}] },
      { sources: [{}, {}] },
    ] as unknown as StatCalculated[];
    const mapFn = vi.fn();
    mapFn.mockImplementation(() => true);

    const result = __testExports.filterPseudoSources(stats, mapFn);
    const expected = Array.from({ length: 4 }, () => true);

    expect(result).toEqual(expected);
    expect(mapFn).toHaveBeenCalledTimes(4);
  });

  it("should filter based on mapFn", () => {
    const stats: StatCalculated[] = [
      { sources: [{ valid: true }], type: ModifierType.Explicit },
      { sources: [{ valid: false }], type: ModifierType.Explicit },
      {
        sources: [{ valid: false }, { valid: true }],
        type: ModifierType.Enchant,
      },
    ] as unknown as StatCalculated[];
    const mapFn = vi.fn();
    mapFn.mockImplementation((calc, source) => {
      if (source.valid) {
        return calc.type;
      }
    });

    const result = __testExports.filterPseudoSources(stats, mapFn);
    const expected = [ModifierType.Explicit, ModifierType.Enchant];

    expect(result).toEqual(expected);
    expect(mapFn).toHaveBeenCalledTimes(4);
  });
});

const FireResRef = "#% to Fire Resistance";
const ColdResRef = "#% to Cold Resistance";
const MovementSpeedRef = "#% increased Movement Speed";
const StrengthRef = "# to Strength";
const MaxLifeRef = "# to maximum Life";
const BreachTabletRef = "Adds an Otherworldy Breach to a Map \n# use remaining";

function createStatHelper(
  ref: string,
  value: number = 25,
  type: ModifierType = ModifierType.Explicit,
): StatCalculated {
  const stat: Stat = {
    ref,
    matchers: [],
    better: StatBetter.PositiveRoll,
    trade: {
      inverted: undefined,
      option: undefined,
      ids: {},
    },
  };

  return {
    stat,
    type,
    sources: [
      {
        contributes: {
          value,
          min: value,
          max: value,
        },
        modifier: {
          info: {
            type,
            tags: [],
          },
          stats: [],
        },
        stat: {
          stat,
          translation: {
            string: "",
          },
          roll: {
            unscalable: false,
            dp: false,
            value,
            min: value,
            max: value,
          },
        },
      },
    ],
  };
}

describe("filterPseudo", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
    vi.clearAllMocks();
  });

  it("should do nothing if no stats by type", () => {
    const ctx: FiltersCreationContext = {
      item: {} as ParsedItem,
      searchInRange: 0,
      filters: [],
      statsByType: [],
    };

    filterPseudo(ctx);

    expect(ctx.statsByType).toHaveLength(0);
  });

  it("should add pseudo for stat", () => {
    const ctx: FiltersCreationContext = {
      item: { info: { refName: "name" } } as ParsedItem,
      searchInRange: 0,
      filters: [],
      statsByType: [createStatHelper(FireResRef)],
    };

    filterPseudo(ctx);

    expect(ctx.statsByType.length).toBe(0);
    expect(ctx.filters.length).toBe(2);
    const totalRes = ctx.filters.find(
      (f) => f.statRef === "#% total Elemental Resistance",
    );
    const fireRes = ctx.filters.find(
      (f) => f.statRef === "#% total to Fire Resistance",
    );

    expect(totalRes).toBeDefined();
    expect(fireRes).toBeDefined();
    expect(totalRes?.disabled).toBe(false);
    expect(fireRes?.disabled).toBe(true);
    expect(totalRes?.roll?.value).toBe(25);
    expect(fireRes?.roll?.value).toBe(25);
  });

  it("should add 2 different pseudos", () => {
    const ctx: FiltersCreationContext = {
      item: { info: { refName: "name" } } as ParsedItem,
      searchInRange: 0,
      filters: [],
      statsByType: [
        createStatHelper(FireResRef),
        createStatHelper(MovementSpeedRef),
      ],
    };

    filterPseudo(ctx);

    expect(ctx.statsByType.length).toBe(0);
    expect(ctx.filters.length).toBe(3);
    const totalRes = ctx.filters.find(
      (f) => f.statRef === "#% total Elemental Resistance",
    );
    const fireRes = ctx.filters.find(
      (f) => f.statRef === "#% total to Fire Resistance",
    );
    const movementSpeed = ctx.filters.find(
      (f) => f.statRef === MovementSpeedRef,
    );

    expect(totalRes).toBeDefined();
    expect(fireRes).toBeDefined();
    expect(movementSpeed).toBeDefined();
  });

  it("should merge two of same stats", () => {
    const ctx: FiltersCreationContext = {
      item: { info: { refName: "name" } } as ParsedItem,
      searchInRange: 0,
      filters: [],
      statsByType: [createStatHelper(FireResRef), createStatHelper(FireResRef)],
    };

    filterPseudo(ctx);

    expect(ctx.statsByType.length).toBe(0);
    expect(ctx.filters.length).toBe(2);
    const totalRes = ctx.filters.find(
      (f) => f.statRef === "#% total Elemental Resistance",
    );
    const fireRes = ctx.filters.find(
      (f) => f.statRef === "#% total to Fire Resistance",
    );

    expect(totalRes).toBeDefined();
    expect(fireRes).toBeDefined();
    expect(totalRes?.sources).toHaveLength(2);
    expect(totalRes?.roll?.value).toBe(50);
    expect(fireRes?.sources).toHaveLength(2);
    expect(fireRes?.roll?.value).toBe(50);
  });

  it("should join related stats", () => {
    const ctx: FiltersCreationContext = {
      item: { info: { refName: "name" } } as ParsedItem,
      searchInRange: 0,
      filters: [],
      statsByType: [
        createStatHelper(MaxLifeRef),
        createStatHelper(StrengthRef),
      ],
    };

    filterPseudo(ctx);

    expect(ctx.statsByType.length).toBe(0);
    expect(ctx.filters.length).toBe(2);
    const maxLife = ctx.filters.find(
      (f) => f.statRef === "+# total maximum Life",
    );
    const str = ctx.filters.find((f) => f.statRef === "+# total to Strength");

    expect(maxLife).toBeDefined();
    expect(str).toBeDefined();
    expect(maxLife?.sources).toHaveLength(2);
    expect(maxLife?.roll?.value).toBe(75);
    expect(str?.sources).toHaveLength(1);
    expect(str?.roll?.value).toBe(25);
  });

  it("should only keep highest ele res", () => {
    const ctx: FiltersCreationContext = {
      item: { info: { refName: "name" } } as ParsedItem,
      searchInRange: 0,
      filters: [],
      statsByType: [
        createStatHelper(FireResRef),
        createStatHelper(ColdResRef, 50),
      ],
    };

    filterPseudo(ctx);

    expect(ctx.statsByType.length).toBe(0);
    expect(ctx.filters.length).toBe(2);
    const totalRes = ctx.filters.find(
      (f) => f.statRef === "#% total Elemental Resistance",
    );
    const coldRes = ctx.filters.find(
      (f) => f.statRef === "#% total to Cold Resistance",
    );

    expect(totalRes).toBeDefined();
    expect(coldRes).toBeDefined();
    expect(totalRes?.disabled).toBe(false);
    expect(coldRes?.disabled).toBe(true);
    expect(totalRes?.roll?.value).toBe(75);
    expect(coldRes?.roll?.value).toBe(50);
  });

  it("should add tablet implicits", () => {
    const ctx: FiltersCreationContext = {
      item: { info: { refName: "name" } } as ParsedItem,
      searchInRange: 0,
      filters: [],
      statsByType: [
        createStatHelper(BreachTabletRef, 8, ModifierType.Implicit),
      ],
    };

    filterPseudo(ctx);

    expect(ctx.statsByType.length).toBe(0);
    expect(ctx.filters.length).toBe(1);
    const uses = ctx.filters.find(
      (f) => f.statRef === "# uses remaining (Tablets)",
    );

    expect(uses).toBeDefined();
    expect(uses?.disabled).toBe(false);
    expect(uses?.roll?.value).toBe(8);
  });
});
