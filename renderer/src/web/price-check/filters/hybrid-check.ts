import { ModifierInfo } from "@/parser/advanced-mod-desc";
import { StatCalculated } from "@/parser/modifiers";
import { ParsedStat } from "@/parser/stat-translations";

export function checkPossibleHybrid(
  hybrids: ModifierInfo["hybridWithRef"],
  stats: StatCalculated[],
) {
  if (!hybrids) return false;
  const foundHybrids = new Set<ParsedStat>();
  for (const stat of stats) {
    if (hybrids.has(stat.stat.ref)) {
      foundHybrids.add(stat.sources[0].stat);
    }
  }
  if (foundHybrids.size) {
    return foundHybrids;
  }
  return false;
}
