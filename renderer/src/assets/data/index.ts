import fnv1a from "@sindresorhus/fnv1a";
import type {
  BaseType,
  DropEntry,
  AugmentDataByAugment,
  AugmentDataByTradeId,
  Stat,
  StatMatcher,
  TranslationDict,
  AugmentGroup,
  CatalystGroup,
} from "./interfaces";
import { loadClientStrings } from "../client-string-loader";
import { useTradeData } from "@/web/background/TradeData";
import { GEM, ItemCategory } from "@/parser/meta";
import { ItemRarity } from "@/parser/ParsedItem";
import path from "path";
import fs from "fs";

export * from "./interfaces";

export let ITEM_DROP: DropEntry[];
export let CLIENT_STRINGS: TranslationDict;
export let CLIENT_STRINGS_REF: TranslationDict;
export let APP_PATRONS: Array<{ from: string; months: number; style: number }>;
export let AUGMENT_DATA_BY_AUGMENT: AugmentDataByAugment;
export let AUGMENT_DATA_BY_TRADE_ID: AugmentDataByTradeId;

export const HIGH_VALUE_AUGMENTS_HARDCODED = new Set<string>([]);
export let GROUPED_AUGMENTS: AugmentGroup<BaseType> = {
  Rune: {
    Lesser: [],
    Normal: [],
    Greater: [],
    Perfect: [],
    Other: [],
  },
  Legacy: [],
  SoulCore: {
    Normal: [],
    Special: [],
  },
  Idol: [],
  Other: [],
};
export let CATALYST_TYPES: CatalystGroup<BaseType[]> = {
  Normal: [],
  Refined: [],
};

export let CATALYST_TO_TAG: Record<string, string[]> = {};
export let TAG_TO_CATALYST: Record<string, string> = {};

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

export let GEM_NS_NAMES: () => Generator<string> = function* () {};
export let UNIQUE_NS_NAMES: () => Generator<string> = function* () {};
export let ITEM_NS_NAMES: () => Generator<string> = function* () {};

export let TRADE_TAG_TO_REF = new Map<string, string>();

export let STAT_BY_MATCH_STR: (
  name: string,
) => { matcher: StatMatcher; stat: Stat } | undefined = () => undefined;
export let STAT_BY_REF: (name: string) => Stat | undefined = () => undefined;
export let STATS_ITERATOR: (
  includes: string,
  andIncludes?: string[],
) => Generator<Stat> = function* () {};

export let TRADE_ITEM_BY_REF: (
  itemQuery: {
    baseType?: string;
    name?: string;
    rarity?: ItemRarity;
    category?: ItemCategory;
  },
  forceCraftable?: boolean,
) => BaseType[] | undefined = () => undefined;

export let TRADE_STAT_BY_STAT_ID: (tradeId: string) => boolean = () => false;
export let TRADE_STAT_BY_MATCH_STR: (
  name: string,
) => { [type: string]: string[] } | undefined = () => undefined;

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
  console.log(`char in items: ${ndjson.length}`);

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
  GEM_NS_NAMES = itemNamesFromLines(ITEMS_ITERATOR('": "GEM"'));
  UNIQUE_NS_NAMES = itemNamesFromLines(ITEMS_ITERATOR('": "UNIQUE"'));
  ITEM_NS_NAMES = itemNamesFromLines(ITEMS_ITERATOR('": "ITEM"'));

  TRADE_TAG_TO_REF = new Map<string, string>();
  for (const item of ITEMS_ITERATOR('"tradeTag":')) {
    TRADE_TAG_TO_REF.set(item.tradeTag!, item.refName);
  }

  const bow = ITEMS_ITERATOR("Obliterator Bow").toArray();
  console.log(`w/ Obliterator Bow ${bow.length}`);
  console.log(bow);

  const bow2 = ITEM_BY_REF("ITEM", "Obliterator Bow");
  console.log(bow2);
}

async function loadStats(language: string) {
  const ndjson = await (
    await fetch(`${import.meta.env.BASE_URL}data/${language}/stats.ndjson`)
  ).text();

  console.log(`char in stats: ${ndjson.length}`);
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

  const res = STATS_ITERATOR("#% to Fire Resistance").toArray();
  console.log(`w/ fire res ${res.length}`);
  console.log(res);

  const light = STATS_ITERATOR("Adds # to # Lightning Damage").toArray();
  console.log(`w/ lightning ${light.length}`);
  console.log(light);

  const res2 = STAT_BY_REF("#% to Fire Resistance");
  console.log(res2);

  const light2 = STAT_BY_REF("Adds # to # Lightning Damage");
  console.log(light2);
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
    const url = `${import.meta.env.BASE_URL}data/${lang}/stats.ndjson`;
    console.log(`should have fetched : ${url}`);
    const basePath = path.resolve(__dirname, "../../../public/");
    console.log(`basePath : ${basePath}`);
    const repl = url.replace(import.meta.env.BASE_URL, "");
    console.log(`repl : ${repl}`);
    const filePath = path.join(basePath, repl);
    console.log(`filePath(where the file actually should be) : ${filePath}`);
    // just check if the file exists
    if (fs.existsSync(filePath)) {
      console.log(`file exists`);
    } else {
      console.log(`file does not exist`);
      const ls = fs.readdirSync(basePath);
      console.log(`ls : ${ls}`);
    }
  }
  DELAYED_STAT_VALIDATION.clear();
}

export async function loadForLang(lang: string) {
  CLIENT_STRINGS = await loadClientStrings(lang);
  await loadItems(lang);
  await loadStats(lang);
  loadUltraLateItems();
  await loadTradeData();
}

export function loadUltraLateItems() {
  // Augments
  const a = Array.from(ITEMS_ITERATOR('"craftable": {"category": "SoulCore"}'));
  const b = a.filter((r) => r.augment && r.augment.some((s) => s.tradeId));
  const augmentList = b.map((r) => ({
    ...r,
    augment: r.augment!.filter((s) => s.tradeId),
  }));

  AUGMENT_DATA_BY_AUGMENT = augmentsToLookup(augmentList);

  AUGMENT_DATA_BY_TRADE_ID = augmentsToLookupTradeId(augmentList);

  GROUPED_AUGMENTS = groupAugments(augmentList);

  // Catalysts
  const normalCatalysts = Array.from(ITEMS_ITERATOR('"tags": ["catalyst"'));
  const refinedCatalysts = Array.from(
    ITEMS_ITERATOR('"tags": ["jewel_catalyst"'),
  );

  CATALYST_TYPES = {
    Normal: normalCatalysts,
    Refined: refinedCatalysts,
  };

  CATALYST_TO_TAG = {
    life_catalyst: [CLIENT_STRINGS.LIFE_TAG],
    mana_catalyst: [CLIENT_STRINGS.MANA_TAG],
    defences_catalyst: [
      CLIENT_STRINGS.ARMOUR_TAG,
      CLIENT_STRINGS.EVASION_TAG,
      CLIENT_STRINGS.ENERGY_SHIELD_TAG,
    ],
    physical_catalyst: [CLIENT_STRINGS.PHYSICAL_TAG],
    fire_catalyst: [CLIENT_STRINGS.FIRE_TAG],
    cold_catalyst: [CLIENT_STRINGS.COLD_TAG],
    lightning_catalyst: [CLIENT_STRINGS.LIGHTNING_TAG],
    chaos_catalyst: [CLIENT_STRINGS.CHAOS_TAG],
    attack_catalyst: [CLIENT_STRINGS.ATTACK_TAG],
    caster_catalyst: [CLIENT_STRINGS.CASTER_TAG],
    speed_catalyst: [CLIENT_STRINGS.SPEED_TAG],
    attribute_catalyst: [CLIENT_STRINGS.ATTRIBUTE_TAG],
    minion_catalyst: [CLIENT_STRINGS.MINION_TAG],
  };
  TAG_TO_CATALYST = {
    [CLIENT_STRINGS.LIFE_TAG]: "life_catalyst",
    [CLIENT_STRINGS.MANA_TAG]: "mana_catalyst",
    [CLIENT_STRINGS.ARMOUR_TAG]: "defences_catalyst",
    [CLIENT_STRINGS.EVASION_TAG]: "defences_catalyst",
    [CLIENT_STRINGS.ENERGY_SHIELD_TAG]: "defences_catalyst",
    [CLIENT_STRINGS.PHYSICAL_TAG]: "physical_catalyst",
    [CLIENT_STRINGS.FIRE_TAG]: "fire_catalyst",
    [CLIENT_STRINGS.COLD_TAG]: "cold_catalyst",
    [CLIENT_STRINGS.LIGHTNING_TAG]: "lightning_catalyst",
    [CLIENT_STRINGS.CHAOS_TAG]: "chaos_catalyst",
    [CLIENT_STRINGS.ATTACK_TAG]: "attack_catalyst",
    [CLIENT_STRINGS.CASTER_TAG]: "caster_catalyst",
    [CLIENT_STRINGS.SPEED_TAG]: "speed_catalyst",
    [CLIENT_STRINGS.ATTRIBUTE_TAG]: "attribute_catalyst",
    [CLIENT_STRINGS.MINION_TAG]: "minion_catalyst",
  };
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
        refName: augment.refName,
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

function groupAugments(augmentList: BaseType[]): AugmentGroup<BaseType> {
  const grouped: AugmentGroup<BaseType> = {
    Rune: {
      Lesser: [],
      Normal: [],
      Greater: [],
      Perfect: [],
      Other: [],
    },
    Legacy: [],
    SoulCore: {
      Normal: [],
      Special: [],
    },
    Idol: [],
    Other: [],
  };

  const normalRunes = new Set(
    augmentList
      .map((a) => a.refName)
      .filter((ref) => {
        if (!ref.includes("Rune")) return false;
        if (
          ref.startsWith("Greater") ||
          ref.startsWith("Perfect") ||
          ref.startsWith("Lesser")
        ) {
          return false;
        }
        const split = ref.split(" ");
        return split.length === 2 && split[1] === "Rune";
      }),
  );

  for (const augment of augmentList) {
    const ref = augment.refName;
    if (ref.includes("Rune")) {
      const split = ref.split(" ");
      const notFirst = split.slice(1).join(" ");
      if (normalRunes.has(notFirst) || normalRunes.has(ref)) {
        if (ref.startsWith("Greater")) {
          grouped.Rune.Greater.push(augment);
        } else if (ref.startsWith("Perfect")) {
          grouped.Rune.Perfect.push(augment);
        } else if (ref.startsWith("Lesser")) {
          grouped.Rune.Lesser.push(augment);
        } else {
          grouped.Rune.Normal.push(augment);
        }
      } else {
        grouped.Rune.Other.push(augment);
      }
    } else if (ref.startsWith("Legacy")) {
      grouped.Legacy.push(augment);
    } else if (ref.includes("Soul Core")) {
      if (ref.startsWith("Soul Core")) {
        grouped.SoulCore.Normal.push(augment);
      } else {
        grouped.SoulCore.Special.push(augment);
      }
    } else if (ref.includes("Thesis")) {
      grouped.SoulCore.Special.push(augment);
    } else if (ref.includes("Idol")) {
      grouped.Idol.push(augment);
    } else {
      grouped.Other.push(augment);
    }
  }

  return grouped;
}

async function loadTradeData() {
  const trade = useTradeData();
  await trade.load(true);
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
    trade.expressInterest();

    const items = trade.tradeItemData.value;

    let base: BaseType | undefined;
    const { baseType, name, rarity, category } = itemQuery;

    if (category && GEM.has(category)) {
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
          craftable: { category: ItemCategory.Unknown },
        };
      }
    }

    return base ? [base] : undefined;
  };

  TRADE_STAT_BY_STAT_ID = function (tradeId: string) {
    trade.expressInterest();

    return trade.tradeStatDataSet.value.has(tradeId);
  };

  TRADE_STAT_BY_MATCH_STR = function (name: string) {
    trade.expressInterest();

    const statData = trade.tradeStatData.value;

    const stat = statData.get(name);
    if (!stat) return;

    // never going to write to these, just need to satisfy type
    return stat as {
      [x: string]: string[];
    };
  };
}

// Disable since this is export for tests
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __testExports = {
  augmentsToLookup,
};
