import { ParsedItem } from "@/parser/ParsedItem";
import { describe, expect, it } from "vitest";
import { createTestItem, makeCalcStat } from "@specs/helper";
import { ItemCategory } from "@/parser";
import { filterItemProp } from "@/web/price-check/filters/pseudo/item-property";
import { FiltersCreationContext } from "@/web/price-check/filters/create-stat-filters";
import { StatFilter } from "@/web/price-check/filters/interfaces";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";

describe("Weapon prop tests", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  it("should do nothing if no weapon stats", () => {
    const item: ParsedItem = {
      ...createTestItem(),
      isUnidentified: false,
      category: ItemCategory.FishingRod,
    };

    const ctx = {
      item,
      searchInRange: 10,
      filters: [],
      statsByType: [],
    };
    filterItemProp(ctx);

    expect(ctx.filters).toHaveLength(0);
  });

  it("should do add props if it has them", () => {
    const item: ParsedItem = {
      ...createTestItem(),
      isUnidentified: false,
      category: ItemCategory.FishingRod,
      weaponAS: 1.0,
      weaponCRIT: 4,
      weaponPHYSICAL: 100,
      weaponRELOAD: 100,
      weaponSPIRIT: 100,
    };

    const ctx: FiltersCreationContext = {
      item,
      searchInRange: 10,
      filters: [],
      statsByType: [],
    };
    filterItemProp(ctx);

    expect(ctx.filters).toHaveLength(5);
    const filters = ctx.filters.reduce<Record<string, StatFilter>>((d, el) => {
      d[el.tradeId[0]] = el;
      return d;
    }, {});

    expect(filters["item.physical_dps"].roll?.value).toBe(120);
    expect(filters["item.aps"].roll?.value).toBe(1);
    expect(filters["item.crit"].roll?.value).toBe(4);
    expect(filters["item.reload_time"].roll?.value).toBe(100);
    expect(filters["item.spirit"].roll?.value).toBe(100);
  });

  it("should keep 2 sig figs of crit", () => {
    const item: ParsedItem = {
      ...createTestItem(),
      isUnidentified: false,
      category: ItemCategory.FishingRod,
      weaponCRIT: 15.95,
      statsByType: [
        makeCalcStat("#% to Critical Hit Chance", 4.95, {
          roll: { min: 4.41, max: 5 },
          tier: 1,
        }),
      ],
    };

    const ctx: FiltersCreationContext = {
      item,
      searchInRange: 10,
      filters: [],
      statsByType: [],
    };
    filterItemProp(ctx);

    expect(ctx.filters).toHaveLength(1);
    expect(ctx.filters[0].roll?.value).toBe(15.95);
  });

  it("should keep dp on attack speed", () => {
    const item: ParsedItem = {
      ...createTestItem(),
      isUnidentified: false,
      category: ItemCategory.FishingRod,
      weaponAS: 1.35,
      statsByType: [
        makeCalcStat("#% increased Attack Speed", 15, {
          roll: { min: 14, max: 16 },
          tier: 2,
        }),
      ],
    };

    const ctx: FiltersCreationContext = {
      item,
      searchInRange: 10,
      filters: [],
      statsByType: [],
    };
    filterItemProp(ctx);

    expect(ctx.filters).toHaveLength(1);
    expect(ctx.filters[0].roll?.value).toBe(1.35);
  });
});
