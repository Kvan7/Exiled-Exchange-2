import fnv1a from "@sindresorhus/fnv1a";
import type {
  BaseType,
  DropEntry,
  AugmentDataByAugment,
  AugmentDataByTradeId,
  Stat,
  StatMatcher,
  TranslationDict,
} from "./interfaces";
import { loadClientStrings } from "../client-string-loader";
import { useTradeData } from "@/web/background/TradeData";
import { ItemCategory, ItemRarity } from "@/parser";

export * from "./interfaces";

export let ITEM_DROP: DropEntry[];
export let CLIENT_STRINGS: TranslationDict;
export let CLIENT_STRINGS_REF: TranslationDict;
export let APP_PATRONS: Array<{ from: string; months: number; style: number }>;
export let AUGMENT_DATA_BY_AUGMENT: AugmentDataByAugment;
export let AUGMENT_DATA_BY_TRADE_ID: AugmentDataByTradeId;

export let AUGMENT_LIST: BaseType[];
export const HIGH_VALUE_AUGMENTS_HARDCODED = new Set<string>([]);

export let ITEM_BY_TRANSLATED: (
  ns: BaseType["namespace"],
  name: string,
) => BaseType[] | undefined = () => undefined;
export let ITEM_BY_REF: (
  ns: BaseType["namespace"],
  name: string,
) => BaseType[] | undefined = () => undefined;
export let ITEMS_ITERATOR: (
  includes: string,
  andIncludes?: string[],
) => Generator<BaseType> = function* () {};

export let ALTQ_GEM_NAMES: () => Generator<string> = function* () {};
export let REPLICA_UNIQUE_NAMES: () => Generator<string> = function* () {};

export let TRADE_TAG_TO_REF = new Map<string, string>();

export let STAT_BY_MATCH_STR: (
  name: string,
) => { matcher: StatMatcher; stat: Stat } | undefined = () => undefined;
export let STAT_BY_REF: (name: string) => Stat | undefined = () => undefined;
export let STATS_ITERATOR: (
  includes: string,
  andIncludes?: string[],
) => Generator<Stat> = function* () {};

let localAugmentFilter: (
  value: BaseType,
  index: number,
  array: BaseType[],
) => unknown | undefined = () => undefined;

export let TRADE_ITEM_BY_REF: (
  itemQuery: {
    baseType?: string;
    name?: string;
    rarity?: ItemRarity;
    category?: ItemCategory;
  },
  forceCraftable?: boolean,
) => BaseType[] | undefined = () => undefined;

function dataBinarySearch(
  data: Uint32Array,
  value: number,
  rowOffset: number,
  rowSize: number,
) {
  let left = 0;
  let right = data.length / rowSize - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = data[mid * rowSize + rowOffset];
    if (midValue < value) {
      left = mid + 1;
    } else if (midValue > value) {
      right = mid - 1;
    } else {
      return mid;
    }
  }
  return -1;
}

function ndjsonFindLines<T>(ndjson: string) {
  // it's preferable that passed `searchString` has good entropy
  return function* (
    searchString: string,
    andIncludes: string[] = [],
  ): Generator<T> {
    let start = 0;
    while (start !== ndjson.length) {
      const matchPos = ndjson.indexOf(searchString, start);
      if (matchPos === -1) break;
      // works for first line too (-1 + 1 = 0)
      start = ndjson.lastIndexOf("\n", matchPos) + 1;
      const end = ndjson.indexOf("\n", matchPos);
      const jsonLine = ndjson.slice(start, end);
      if (andIncludes.every((str) => jsonLine.includes(str))) {
        yield JSON.parse(jsonLine) as T;
      }
      start = end + 1;
    }
  };
}

function itemNamesFromLines(items: Generator<BaseType>) {
  let cached = "";
  return function* (): Generator<string> {
    if (!cached.length) {
      for (const item of items) {
        cached += item.name + "\n";
      }
    }

    let start = 0;
    while (start !== cached.length) {
      const end = cached.indexOf("\n", start);
      yield cached.slice(start, end);
      start = end + 1;
    }
  };
}

async function loadItems(language: string) {
  const ndjson = await (
    await fetch(`${import.meta.env.BASE_URL}data/${language}/items.ndjson`)
  ).text();
  const INDEX_WIDTH = 2;
  const indexNames = new Uint32Array(
    await (
      await fetch(
        `${import.meta.env.BASE_URL}data/${language}/items-name.index.bin`,
      )
    ).arrayBuffer(),
  );
  const indexRefNames = new Uint32Array(
    await (
      await fetch(
        `${import.meta.env.BASE_URL}data/${language}/items-ref.index.bin`,
      )
    ).arrayBuffer(),
  );

  function commonFind(index: Uint32Array, prop: "name" | "refName") {
    return function (
      ns: BaseType["namespace"],
      name: string,
    ): BaseType[] | undefined {
      let start = dataBinarySearch(
        index,
        Number(fnv1a(`${ns}::${name}`, { size: 32 })),
        0,
        INDEX_WIDTH,
      );
      if (start === -1) return undefined;
      start = index[start * INDEX_WIDTH + 1];
      const out: BaseType[] = [];
      while (start !== ndjson.length) {
        const end = ndjson.indexOf("\n", start);
        const record = JSON.parse(ndjson.slice(start, end)) as BaseType;
        if (record.namespace === ns && record[prop] === name) {
          out.push(record);
          if (!record.disc && !record.unique) break;
        } else {
          break;
        }
        start = end + 1;
      }
      return out;
    };
  }

  ITEM_BY_TRANSLATED = commonFind(indexNames, "name");
  ITEM_BY_REF = commonFind(indexRefNames, "refName");
  ITEMS_ITERATOR = ndjsonFindLines<BaseType>(ndjson);
  ALTQ_GEM_NAMES = itemNamesFromLines(
    ITEMS_ITERATOR('altQuality":["Anomalous'),
  );
  REPLICA_UNIQUE_NAMES = itemNamesFromLines(
    ITEMS_ITERATOR('refName":"Replica'),
  );

  TRADE_TAG_TO_REF = new Map<string, string>();
  for (const item of ITEMS_ITERATOR('"tradeTag":')) {
    TRADE_TAG_TO_REF.set(item.tradeTag!, item.refName);
  }
}

async function loadStats(language: string) {
  const ndjson = await (
    await fetch(`${import.meta.env.BASE_URL}data/${language}/stats.ndjson`)
  ).text();
  const INDEX_WIDTH = 2;
  const indexRef = new Uint32Array(
    await (
      await fetch(
        `${import.meta.env.BASE_URL}data/${language}/stats-ref.index.bin`,
      )
    ).arrayBuffer(),
  );
  const indexMatcher = new Uint32Array(
    await (
      await fetch(
        `${import.meta.env.BASE_URL}data/${language}/stats-matcher.index.bin`,
      )
    ).arrayBuffer(),
  );

  STAT_BY_REF = function (ref: string) {
    let start = dataBinarySearch(
      indexRef,
      Number(fnv1a(ref, { size: 32 })),
      0,
      INDEX_WIDTH,
    );
    if (start === -1) return undefined;
    start = indexRef[start * INDEX_WIDTH + 1];
    const end = ndjson.indexOf("\n", start);
    return JSON.parse(ndjson.slice(start, end));
  };

  STAT_BY_MATCH_STR = function (matchStr: string) {
    let start = dataBinarySearch(
      indexMatcher,
      Number(fnv1a(matchStr, { size: 32 })),
      0,
      INDEX_WIDTH,
    );
    if (start === -1) return undefined;
    start = indexMatcher[start * INDEX_WIDTH + 1];
    const end = ndjson.indexOf("\n", start);
    const stat = JSON.parse(ndjson.slice(start, end)) as Stat;

    const matcher = stat.matchers.find(
      (m) => m.string === matchStr || m.advanced === matchStr,
    );
    if (!matcher) {
      // console.log('fnv1a32 collision')
      return undefined;
    }
    return { stat, matcher };
  };

  STATS_ITERATOR = ndjsonFindLines<Stat>(ndjson);
}

// assertion, to avoid regressions in stats.ndjson
const DELAYED_STAT_VALIDATION = new Set<string>();
export function stat(text: string) {
  DELAYED_STAT_VALIDATION.add(text);
  return text;
}

export async function init(lang: string) {
  CLIENT_STRINGS_REF = await loadClientStrings("en");
  ITEM_DROP = await (
    await fetch(`${import.meta.env.BASE_URL}data/item-drop.json`)
  ).json();
  APP_PATRONS = await (
    await fetch(`${import.meta.env.BASE_URL}data/patrons.json`)
  ).json();

  await loadForLang(lang);

  let failed = false;
  const missing = [];

  for (const text of DELAYED_STAT_VALIDATION) {
    if (STAT_BY_REF(text) == null) {
      // throw new Error(`Cannot find stat: ${text}`);
      missing.push(text);
      failed = true;
    }
  }
  if (failed) {
    // throw new Error(
    //   `Cannot find stat${missing.length > 1 ? "s" : ""}: ${missing.join("\n")}`,
    // );
    console.log(
      "Cannot find stat" + (missing.length > 1 ? "s" : "") + missing.join("\n"),
    );
  }
  DELAYED_STAT_VALIDATION.clear();
}

export function setLocalAugmentFilter(
  filter: (value: BaseType, index: number, array: BaseType[]) => unknown,
) {
  localAugmentFilter = filter;
}

export async function loadForLang(lang: string) {
  CLIENT_STRINGS = await loadClientStrings(lang);
  await loadItems(lang);
  await loadStats(lang);
  loadUltraLateItems(localAugmentFilter);
  await loadTradeData();
}

export function loadUltraLateItems(
  augmentFilter: (value: BaseType, index: number, array: BaseType[]) => unknown,
) {
  const a = Array.from(ITEMS_ITERATOR('"craftable": {"category": "SoulCore"}'));
  const b = a.filter((r) => r.augment && r.augment.some((s) => s.tradeId));
  const c = b.map((r) => ({
    ...r,
    augment: r.augment!.filter((s) => s.tradeId),
  }));
  const d = c.filter(augmentFilter);

  AUGMENT_LIST = d;

  AUGMENT_DATA_BY_AUGMENT = augmentsToLookup(AUGMENT_LIST);

  AUGMENT_DATA_BY_TRADE_ID = augmentsToLookupTradeId(AUGMENT_LIST);
}

function augmentsToLookup(augmentList: BaseType[]): AugmentDataByAugment {
  const augmentDataByAugment: AugmentDataByAugment = {};

  for (const augment of augmentList) {
    if (!augment.augment) continue;
    for (const augmentStat of augment.augment) {
      const { categories, string: text, values, tradeId } = augmentStat;
      if (!tradeId) continue;
      if (!augmentDataByAugment[augment.refName]) {
        augmentDataByAugment[augment.refName] = [];
      }
      augmentDataByAugment[augment.refName].push({
        augment: augment.name,
        refName: augment.refName,
        baseStat: text,
        values,
        id: tradeId[0],
        categories,
        icon: augment.icon,
      });
    }
  }

  return augmentDataByAugment;
}

function augmentsToLookupTradeId(
  augmentList: BaseType[],
): AugmentDataByTradeId {
  const augmentDataByAugment: AugmentDataByTradeId = {};

  for (const augment of augmentList) {
    if (!augment.augment) continue;
    for (const augmentStat of augment.augment) {
      const { categories, string: text, values, tradeId } = augmentStat;
      if (!tradeId) continue;
      if (!augmentDataByAugment[tradeId[0]]) {
        augmentDataByAugment[tradeId[0]] = [];
      }
      augmentDataByAugment[tradeId[0]].push({
        augment: augment.name,
        baseStat: text,
        values,
        id: tradeId[0],
        categories,
        icon: augment.icon,
      });
    }
  }

  return augmentDataByAugment;
}

async function loadTradeData() {
  const trade = useTradeData();
  await trade.load();
  if (trade.error.value) {
    console.error("Failed to load trade data:", trade.error.value);
    return;
  }

  TRADE_ITEM_BY_REF = function (
    itemQuery: {
      baseType?: string;
      name?: string;
      rarity?: ItemRarity;
      category?: ItemCategory;
    },
    forceCraftable?: boolean,
  ): BaseType[] | undefined {
    const items = trade.tradeItemData.value;

    let base: BaseType | undefined;
    const { baseType, name, rarity, category } = itemQuery;

    if (category === ItemCategory.Gem) {
      if (name && items.has(name)) {
        base = {
          name: name,
          refName: name,
          namespace: "GEM",
          icon: "%NOT_FOUND%",
          tags: [],
          gem: {},
        };
      }
    } else if (rarity === ItemRarity.Unique) {
      if (name && items.has(`${name} ${baseType}`)) {
        base = {
          name: name,
          refName: name,
          namespace: "UNIQUE",
          icon: "%NOT_FOUND%",
          tags: [],
          unique: {
            base: baseType!,
          },
        };
      }
    } else if (!baseType) {
      if (name && items.has(name)) {
        // TODO: currency works without tradeTag, just ninja only, see if that is fine
        const craftable = category
          ? { category }
          : forceCraftable
            ? { category: name as ItemCategory }
            : undefined;

        base = {
          name: name,
          refName: name,
          namespace: "ITEM",
          icon: "%NOT_FOUND%",
          tags: [],
          craftable,
        };
      }
    } else {
      if (items.has(baseType)) {
        base = {
          name: baseType,
          refName: baseType,
          namespace: "ITEM",
          icon: "%NOT_FOUND%",
          tags: [],
        };
      }
    }

    return base ? [base] : undefined;
  };
}

// Disable since this is export for tests
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __testExports = {
  augmentsToLookup,
};
