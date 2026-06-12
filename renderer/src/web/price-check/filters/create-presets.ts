import { createFilters } from "./create-item-filters";
import {
  createExactStatFilters,
  initUiModFilters,
} from "./create-stat-filters";
import { sumStatsByModType } from "@/parser/modifiers";
import { ItemCategory, ItemRarity, ParsedItem } from "@/parser";
import type { FilterPreset } from "./interfaces";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import { hasCraftingValue, likelyFinishedItem } from "./common";

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V"];

export function createPresets(
  item: ParsedItem,
  opts: {
    league: string;
    currency: string | undefined;
    listingType:
      | "securable"
      | "any"
      | "online"
      | "available"
      | "onlineleague"
      | undefined;
    collapseListings: "app" | "api";
    activateStockFilter: boolean;
    searchStatRange: number;
    useEn: boolean;
    defaultAllSelected: boolean;
    autoFillEmptyAugmentSockets: PriceCheckWidget["autoFillEmptyRuneSockets"];
  },
): { presets: FilterPreset[]; active: string } {
  if (item.info.refName === "Expedition Logbook") {
    return {
      active: ROMAN_NUMERALS[0],
      presets: item.logbookAreaMods!.map<FilterPreset>((area, idx) => ({
        id: ROMAN_NUMERALS[idx],
        filters: createFilters(item, { ...opts, exact: true }),
        stats: createExactStatFilters(item, sumStatsByModType(area), opts),
      })),
    };
  }

  if (
    item.isUnidentified ||
    item.rarity === ItemRarity.Normal ||
    (!item.info.craftable && item.rarity !== ItemRarity.Unique) ||
    ((item.category === ItemCategory.Flask ||
      item.category === ItemCategory.Relic ||
      item.category === ItemCategory.Tincture ||
      item.category === ItemCategory.MemoryLine ||
      item.category === ItemCategory.Invitation ||
      item.category === ItemCategory.HeistContract ||
      item.category === ItemCategory.HeistBlueprint ||
      item.category === ItemCategory.Sentinel ||
      item.category === ItemCategory.Tablet) &&
      item.rarity !== ItemRarity.Unique) ||
    (item.category === ItemCategory.Currency && item.trials?.numberOfTrials)
  ) {
    return {
      active: "filters.preset_exact",
      presets: [
        {
          id: "filters.preset_exact",
          filters: createFilters(item, { ...opts, exact: true }),
          stats: createExactStatFilters(item, item.statsByType, opts),
        },
      ],
    };
  }

  // TODO: pseudo change here
  const pseudoPreset: FilterPreset = {
    id: "filters.preset_pseudo",
    filters: createFilters(item, { ...opts, exact: false }),
    stats: initUiModFilters(item, opts),
  };

  // Apply augments if we should
  // if (
  //   (item.rarity === ItemRarity.Magic || item.rarity === ItemRarity.Rare) &&
  //   pseudoPreset.filters.itemEditorSelection &&
  //   !pseudoPreset.filters.itemEditorSelection.disabled &&
  //   opts.autoFillEmptyAugmentSockets
  // ) {
  //   handleApplyItemEdits(
  //     pseudoPreset.stats,
  //     item,
  //     pseudoPreset.filters.tempAugmentStorage ?? [],
  //     opts.autoFillEmptyAugmentSockets ?? "None",
  //   );
  // }

  if (likelyFinishedItem(item) || !hasCraftingValue(item)) {
    return { active: pseudoPreset.id, presets: [pseudoPreset] };
  }

  const baseItemPreset: FilterPreset = {
    id: "filters.preset_base_item",
    filters: createFilters(item, { ...opts, exact: true }),
    stats: createExactStatFilters(item, item.statsByType, opts),
  };

  return {
    active: pseudoPreset.id,
    presets: [pseudoPreset, baseItemPreset],
  };
}
