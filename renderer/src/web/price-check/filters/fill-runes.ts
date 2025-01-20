import { ItemRarity, ParsedItem } from "@/parser";
import { StatFilter } from "./interfaces";
import { calcBaseDamage, calcTotalDamage } from "@/parser/calc-base";
import { RUNE_DATA_BY_RUNE } from "@/assets/data";
import {
  isArmourOrWeapon,
  parseModifiersPoe2,
  replaceHashWithValues,
} from "@/parser/Parser";
import { ModifierType, sumStatsByModType } from "@/parser/modifiers";
import { FiltersCreationContext } from "./create-stat-filters";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import { filterItemProp } from "./pseudo/item-property";

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
      const index = filters.indexOf(dpsFilter);
      const newFilter = createNewStatFilter(item, "Iron Rune");
      if (index !== -1 && newFilter) {
        filters[index] = newFilter;
      }
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

function createNewStatFilter(
  item: ParsedItem,
  newRune: string,
): StatFilter | undefined {
  const newItem = JSON.parse(JSON.stringify(item)) as ParsedItem;
  const runeData = RUNE_DATA_BY_RUNE[newRune].find(
    (rune) => rune.type === isArmourOrWeapon(item.category),
  );
  if (!runeData) return;
  const emptyRuneCount = item.runeSockets!.empty;
  const statString = replaceHashWithValues(
    runeData.baseStat,
    runeData.values.map((v) => v * emptyRuneCount),
  );
  parseModifiersPoe2([statString], newItem);
  newItem.statsByType = sumStatsByModType(newItem.newMods);
  const range = AppConfig<PriceCheckWidget>("price-check")!.searchStatRange;
  const ctx: FiltersCreationContext = {
    item: newItem,
    filters: [],
    searchInRange: item.rarity === ItemRarity.Normal ? 100 : range,
    statsByType: item.statsByType.map((calc) => {
      if (
        calc.type === ModifierType.Fractured &&
        calc.stat.trade.ids[ModifierType.Explicit]
      ) {
        return { ...calc, type: ModifierType.Explicit };
      } else {
        return calc;
      }
    }),
  };

  if (newRune === "Iron Rune") {
    const base = calcBaseDamage(item);
    const total = calcTotalDamage(newItem, base);
    newItem.weaponPHYSICAL = total;
    filterItemProp(ctx);
    const newFilter = ctx.filters.find((stat) =>
      stat.tradeId.includes("item.physical_dps"),
    );
    return newFilter;
  }
}
