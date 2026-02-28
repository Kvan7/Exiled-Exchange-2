import { createVirtualItem, ParsedItem } from "@/parser/ParsedItem";
import { PriceCheckWidget } from "@/web/overlay/widgets";
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
  collapseListings: "app" | "api";
  activateStockFilter: boolean;
  searchStatRange: number;
  exact: boolean;
  useEn: boolean;
  defaultAllSelected: boolean;
  autoFillEmptyAugmentSockets: PriceCheckWidget["autoFillEmptyRuneSockets"];
} {
  return {
    league: "Standard",
    currency: undefined,
    collapseListings: "app",
    activateStockFilter: false,
    searchStatRange: 10,
    exact: false,
    useEn: true,
    defaultAllSelected: false,
    autoFillEmptyAugmentSockets: false,
  };
}

export function createTestItem(): ParsedItem {
  return {
    ...createVirtualItem({} as unknown as ParsedItem),
    isUnidentified: false,
    info: {
      refName: "test",
      namespace: "ITEM",
      name: "",
      icon: "",
      tags: [],
    },
  };
}
