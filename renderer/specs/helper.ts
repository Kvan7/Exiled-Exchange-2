import { STAT_BY_REF } from "@/assets/data";
import { ItemCategory } from "@/parser";
import { ParsedModifier } from "@/parser/advanced-mod-desc";
import { ModifierType, StatCalculated } from "@/parser/modifiers";
import { createVirtualItem, ParsedItem } from "@/parser/ParsedItem";
import { ParsedStat } from "@/parser/stat-translations";
import { FilterTag, StatFilter } from "@/web/price-check/filters/interfaces";

export function createTestStatFilter(): StatFilter {
  return {
    tradeId: [],
    statRef: "",
    text: "",
    tag: FilterTag.Explicit,
    sources: [],
    disabled: false,
  };
}

export function createTestCreateOptions(): {
  league: string;
  currency: string | undefined;
  listingType: "securable" | undefined;
  collapseListings: "app" | "api";
  activateStockFilter: boolean;
  searchStatRange: number;
  exact: boolean;
  useEn: boolean;
  defaultAllSelected: boolean;
} {
  return {
    league: "Standard",
    currency: undefined,
    listingType: undefined,
    collapseListings: "app",
    activateStockFilter: false,
    searchStatRange: 10,
    exact: false,
    useEn: true,
    defaultAllSelected: false,
  };
}

export function createTestItem(): ParsedItem {
  return {
    ...createVirtualItem({} as unknown as ParsedItem),
    isUnidentified: false,
    info: {
      refName: "test",
      namespace: "ITEM",
      craftable: {
        category: ItemCategory.Unknown,
      },
      name: "",
      icon: "",
      tags: [],
    },
  };
}

export function createParsedStat(
  statRef: string,
  value: number | [number, number],
): ParsedStat {
  const stat = STAT_BY_REF(statRef)!;

  return {
    stat,
    translation: stat.matchers[0],
    roll: {
      unscalable: false,
      dp: stat.dp || false,
      value: Array.isArray(value) ? (value[0] + value[1]) / 2 : value,
      min: Array.isArray(value) ? value[0] : value,
      max: Array.isArray(value) ? value[1] : value,
    },
  };
}

export function createParsedModifier(
  statRef: string,
  value: number | [number, number],
  type: ModifierType = ModifierType.Explicit,
): ParsedModifier {
  return {
    info: {
      type,
      tags: [],
    },
    stats: [createParsedStat(statRef, value)],
  };
}

export function makeCalcStat(
  ref: string,
  value: number,
  type: ModifierType = ModifierType.Explicit,
): StatCalculated {
  const parsedStat = createParsedStat(ref, value);

  return {
    stat: parsedStat.stat,
    type,
    sources: [
      {
        contributes: parsedStat.roll,
        modifier: {
          info: {
            type,
            tags: [],
          },
          stats: [parsedStat],
        },
        stat: parsedStat,
      },
    ],
  };
}
