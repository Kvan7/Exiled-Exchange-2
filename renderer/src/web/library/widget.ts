import { err, ok, Result } from "neverthrow";
import { Anchor, Widget } from "@/web/overlay/widgets";
import { ParsedItem } from "@/parser";
import { modsEqual } from "@/parser/modifiers";
import { ParsedModifier } from "@/parser/advanced-mod-desc";

export interface LibraryWidget extends Widget {
  anchor: Anchor;
  logItemKey: string | null;
}

export function buildCsvString(
  item: ParsedItem,
  sessionType: "chaos",
  diffMods: ParsedModifier[],
  opts: {
    emptyVal: string;
  },
): Result<string, string> {
  if (sessionType === "chaos") {
    const filteredMods = item.newMods.filter(
      (mod) =>
        mod.info.generation === "suffix" || mod.info.generation === "prefix",
    );
    const out = [item.info.refName, item.itemLevel, item.rarity];

    if (filteredMods.length === 0) {
      out.push(opts.emptyVal);
      out.push(opts.emptyVal);
    } else if (filteredMods.length === 1) {
      const mod = filteredMods[0];
      out.push(mod.info.name ?? "");
      out.push(mod.info.tier ?? -1);
    } else {
      out.push(arrayToCsvString(filteredMods.map((mod) => mod.info.name)));
      out.push(
        arrayToCsvString(filteredMods.map((mod) => mod.info.tier?.toString())),
      );
    }

    if (diffMods.length === 0) {
      out.push(opts.emptyVal);
      out.push(opts.emptyVal);
    } else if (diffMods.length === 1) {
      const mod = diffMods[0];
      out.push(mod.info.name ?? "");
      out.push(mod.info.tier ?? -1);
    } else {
      out.push(arrayToCsvString(diffMods.map((mod) => mod.info.name)));
      out.push(
        arrayToCsvString(diffMods.map((mod) => mod.info.tier?.toString())),
      );
    }

    return ok(out.join(","));
  }

  return err("sessionType not supported");
}

export const headers = {
  chaos: "base,ilvl,rarity,mods,tiers,diffMods,diffTiers",
};

export function diffItem(curr: ParsedItem, prev: ParsedItem | null) {
  if (!prev) {
    return curr.newMods.filter(
      (mod) =>
        mod.info.generation === "suffix" || mod.info.generation === "prefix",
    );
  }

  const filteredModsA = curr.newMods.filter(
    (mod) =>
      mod.info.generation === "suffix" || mod.info.generation === "prefix",
  );
  const filteredModsB = prev.newMods.filter(
    (mod) =>
      mod.info.generation === "suffix" || mod.info.generation === "prefix",
  );

  const diff = filteredModsA.filter(
    (mod) => !filteredModsB.some((modB) => modsEqual(mod, modB)),
  );

  return diff;
}

function arrayToCsvString(arr: Array<string | undefined>) {
  const itemsMapped = arr.map((item) => item?.replaceAll("'", "\\'"));
  const json = JSON.stringify(itemsMapped);
  return `"${json.replaceAll('"', "'")}"`;
}
