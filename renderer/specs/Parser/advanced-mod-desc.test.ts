import { beforeEach, describe, expect, it } from "vitest";
import { createTestModInfo } from "./mods";
import { parseModInfoLine, parseModType } from "@/parser/advanced-mod-desc";
import { setupTests } from "@specs/vitest.setup";
import { loadForLang } from "@/assets/data";
import { ModifierType } from "@/parser/modifiers";

describe("parseModType", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });

  it.each(createTestModInfo())("Parses mod type", (mod) => {
    const { modType } = parseModType(mod.rawText.split("\n"));

    const allowed: Partial<Record<ModifierType, ModifierType[]>> = {
      [ModifierType.Implicit]: [ModifierType.Explicit, ModifierType.Implicit],
      [ModifierType.Fractured]: [ModifierType.Explicit, ModifierType.Fractured],
      [ModifierType.Desecrated]: [
        ModifierType.Explicit,
        ModifierType.Desecrated,
      ],
      [ModifierType.Crafted]: [ModifierType.Explicit, ModifierType.Crafted],
    };

    const valid = allowed[mod.type];
    if (valid) expect(valid).toContain(modType);
    else expect(modType).toBe(mod.type);
  });
});

describe("parseModInfoLine", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });

  it.each(createTestModInfo())("Parses mod type %s", (mod) => {
    const { modType, lines } = parseModType(mod.rawText.split("\n"));
    const modInfo = parseModInfoLine(lines[0], modType);

    expect(modInfo.type).toBe(mod.type);
  });

  it.each(createTestModInfo())("Parses generation %s", (mod) => {
    const { modType, lines } = parseModType(mod.rawText.split("\n"));
    const modInfo = parseModInfoLine(lines[0], modType);

    expect(modInfo.generation).toBe(mod.generation);
  });

  it.each(createTestModInfo())("Parses name %s", (mod) => {
    const { modType, lines } = parseModType(mod.rawText.split("\n"));
    const modInfo = parseModInfoLine(lines[0], modType);

    expect(modInfo.name).toBe(mod.name);
  });

  it.each(createTestModInfo())("Parses tags %s", (mod) => {
    const { modType, lines } = parseModType(mod.rawText.split("\n"));
    const modInfo = parseModInfoLine(lines[0], modType);

    expect(modInfo.tags).toEqual(mod.tags);
  });

  it.each(createTestModInfo())("Parses tier %s", (mod) => {
    const { modType, lines } = parseModType(mod.rawText.split("\n"));
    const modInfo = parseModInfoLine(lines[0], modType);

    expect(modInfo.tier).toBe(mod.tier);
  });
});
