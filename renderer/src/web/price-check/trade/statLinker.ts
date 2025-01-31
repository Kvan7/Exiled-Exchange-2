import { ParsedItem } from "@/parser";
import { PricingResult, TradeMod } from "./pathofexile-trade";

export function linkTradeModsToItem(
  tradeMods: TradeMod[],
  itemStats: ParsedItem["statsByType"],
): PricingResult["detailedDisplayItem"] {
  return {};
}
