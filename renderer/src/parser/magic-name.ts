import {
  ITEM_BY_REF,
  ITEM_BY_TRANSLATED,
  TRADE_ITEM_BY_REF,
} from "@/assets/data";
import { AppConfig } from "@/web/Config";

export function magicBasetype(name: string) {
  let separator = " ";
  if (AppConfig().language === "cmn-Hant") {
    separator = /[\u4e00-\u9fa5]/.test(name) ? "" : " ";
  }
  const words = name.split(separator);

  const perm: string[] = words.flatMap((_, start) =>
    Array(words.length - start)
      .fill(undefined)
      .map((_, idx) => words.slice(start, start + idx + 1).join(separator)),
  );

  const result = perm
    .map((name) => {
      // BUG[UPSTREAM]: https://www.pathofexile.com/forum/view-thread/3913283
      const result =
        ITEM_BY_REF("ITEM", name) ?? ITEM_BY_TRANSLATED("ITEM", name);
      // TRADE_ITEM_BY_REF({ name }, true);
      if (result) {
        return { name, found: result && result[0].craftable, tradeItem: false };
      }
      const tradeResult = TRADE_ITEM_BY_REF({ name }, true);
      return {
        name,
        found: tradeResult && tradeResult[0].craftable,
        tradeItem: true,
      };
    })
    .filter((res) => res.found)
    .sort(
      (a, b) =>
        b.name.length -
        a.name.length +
        (b.tradeItem ? 0 : 100_000) -
        (a.tradeItem ? 0 : 100_000),
    );

  return result.length ? result[0].name : undefined;
}
