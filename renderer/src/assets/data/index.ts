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

function parseNdjson<T>(text: string): T[] {
  const out: T[] = [];
  for (const line of text.split("\n")) {
    if (line.trim()) out.push(JSON.parse(line) as T);
  }
  return out;
}

function makeIterator<T>(items: T[], serialized: string[]) {
  return function* (
    searchString: string,
    andIncludes: string[] = [],
  ): Generator<T> {
    for (let i = 0; i < items.length; i++) {
      if (
        serialized[i].includes(searchString) &&
        andIncludes.every((s) => serialized[i].includes(s))
      ) {
        yield items[i];
      }
    }
  };
}

function makeNameGenerator(items: BaseType[]): () => Generator<string> {
  return function* () {
    for (const item of items) yield item.name;
  };
}

async function loadItems(language: string) {
  const text = await (
    await fetch(`${import.meta.env.BASE_URL}data/${language}/items.ndjson`)
  ).text();
  const items = parseNdjson<BaseType>(text);
  const serialized = items.map((item) => JSON.stringify(item));

  const byName = new Map<string, BaseType[]>();
  const byRefName = new Map<string, BaseType[]>();
  for (const item of items) {
    const nk = `${item.namespace}::${item.name}`;
    const rk = `${item.namespace}::${item.refName}`;
    byName.set(nk, [...(byName.get(nk) ?? []), item]);
    byRefName.set(rk, [...(byRefName.get(rk) ?? []), item]);
  }

  ITEM_BY_TRANSLATED = (ns, name) => byName.get(`${ns}::${name}`);
  ITEM_BY_REF = (ns, name) => byRefName.get(`${ns}::${name}`);
  ITEMS_ITERATOR = makeIterator<BaseType>(items, serialized);

  GEM_NS_NAMES = makeNameGenerator(items.filter((i) => i.namespace === "GEM"));
  UNIQUE_NS_NAMES = makeNameGenerator(
    items.filter((i) => i.namespace === "UNIQUE"),
  );
  ITEM_NS_NAMES = makeNameGenerator(
    items.filter((i) => i.namespace === "ITEM"),
  );

  TRADE_TAG_TO_REF = new Map<string, string>();
  for (const item of items) {
    if (item.tradeTag) TRADE_TAG_TO_REF.set(item.tradeTag, item.refName);
  }
}

async function loadStats(language: string) {
  const text = await (
    await fetch(`${import.meta.env.BASE_URL}data/${language}/stats.ndjson`)
  ).text();
  const stats = parseNdjson<Stat>(text);
  const serialized = stats.map((s) => JSON.stringify(s));

  const byRef = new Map<string, Stat>();
  const byMatcher = new Map<string, { stat: Stat; matcher: StatMatcher }>();
  for (const stat of stats) {
    byRef.set(stat.ref, stat);
    for (const matcher of stat.matchers) {
      byMatcher.set(matcher.string, { stat, matcher });
      if (matcher.advanced) byMatcher.set(matcher.advanced, { stat, matcher });
    }
  }

  STAT_BY_REF = (ref) => byRef.get(ref);
  STAT_BY_MATCH_STR = (matchStr) => byMatcher.get(matchStr);
  STATS_ITERATOR = makeIterator<Stat>(stats, serialized);
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
