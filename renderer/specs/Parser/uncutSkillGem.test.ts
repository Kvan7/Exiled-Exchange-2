import { beforeEach, describe, expect, test } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { __testExports, parseClipboard } from "@/parser/Parser";
import {
  RareItem,
  UncutSkillGem,
  UncutSpiritGem,
  UncutSupportGem,
} from "./items";
import { loadForLang } from "@/assets/data";
import { createFilters } from "@/web/price-check/filters/create-item-filters";

describe("isUncutSkillGem", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test("FIXED so should now be false for uncut skill gem", () => {
    const sections = __testExports.itemTextToSections(UncutSkillGem.rawText);
    expect(__testExports.isUncutSkillGem(sections[0])).toBeFalsy();
  });
  test("FIXED so should now be false for uncut spirit gem", () => {
    const sections = __testExports.itemTextToSections(UncutSpiritGem.rawText);
    expect(__testExports.isUncutSkillGem(sections[0])).toBeFalsy();
  });
  test("FIXED so should now be false for uncut skill gem", () => {
    const sections = __testExports.itemTextToSections(UncutSupportGem.rawText);
    expect(__testExports.isUncutSkillGem(sections[0])).toBeFalsy();
  });
  test("should return false for any other item", () => {
    const sections = __testExports.itemTextToSections(RareItem.rawText);
    expect(__testExports.isUncutSkillGem(sections[0])).toBe(false);
  });
});

describe("Uncut gems parse correctly", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test("should parse uncut skill gem", () => {
    const result = parseClipboard(UncutSkillGem.rawText).unwrapOr(null);
    expect(result).not.toBeNull();
    expect(result!.category).toBe(UncutSkillGem.category);
    expect(result!.gemLevel).toBeUndefined();
  });
  test("should parse uncut spirit gem", () => {
    const result = parseClipboard(UncutSpiritGem.rawText).unwrapOr(null);
    expect(result).not.toBeNull();
    expect(result!.category).toBe(UncutSpiritGem.category);
    expect(result!.gemLevel).toBeUndefined();
  });
  test("should parse uncut support gem", () => {
    const result = parseClipboard(UncutSupportGem.rawText).unwrapOr(null);
    expect(result).not.toBeNull();
    expect(result!.category).toBe(UncutSupportGem.category);
    expect(result!.gemLevel).toBeUndefined();
  });
});

describe("Create Filter for uncut gems", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test.each([
    { gem: UncutSkillGem },
    { gem: UncutSpiritGem },
    { gem: UncutSupportGem },
  ])("createFilters should call createUncutGemFilters, %#", async ({ gem }) => {
    const opts = {
      league: "Standard",
      currency: "exalt",
      collapseListings: "app" as const,
      activateStockFilter: true,
      exact: true,
      useEn: true,
      autoFillEmptyRuneSockets: false as const,
    };

    const result = createFilters(gem, opts);

    expect(result.searchExact).toBeTruthy();
    expect(result.gemLevel).toBeUndefined();
  });
});
