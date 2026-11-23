import { resolveFirstStatRef } from "@/assets/data";
import { ItemCategory } from "@/parser";
import { ParsedModifier } from "@/parser/advanced-mod-desc";
import { ModifierType, StatCalculated } from "@/parser/modifiers";
import { createVirtualItem, ParsedItem } from "@/parser/ParsedItem";
import { ParsedStat } from "@/parser/stat-translations";
import { FiltersCreationContext } from "@/web/price-check/filters/create-stat-filters";
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
  value: number,
  opts?: {
    roll?: { min: number; max: number };
  },
): ParsedStat {
  const stat = resolveFirstStatRef(statRef)!;

  return {
    stat,
    translation: stat.matchers[0],
    roll: {
      unscalable: false,
      dp: stat.dp || false,
      value: value,
      min: opts?.roll ? opts.roll.min : value,
      max: opts?.roll ? opts.roll.max : value,
    },
  };
}

export function createParsedModifier(
  statRef: string,
  value: number,
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
  opts: {
    type?: ModifierType;
    tier?: number;
    roll?: { min: number; max: number };
  } = {
    type: ModifierType.Explicit,
  },
): StatCalculated {
  const parsedStat = createParsedStat(ref, value, opts);
  const type = opts.type ?? ModifierType.Explicit;

  return {
    stat: parsedStat.stat,
    type,
    sources: [
      {
        contributes: parsedStat.roll,
        modifier: {
          info: {
            tier: opts.tier,
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

export function createFilterCreationContext(
  item: ParsedItem,
  searchInRange: number = 10,
  filters: StatFilter[] = [],
  statsByType: StatCalculated[] = [],
  simpleStats: Array<{ ref: string; value: number; type: ModifierType }> = [],
): FiltersCreationContext {
  if (statsByType.length && simpleStats.length) {
    throw new Error("dont do that, only use statsByType OR simpleStats");
  }

  return {
    item,
    searchInRange,
    filters,
    statsByType: simpleStats.length
      ? simpleStats.map((e) => makeCalcStat(e.ref, e.value, { type: e.type }))
      : statsByType,
  };
}
