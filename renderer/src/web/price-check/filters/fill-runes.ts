import { ParsedItem } from "@/parser";
import { StatFilter } from "./interfaces";

export function handleFillButtonPress(
  filters: StatFilter[],
  item: ParsedItem,
  shouldFill: boolean,
  filterStorage: Record<string, StatFilter>,
) {
  if (shouldFill) {
    // Testing with just one stat
    const dpsFilter = filters.find((stat) =>
      stat.tradeId.includes("item.physical_dps"),
    );
    console.log(dpsFilter);
    if (dpsFilter && dpsFilter.roll) {
      // save copy to storage
      filterStorage.dpsFilter = JSON.parse(
        JSON.stringify(dpsFilter),
      ) as StatFilter;

      // change it
      dpsFilter.roll.min = 25;
      dpsFilter.roll.value = 50;
      dpsFilter.roll.default.min = 25;
      dpsFilter.roll.default.max = 75;
    }
  } else {
    // reset back to normal
    const originalDpsFilter = filterStorage.dpsFilter;
    const dpsFilter = filters.find((stat) =>
      stat.tradeId.includes("item.physical_dps"),
    );
    console.log(dpsFilter);
    if (dpsFilter) {
      const index = filters.indexOf(dpsFilter);
      if (index !== -1 && originalDpsFilter) {
        filters[index] = originalDpsFilter;
      }
    }
  }
}
