import { err, ok, Result } from "neverthrow";
import { Anchor, Widget } from "@/web/overlay/widgets";
import { ParsedItem } from "@/parser";
import { ModifierType, modsEqual } from "@/parser/modifiers";
import { ParsedModifier } from "@/parser/advanced-mod-desc";

export interface LibraryWidget extends Widget {
  anchor: Anchor;
  logItemKey: string | null;
  profiles: Record<string, ColumnOpts>;
}

export interface ShortMod {
  name?: string;
  tier?: number;
  roll: Array<number | -999>;
  ref: string[];
  type: string;
}
export interface ColumnOpts {
  refName: true;
  itemLevel: true;
  rarity: true;
  sockets: true;
  mods: true;
  addedMods: boolean;
  removedMods: boolean;
  keep: {
    explicit: boolean;
    implicit: boolean;
    enchant: boolean;
    augment: boolean;
  };
  modOpts: {
    name: true;
    tier: boolean;
    roll: boolean;
    ref: boolean;
    type: boolean;
  };
}

export interface CsvColumns {
  [key: string]: ColumnOpts;
}

function modFilter(mod: ParsedModifier, keep: ColumnOpts["keep"]) {
  if (
    keep.explicit &&
    (mod.info.generation === "suffix" ||
      mod.info.generation === "prefix" ||
      mod.info.generation === "mutated" ||
      // Should be redundant with prefix/suffix
      mod.info.type === ModifierType.Desecrated ||
      mod.info.type === ModifierType.Fractured)
  ) {
    return true;
  }
  if (keep.implicit && mod.info.type === ModifierType.Implicit) {
    return true;
  }
  if (keep.enchant && mod.info.type === ModifierType.Enchant) {
    return true;
  }
  if (keep.augment && mod.info.type === ModifierType.Augment) {
    return true;
  }
  return false;
}

export function buildCsvString(
  item: ParsedItem,
  sessionType: "chaos",
  addedMods: ParsedModifier[],
  removedMods: ParsedModifier[],
  opts: { columnOpts: ColumnOpts },
): Result<string, string> {
  const { columnOpts } = opts;
  if (sessionType === "chaos") {
    const filteredMods = item.newMods.filter((mod) =>
      modFilter(mod, columnOpts.keep),
    );
    const out: Array<string | number | undefined> = [];
    if (columnOpts.refName) {
      out.push(item.info.refName);
    }
    if (columnOpts.itemLevel) {
      out.push(item.itemLevel);
    }
    if (columnOpts.rarity) {
      out.push(item.rarity);
    }
    if (columnOpts.sockets) {
      out.push(item.augmentSockets?.current ?? 0);
    }

    if (columnOpts.mods) {
      out.push(
        arrayToCsvString(filteredMods.map((m) => modToShortMod(m, columnOpts))),
      );
    }

    if (columnOpts.addedMods) {
      out.push(
        arrayToCsvString(
          addedMods
            .filter((mod) => modFilter(mod, columnOpts.keep))
            .map((m) => modToShortMod(m, columnOpts)),
        ),
      );
    }

    if (columnOpts.removedMods) {
      out.push(
        arrayToCsvString(
          removedMods
            .filter((mod) => modFilter(mod, columnOpts.keep))
            .map((m) => modToShortMod(m, columnOpts)),
        ),
      );
    }

    return ok(out.join(","));
  }

  return err("sessionType not supported");
}

export function getHeader(sessionType: "chaos") {
  switch (sessionType) {
    case "chaos":
      return ok("base,ilvl,rarity,sockets,mods,addedMods,removedMods");

    default:
      return err("sessionType not supported");
  }
}

export function diffItem(curr: ParsedItem, prev: ParsedItem | null) {
  if (!prev) {
    return {
      added: curr.newMods.filter(
        (mod) =>
          mod.info.generation === "suffix" || mod.info.generation === "prefix",
      ),
      removed: [],
    };
  }

  const filteredModsA = curr.newMods.filter(
    (mod) =>
      mod.info.generation === "suffix" || mod.info.generation === "prefix",
  );
  const filteredModsB = prev.newMods.filter(
    (mod) =>
      mod.info.generation === "suffix" || mod.info.generation === "prefix",
  );

  const added = filteredModsA.filter(
    (mod) => !filteredModsB.some((modB) => modsEqual(mod, modB)),
  );
  const removed = filteredModsB.filter(
    (mod) => !filteredModsA.some((modA) => modsEqual(mod, modA)),
  );

  return { added, removed };
}

function modToShortMod(mod: ParsedModifier, opts: ColumnOpts): ShortMod {
  let type: ShortMod["type"];
  if (
    mod.info.generation &&
    mod.info.generation !== "suffix" &&
    mod.info.generation !== "prefix"
  ) {
    type = mod.info.generation;
  } else {
    type = mod.info.type;
  }

  return {
    name: mod.info.name,
    tier: mod.info.tier,
    roll: mod.stats.map((s) => s.roll?.value ?? -999),
    ref: mod.stats.map((s) => s.stat.ref),
    type,
  };
}

function arrayToCsvString(arr: ShortMod[]) {
  const json = JSON.stringify(arr);
  return `"${json.replaceAll("'", "\\'").replaceAll('"', "'")}"`;
}
