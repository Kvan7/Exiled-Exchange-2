import { ItemRarity, ParsedItem } from "@/parser/ParsedItem";
import { createFilters } from "@/web/price-check/filters/create-item-filters";
import { describe, expect, it } from "vitest";
import { createTestCreateOptions, createTestItem } from "./helper";

describe("unidentified item tests", () => {
  it("should not have unid filter if identified", () => {
    const item: ParsedItem = {
      ...createTestItem(),
      isUnidentified: false,
    };

    const res = createFilters(item, createTestCreateOptions());

    expect(res.unidentified).toBeUndefined();
  });

  it("should have unid filter if unidentified", () => {
    const item: ParsedItem = {
      ...createTestItem(),
      isUnidentified: true,
    };

    const res = createFilters(item, createTestCreateOptions());

    expect(res.unidentified).toBeTruthy();
    expect(res.unidentifiedTier).toBeUndefined();
  });

  it("should have unid tier filter if unidentified is tiered", () => {
    const item: ParsedItem = {
      ...createTestItem(),
      isUnidentified: true,
      unidentifiedTier: 4,
    };

    const res = createFilters(item, createTestCreateOptions());

    expect(res.unidentified).toBeUndefined();
    expect(res.unidentifiedTier).toBeTruthy();
    expect(res.unidentifiedTier!.value).toBe(4);
  });

  it.each([
    [ItemRarity.Magic, true],
    [ItemRarity.Rare, true],
    [ItemRarity.Unique, false],
  ])("#. Should be enabled by default only on uniques", (rarity, disabled) => {
    const item: ParsedItem = {
      ...createTestItem(),
      isUnidentified: true,
      rarity,
    };

    const res = createFilters(item, createTestCreateOptions());

    expect(res.unidentified?.disabled).toBe(disabled);
  });

  it.each([
    [2, true],
    [3, true],
    [4, true],
    [5, false],
  ])("#. Should be enabled by default only on T5", (tier, disabled) => {
    const item: ParsedItem = {
      ...createTestItem(),
      isUnidentified: true,
      unidentifiedTier: tier,
    };

    const res = createFilters(item, createTestCreateOptions());

    expect(res.unidentifiedTier!.value).toBe(tier);
    expect(res.unidentifiedTier!.disabled).toBe(disabled);
  });
});
