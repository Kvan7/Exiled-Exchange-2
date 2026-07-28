/**
 * Integration tests for the parser
 */

import { parseClipboard } from "@/parser";
import { CharmQuality, NormalItem, RareItem, SpectreIncSpirit } from "./items";
import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";

describe("Parse Item Properties", () => {
  // Tests almost everything on items, except for modifiers themselves
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  it("parses bow dps", () => {
    const item = parseClipboard(RareItem.rawText);

    expect(item.isOk()).toBe(true);

    const parsedItem = item._unsafeUnwrap();

    expect(parsedItem.weaponPHYSICAL).toBe(RareItem.weaponPHYSICAL);
    expect(parsedItem.weaponELEMENTAL).toBe(RareItem.weaponELEMENTAL);
    expect(parsedItem.weaponAS).toBe(RareItem.weaponAS);
    expect(parsedItem.weaponCRIT).toBe(RareItem.weaponCRIT);

    expect(parsedItem.requires).not.toBeUndefined();
    expect(parsedItem.requires?.level).toBe(RareItem.requires?.level);
    expect(parsedItem.requires?.str).toBe(RareItem.requires?.str);
    expect(parsedItem.requires?.dex).toBe(RareItem.requires?.dex);
    expect(parsedItem.requires?.int).toBe(RareItem.requires?.int);
  });

  it("parses a spectre's spirit", () => {
    const item = parseClipboard(SpectreIncSpirit.rawText);

    expect(item.isOk()).toBe(true);

    const parsedItem = item._unsafeUnwrap();

    expect(parsedItem.weaponSPIRIT).toBe(SpectreIncSpirit.weaponSPIRIT);

    expect(parsedItem.requires).not.toBeUndefined();
    expect(parsedItem.requires?.level).toBe(SpectreIncSpirit.requires?.level);
    expect(parsedItem.requires?.str).toBe(SpectreIncSpirit.requires?.str);
    expect(parsedItem.requires?.dex).toBe(SpectreIncSpirit.requires?.dex);
    expect(parsedItem.requires?.int).toBe(SpectreIncSpirit.requires?.int);
  });

  it("parses armour props", () => {
    const item = parseClipboard(NormalItem.rawText);
    const parsedItem = item._unsafeUnwrap();

    expect(parsedItem.armourAR).toBe(NormalItem.armourAR);
    expect(parsedItem.armourEV).toBe(NormalItem.armourEV);
    expect(parsedItem.armourES).toBe(NormalItem.armourES);

    expect(parsedItem.requires).not.toBeUndefined();
    expect(parsedItem.requires?.level).toBe(NormalItem.requires?.level);
    expect(parsedItem.requires?.str).toBe(NormalItem.requires?.str);
    expect(parsedItem.requires?.dex).toBe(NormalItem.requires?.dex);
    expect(parsedItem.requires?.int).toBe(NormalItem.requires?.int);
  });
});

describe("Parse Charm Properties", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  it("parses charm quality", () => {
    const item = parseClipboard(CharmQuality.rawText);

    expect(item.isOk()).toBe(true);

    const parsedItem = item._unsafeUnwrap();

    expect(parsedItem.quality).toBe(CharmQuality.quality);
  });
});
