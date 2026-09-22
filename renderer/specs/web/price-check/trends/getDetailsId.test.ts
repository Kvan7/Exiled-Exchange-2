import { TRADE_TAG_TO_REF } from "@/assets/data";
import { ItemCategory, ItemRarity } from "@/parser";
import { ItemInfluence, ParsedItem } from "@/parser/ParsedItem";
import {
  getCurrencyDetailsId,
  getDetailsId,
  isValuableBasetype,
} from "@/web/price-check/trends/getDetailsId";
import { createTestItem } from "@specs/helper";
import { afterEach, describe, expect, it } from "vitest";

function item(props: Partial<ParsedItem> = {}): ParsedItem {
  return Object.assign(createTestItem(), props);
}

describe("getCurrencyDetailsId", () => {
  afterEach(() => {
    TRADE_TAG_TO_REF.delete("test-chaos");
  });

  it("resolves known trade tags", () => {
    TRADE_TAG_TO_REF.set("test-chaos", "Chaos Orb");
    expect(getCurrencyDetailsId("test-chaos")).toEqual({
      ns: "ITEM",
      name: "Chaos Orb",
      variant: undefined,
    });
  });

  it("returns a non-item marker for unknown tags", () => {
    expect(getCurrencyDetailsId("missing")).toEqual({
      ns: "nan ns",
      name: "nan item",
      variant: undefined,
    });
  });
});

describe("isValuableBasetype", () => {
  it.each([
    [ItemRarity.Normal, ItemCategory.Ring, true],
    [ItemRarity.Magic, ItemCategory.Helmet, true],
    [ItemRarity.Rare, ItemCategory.Bow, true],
    [ItemRarity.Rare, ItemCategory.Quiver, true],
    [ItemRarity.Unique, ItemCategory.Ring, false],
    [ItemRarity.Rare, ItemCategory.Currency, false],
    [ItemRarity.Rare, undefined, false],
  ])("classifies %s %s", (rarity, category, expected) => {
    expect(isValuableBasetype(item({ rarity, category }))).toBe(expected);
  });
});

describe("getDetailsId", () => {
  it("creates gem details", () => {
    const target = item({ category: ItemCategory.SkillGem });
    target.info.refName = "Spark";
    target.info.namespace = "GEM";

    expect(getDetailsId(target)).toEqual({
      ns: "GEM",
      name: "Spark",
      variant: undefined,
    });
  });

  it("creates map variants", () => {
    const target = item({
      category: ItemCategory.Map,
      rarity: ItemRarity.Rare,
      mapTier: 16,
      mapBlighted: "Blighted",
    });
    target.info.refName = "Mesa Map";

    expect(getDetailsId(target)).toEqual({
      ns: "ITEM",
      name: "Blighted Mesa Map",
      variant: "T16, Gen-18",
    });

    target.rarity = ItemRarity.Unique;
    expect(getDetailsId(target)?.variant).toBe("T16");
  });

  it("creates variants for unique items", () => {
    const unique = item({
      category: ItemCategory.BodyArmour,
      rarity: ItemRarity.Unique,
    });
    unique.info.refName = "Tabula Rasa";
    unique.info.unique = { base: "Simple Robe" };
    expect(getDetailsId(unique)?.variant).toBe("Simple Robe");

    unique.category = ItemCategory.Flask;
    expect(getDetailsId(unique)?.variant).toBeUndefined();

    unique.category = ItemCategory.SanctumRelic;
    expect(getDetailsId(unique)?.variant).toBe("Relic");
  });

  it("does not identify a unique item without unique metadata", () => {
    expect(
      getDetailsId(
        item({ rarity: ItemRarity.Unique, category: ItemCategory.Ring }),
      ),
    ).toBeUndefined();
  });

  it("creates tablet and influenced basetype variants", () => {
    const tablet = item({
      category: ItemCategory.Tablet,
      rarity: ItemRarity.Magic,
    });
    expect(getDetailsId(tablet)?.variant).toBe("Magic");

    const base = item({
      category: ItemCategory.Bow,
      rarity: ItemRarity.Rare,
      influences: [ItemInfluence.Shaper],
    });
    expect(getDetailsId(base)?.variant).toBe("Shaper");

    base.influences.push(ItemInfluence.Elder);
    expect(getDetailsId(base)).toBeUndefined();
  });

  it("creates filled coffin details from its monster stat", () => {
    const coffin = item({
      category: ItemCategory.Currency,
      itemLevel: 83,
      statsByType: [
        {
          stat: { ref: "Monster Level: #" },
          sources: [{ contributes: { value: 79, min: 79, max: 79 } }],
        },
      ],
    } as Partial<ParsedItem>);
    coffin.info.refName = "Filled Coffin";

    expect(getDetailsId(coffin)).toEqual({
      ns: "ITEM",
      name: "Monster Level: 79",
      variant: "80",
    });
  });

  it("falls back to the base item identity", () => {
    const target = item({ category: ItemCategory.Currency });
    target.info.refName = "Chaos Orb";
    target.info.namespace = "DIVINATION_CARD";

    expect(getDetailsId(target)).toEqual({
      ns: "DIVINATION_CARD",
      name: "Chaos Orb",
      variant: undefined,
    });
  });
});
