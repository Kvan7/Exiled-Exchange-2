import { err, ok, Result } from "neverthrow";
import { Anchor, Widget } from "@/web/overlay/widgets";
import { ParsedItem } from "@/parser";
import { modsEqual } from "@/parser/modifiers";
import { ParsedModifier } from "@/parser/advanced-mod-desc";

export interface LibraryWidget extends Widget {
  anchor: Anchor;
  logItemKey: string | null;
  outputPath: string | null;
}

export function buildCsvString(
  item: ParsedItem,
  sessionType: "chaos",
  diffMods: ParsedModifier[],
): Result<string, string> {
  if (sessionType === "chaos") {
    const filteredMods = item.newMods.filter(
      (mod) =>
        mod.info.generation === "suffix" || mod.info.generation === "prefix",
    );
    let name: string;
    let tier: string | number;
    let diffNames: string;
    let diffTiers: string | number;

    if (filteredMods.length === 0) {
      name = "";
      tier = "";
    } else if (filteredMods.length === 1) {
      const mod = filteredMods[0];
      name = mod.info.name ?? "";
      tier = mod.info.tier ?? -1;
    } else {
      name = `"${JSON.stringify(filteredMods.map((mod) => mod.info.name)).replaceAll('"', "\\'")}"`;
      tier = `"${JSON.stringify(filteredMods.map((mod) => mod.info.tier))}"`;
    }

    if (diffMods.length === 0) {
      diffNames = "";
      diffTiers = "";
    } else if (diffMods.length === 1) {
      const mod = diffMods[0];
      diffNames = mod.info.name ?? "";
      diffTiers = mod.info.tier ?? -1;
    } else {
      diffNames = `"${JSON.stringify(diffMods.map((mod) => mod.info.name)).replaceAll('"', "\\'")}"`;
      diffTiers = `"${JSON.stringify(diffMods.map((mod) => mod.info.tier))}"`;
    }

    return ok(
      [
        item.info.refName,
        item.itemLevel,
        name,
        tier,
        diffNames,
        diffTiers,
      ].join(","),
    );
  }

  return err("sessionType not supported");
}

export const headers = {
  chaos: "base,ilvl,mods,tiers,diffMods,diffTiers",
};

export function diffItem(curr: ParsedItem, prev: ParsedItem | null) {
  if (!prev) return curr.newMods;

  const diff = curr.newMods.filter(
    (mod) => !prev.newMods.some((modB) => modsEqual(mod, modB)),
  );

  return diff;
}
