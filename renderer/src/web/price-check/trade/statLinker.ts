import { ParsedItem } from "@/parser";
import { DisplayItem, PricingResult, TradeMod } from "./pathofexile-trade";

export function linkTradeModsToItem(
  tradeMods: TradeMod[],
  itemStats: ParsedItem["statsByType"],
  displayItem: DisplayItem,
): PricingResult["detailedDisplayItem"] {
  return {};
}
