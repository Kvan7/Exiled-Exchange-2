import { shallowRef, watch, readonly, computed } from "vue";
import { createGlobalState } from "@vueuse/core";
import { Host } from "@/web/background/IPC";
import { useLeagues } from "./Leagues";
import { AppConfig } from "../Config";
import { PriceCheckWidget } from "../overlay/widgets";
import { ITEM_BY_REF } from "@/assets/data";

interface NinjaDenseExchangeInfo {
  name: string;
  variant?: string;
  primaryValue: number;
  detailsId: string;
  id: string;
  volumePrimaryValue: number;
  maxVolumeCurrency: string;
  maxVolumeRate: number;
  sparkline: {
    totalChange: number;
    data: Array<number | null>;
  };
}

interface NinjaDenseStashInfo {
  name: string;
  variant?: string;
  primaryValue: number;
  detailsId: string;
  sparkline: {
    totalChange: number;
    data: Array<number | null>;
  };
}

interface NinjaXchgRates {
  rates: Record<string, number>;
  primary: string;
  secondary: string;
}

type PriceDatabase = Array<{
  // My namespace for searching
  ns: string;
  // If db is from the currency exchange (cx)
  cx: boolean;
  // base url on ninja
  url: string;
  // json blob data
  lines: string;
}>;
const RETRY_INTERVAL_MS = 4 * 60 * 1000;
const UPDATE_INTERVAL_MS = 31 * 60 * 1000;
const INTEREST_SPAN_MS = 20 * 60 * 1000;

interface DbQuery {
  ns: string;
  name: string;
  variant?: string;
}

export interface CurrencyValue {
  min: number;
  max: number;
  currency: "chaos" | "exalted" | "div";
}

export interface CoreCurrency {
  id: "exalted" | "chaos" | "div";
  abbrev: string;
  ref: string;
  text: string;
  icon: string;
}

function getAvailableCoreCurrencies(): CoreCurrency[] {
  return [
    {
      id: "exalted",
      abbrev: "ex",
      ref: "Exalted Orb",
      text: "Exalted Orb",
      icon: "/images/exa.png",
    },
    {
      id: "chaos",
      abbrev: "c",
      ref: "Chaos Orb",
      text: "Chaos Orb",
      icon: "/images/chaos.png",
    },
  ];
}
export const DivCurrency: CoreCurrency = {
  id: "div",
  abbrev: "div",
  ref: "Divine Orb",
  text: "Divine Orb",
  icon: "/images/div.png",
};

export const usePoeninja = createGlobalState(() => {
  const leagues = useLeagues();

  const availableCoreCurrencies = shallowRef<CoreCurrency[]>([]);
  const selectedCoreCurrencyId = computed<"exalted" | "chaos">({
    get() {
      return availableCoreCurrencies.value.length
        ? AppConfig<PriceCheckWidget>("price-check")!.coreCurrency
        : "exalted";
    },
    set(id) {
      AppConfig<PriceCheckWidget>("price-check")!.coreCurrency = id;
    },
  });

  const selectedCoreCurrency = computed(() => {
    const { coreCurrency } = AppConfig<PriceCheckWidget>("price-check")!;
    if (!availableCoreCurrencies.value || !coreCurrency) return undefined;
    const listed = availableCoreCurrencies.value.find(
      (currency) => currency.id === coreCurrency,
    );
    return listed;
  });

  /**
   * core/div
   */
  const xchgRate = shallowRef<number | undefined>(undefined);
  /**
   * Current core currency
   */
  const xchgRateCurrency = shallowRef<"chaos" | "exalted" | undefined>(
    undefined,
  );

  const isLoading = shallowRef(false);
  let PRICES_DB: PriceDatabase = [];
  let lastUpdateTime = 0;
  let downloadController: AbortController | undefined;
  let lastInterestTime = 0;

  let priceCache = new Map<
    { ns: string; name: string; count: number },
    CurrencyValue
  >();

  async function load(force: boolean = false) {
    const league = leagues.selected.value;
    if (!league || !league.isPopular || league.realm !== "pc-ggg") return;
    if (
      !force &&
      (Date.now() - lastUpdateTime < UPDATE_INTERVAL_MS ||
        Date.now() - lastInterestTime > INTEREST_SPAN_MS)
    )
      return;
    if (downloadController) downloadController.abort();
    try {
      isLoading.value = true;
      downloadController = new AbortController();

      availableCoreCurrencies.value = getAvailableCoreCurrencies().map(
        (currency) => ({
          ...currency,
          text: ITEM_BY_REF("ITEM", currency.ref)![0].name,
        }),
      );
      const haveCurrency = availableCoreCurrencies.value.some(
        (currency) => currency.id === selectedCoreCurrencyId.value,
      );
      if (!haveCurrency) {
        selectedCoreCurrencyId.value = "exalted";
      }

      const response = await Host.proxy(
        `api.exiledexchange2.dev/proxy/${selectedLeagueToUrl(true)}/overviewData.json`,
        {
          signal: downloadController.signal,
        },
      );
      const jsonBlob = await response.text();

      const ninjaXchg = parseXchg(jsonBlob);

      PRICES_DB = splitJsonBlob(jsonBlob);

      // TODO: update to search for requested currency instead of divine
      const divineRates = ninjaXchg.rates;
      const preferred = selectedCoreCurrency.value;

      if (divineRates && Object.values(divineRates).some((v) => v >= 10)) {
        if (
          preferred &&
          preferred.id !== "div" &&
          divineRates[preferred.id] >= 5
        ) {
          xchgRate.value = divineRates[preferred.id];
          xchgRateCurrency.value = preferred.id;
        } else {
          xchgRate.value = divineRates.exalted;
          xchgRateCurrency.value = "exalted";
        }
      }

      // Clear cache
      priceCache = new Map<
        { ns: string; name: string; count: number },
        CurrencyValue
      >();

      lastUpdateTime = Date.now();
    } finally {
      isLoading.value = false;
    }
  }

  function queuePricesFetch() {
    lastInterestTime = Date.now();
    load();
  }

  function selectedLeagueToUrl(proxy: boolean): string {
    const league = leagues.selectedId.value!;
    switch (league) {
      case "Standard":
        return "standard";
      case "Hardcore":
        return "hardcore";
    }
    if (league.startsWith("HC ")) {
      return proxy ? "leaguehc" : "abysshc";
    }
    return proxy ? "league" : "abyss";
  }

  function findPriceByQuery(query: DbQuery) {
    // NOTE: order of keys is important
    const searchString = JSON.stringify({
      name: query.name,
      variant: query.variant,
      primaryValue: 0,
    }).replace(":0}", ":");
    const endSearchString = "}}";

    for (const { ns, cx, url, lines } of PRICES_DB) {
      if (ns !== query.ns) continue;

      const startPos = lines.indexOf(searchString);
      if (startPos === -1) continue;
      const endPos = lines.indexOf(endSearchString, startPos);

      const info: NinjaDenseExchangeInfo | NinjaDenseStashInfo = JSON.parse(
        lines.slice(startPos, endPos + endSearchString.length),
      );

      return {
        ...info,
        cx,
        url: `https://poe.ninja/poe2/economy/${selectedLeagueToUrl(false)}/${url}/${info.detailsId}`,
      };
    }
    return null;
  }

  /**
   * Converts item value from divines to current core currency
   * @param value item value in divines
   * @returns Value in core currency or div
   */
  function autoCurrency(value: number | [number, number]): CurrencyValue {
    if (Array.isArray(value)) {
      const coreValue = value.map(divineToCore);
      if (coreValue[0] > (xchgRate.value || 9999)) {
        return {
          min: value[0],
          max: value[1],
          currency: "div",
        };
      }
      if (selectedCoreCurrency.value?.id) {
        return {
          min: coreValue[0],
          max: coreValue[1],
          currency: selectedCoreCurrency.value.id,
        };
      }
      // this should never run, assuming we have loaded a currency
      return { min: value[0], max: value[1], currency: "div" };
    }
    const coreValue = divineToCore(value);
    if (coreValue > (xchgRate.value || 9999) * 0.94) {
      if (coreValue < (xchgRate.value || 9999) * 1.06) {
        return { min: 1, max: 1, currency: "div" };
      } else {
        return {
          min: value,
          max: value,
          currency: "div",
        };
      }
    }
    if (selectedCoreCurrency.value?.id) {
      return {
        min: coreValue,
        max: coreValue,
        currency: selectedCoreCurrency.value.id,
      };
    }
    // this should never run, assuming we have loaded a currency
    return { min: value, max: value, currency: "div" };
  }

  function divineToCore(count: number) {
    return count * (xchgRate.value || 9999);
  }

  function cachedCurrencyByQuery(query: DbQuery, count: number) {
    const key = { ns: query.ns, name: query.name, count };
    if (priceCache.has(key)) {
      return priceCache.get(key)!;
    }

    const price = findPriceByQuery(query);
    if (!price) {
      return;
    }
    const currency = autoCurrency(price.primaryValue * count);
    priceCache.set(key, currency);
    return currency;
  }

  setInterval(() => {
    load();
  }, RETRY_INTERVAL_MS);

  watch(leagues.selectedId, () => {
    xchgRate.value = undefined;
    PRICES_DB = [];
    load(true);
  });

  watch(selectedCoreCurrencyId, (curr, prev) => {
    if (curr === prev) return;
    xchgRateCurrency.value = curr ?? "exalted";
    xchgRate.value = undefined;
    PRICES_DB = [];
    load(true);
  });

  return {
    xchgRate: readonly(xchgRate),
    xchgRateCurrency: readonly(selectedCoreCurrency),
    findPriceByQuery,
    autoCurrency,
    queuePricesFetch,
    cachedCurrencyByQuery,
    initialLoading: () => isLoading.value && !PRICES_DB.length,
    availableCoreCurrencies: readonly(availableCoreCurrencies),
  };
});

function parseXchg(jsonBlob: string): NinjaXchgRates {
  const RATES = '{"rates":';
  const END_RATES = '"}';
  const startPos = jsonBlob.indexOf(RATES);
  const endPos = jsonBlob.indexOf(END_RATES, startPos) + END_RATES.length;
  return JSON.parse(jsonBlob.slice(startPos, endPos));
}

function splitJsonBlob(jsonBlob: string): PriceDatabase {
  const NINJA_OVERVIEW = '{"type":"';
  const NAMESPACE_MAP: Array<{
    ns: string;
    cx: boolean;
    url: string;
    type: string;
  }> = [
    { ns: "ITEM", cx: true, url: "currency", type: "Currency" },
    { ns: "ITEM", cx: true, url: "fragments", type: "Fragments" },
    { ns: "ITEM", cx: true, url: "abyssal-bones", type: "Abyss" },
    { ns: "ITEM", cx: true, url: "uncut-gems", type: "UncutGems" },
    {
      ns: "ITEM",
      cx: true,
      url: "lineage-support-gems",
      type: "LineageSupportGems",
    },
    { ns: "ITEM", cx: true, url: "essences", type: "Essences" },
    { ns: "ITEM", cx: true, url: "soul-cores", type: "Ultimatum" },
    { ns: "ITEM", cx: true, url: "talismans", type: "Talismans" },
    { ns: "ITEM", cx: true, url: "runes", type: "Runes" },
    { ns: "ITEM", cx: true, url: "omens", type: "Ritual" },
    { ns: "ITEM", cx: true, url: "expedition", type: "Expedition" },
    { ns: "ITEM", cx: true, url: "distilled-emotions", type: "Delirium" },
    { ns: "ITEM", cx: true, url: "breach-catalyst", type: "Breach" },
  ];

  const database: PriceDatabase = [];
  let startPos = jsonBlob.indexOf(NINJA_OVERVIEW);
  if (startPos === -1) return [];

  while (true) {
    const endPos = jsonBlob.indexOf(NINJA_OVERVIEW, startPos + 1);

    const type = jsonBlob.slice(
      startPos + NINJA_OVERVIEW.length,
      jsonBlob.indexOf('"', startPos + NINJA_OVERVIEW.length),
    );
    const lines = jsonBlob.slice(
      startPos,
      endPos === -1 ? jsonBlob.length : endPos,
    );

    const isSupported = NAMESPACE_MAP.find((entry) => entry.type === type);
    if (isSupported) {
      database.push({
        ns: isSupported.ns,
        cx: isSupported.cx,
        url: isSupported.url,
        lines,
      });
    }

    if (endPos === -1) break;
    startPos = endPos;
  }
  return database;
}

export function displayRounding(
  value: number,
  fraction: boolean = false,
  truncateLargeNumbers: boolean = false,
): string {
  if (fraction && Math.abs(value) < 1) {
    if (value === 0) return "0";
    const r = `1\u200A/\u200A${displayRounding(1 / value)}`;
    return r === "1\u200A/\u200A1" ? "1" : r;
  }
  if (Math.abs(value) < 10) {
    return Number(value.toFixed(1)).toString().replace(".", "\u200A.\u200A");
  }
  if (truncateLargeNumbers && Math.abs(value) > 2250) {
    if (Math.abs(value) < 1_050_000) {
      // keep 1 decimal 12324 -> 12.3k
      return (
        Number((value / 1000).toFixed(1))
          .toString()
          .replace(".", "\u200A.\u200A") + "k"
      );
    }
    if (Math.abs(value) < 1_050_000_000) {
      return (
        Number((value / 1_000_000).toFixed(1))
          .toString()
          .replace(".", "\u200A.\u200A") + "m"
      );
    }
    if (Math.abs(value) < 1_050_000_000_000) {
      return (
        Number((value / 1_000_000_000).toFixed(1))
          .toString()
          .replace(".", "\u200A.\u200A") + "b"
      );
    }
    return (
      Number((value / 1_000_000_000_000).toFixed(1))
        .toString()
        .replace(".", "\u200A.\u200A") + "t"
    );
  }
  return Math.round(value).toString();
}

// Disable since this is export for tests
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __testExports = {
  parseXchg,
  splitJsonBlob,
};
