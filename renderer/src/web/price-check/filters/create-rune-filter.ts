import { ParsedItem } from "@/parser";
import { RuneFilter } from "./interfaces";
import { isPdpsImportant } from "./pseudo/item-property";

export function createRuneFilters(
  item: ParsedItem,
  runeSockets: ParsedItem["runeSockets"],
  opts: { league: string },
): RuneFilter[] {
  const filters: RuneFilter[] = [];
  if (!runeSockets) return filters;

  if (runeSockets.total !== runeSockets.runes.length) {
    console.warn(
      `Total rune sockets (${runeSockets.total}) does not match actual rune sockets (${runeSockets.runes.length})`,
    );
  }

  if (runeSockets.runes.length) {
    for (const rune of runeSockets.runes) {
      if (isPdpsImportant(item) && rune.isEmpty && !(rune.isFake ?? false)) {
        filters.push({
          index: rune.index,
          rune: rune.rune,
          isEmpty: rune.isEmpty,
          text: rune.text,
          disabled: false,
          isFake: true,
          shouldFill: true,
        });
      } else {
        filters.push({
          index: rune.index,
          rune: rune.rune,
          isEmpty: rune.isEmpty,
          text: rune.text,
          disabled: rune.isEmpty && !(rune.isFake ?? false),
          isFake: rune.isFake ?? false,
        });
      }
    }
  }

  return filters;
}
