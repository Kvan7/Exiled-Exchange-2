import { ParsedItem } from "@/parser";
import { ModifierInfo } from "@/parser/advanced-mod-desc";
import { StatCalculated, StatSource } from "@/parser/modifiers";

export function checkPossibleHybrid(
  hybrids: ModifierInfo["hybridWithRef"],
  stats: StatCalculated[],
  item: ParsedItem,
  source: StatSource,
) {
  if (!hybrids) return false;
  for (const stat of stats) {
    if (hybrids.has(stat.stat.ref)) {
      return true;
    }
  }
  return false;
}
