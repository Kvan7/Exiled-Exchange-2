import { shallowRef, watch, readonly, computed } from "vue";
import { createGlobalState } from "@vueuse/core";
import { Host } from "@/web/background/IPC";
import { useLeagues } from "./Leagues";
import { AppConfig } from "../Config";
import { PriceCheckWidget } from "../overlay/widgets";
import { DropEntry, ITEM_BY_REF } from "@/assets/data";

export type NinjaSchema = NinjaSchemaV1;
type NinjaSchemaV1 = {
  schemaVersion: 1;
  map: Array<{
    ns: "ITEM" | "GEM" | "UNIQUE";
    cx: boolean;
    url: string;
    type: string;
  }>;
};

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

interface OverviewBlob {
  core: {
    rates: Record<string, number>;
    primary: string;
    secondary: string;
  };
  itemOverviews: Array<{
    type: string;
    lines: Array<NinjaDenseExchangeInfo | NinjaDenseStashInfo>;
  }>;
}

type PriceIndex = Map<
  string,
  {
    entry: NinjaDenseExchangeInfo | NinjaDenseStashInfo;
    cx: boolean;
    url: string;
  }
>;
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

  // TODO: move out of here
  const ITEM_DROP = shallowRef<DropEntry[]>([]);

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
  let priceIndex: PriceIndex = new Map();
  let lastUpdateTime = 0;
  let downloadController: AbortController | undefined;
  let lastInterestTime = 0;

  let priceCache = new Map<string, CurrencyValue>();

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

      ITEM_DROP.value = JSON.parse(
        await Host.proxy("api.exiledexchange2.dev/proxy/data/item-drop.json", {
          signal: downloadController.signal,
        }).then((r) => r.text()),
      );

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

      const ninjaSchema: NinjaSchema = JSON.parse(
        await Host.proxy(
          "api.exiledexchange2.dev/proxy/data/namespaceMap.json",
          {
            signal: downloadController.signal,
          },
        ).then((r) => r.text()),
      );
      const response = await Host.proxy(
        `api.exiledexchange2.dev/proxy/${selectedLeagueToUrl(true)}/overviewData.json`,
        {
          signal: downloadController.signal,
        },
      );
      const overview: OverviewBlob = JSON.parse(await response.text());

      priceIndex = new Map();
      for (const section of overview.itemOverviews) {
        const mapping = ninjaSchema.map.find((m) => m.type === section.type);
        if (!mapping) continue;
        for (const item of section.lines) {
          const key = `${mapping.ns}:${item.name}:${item.variant ?? ""}`;
          priceIndex.set(key, {
            entry: item,
            cx: mapping.cx,
            url: mapping.url,
          });
        }
      }

      // TODO: update to search for requested currency instead of divine
      const divineRates = overview.core.rates;
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
      priceCache = new Map<string, CurrencyValue>();

      lastUpdateTime = Date.now();
    } catch (e) {
      console.warn(e);
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
      return proxy ? "leaguehc" : "runesofaldurhc";
    }
    return proxy ? "league" : "runesofaldur";
  }

  function findPriceByQuery(query: DbQuery) {
    const key = `${query.ns}:${query.name}:${query.variant ?? ""}`;
    const hit = priceIndex.get(key);
    if (!hit) return null;
    return {
      ...hit.entry,
      cx: hit.cx,
      url: `https://poe.ninja/poe2/economy/${selectedLeagueToUrl(false)}/${hit.url}/${hit.entry.detailsId}`,
    };
  }

  /**
   * Converts item value from divines to current core currency
   * @param value item value in divines
   * @returns Value in core currency or div
   */
  function autoCurrency(
    value: number | [number, number],
    coreOnly: boolean = false,
  ): CurrencyValue {
    if (Array.isArray(value)) {
      const coreValue = value.map(divineToCore);
      if (coreValue[0] > (xchgRate.value || 9999) && !coreOnly) {
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
    if (coreValue > (xchgRate.value || 9999) * 0.94 && !coreOnly) {
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
    // variant should always be undefined for currencies
    const key = `${query.ns}:${query.name}:${query.variant ?? ""}:${count}`;
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
    priceIndex = new Map();
    load(true);
  });

  watch(selectedCoreCurrencyId, (curr, prev) => {
    if (curr === prev) return;
    xchgRateCurrency.value = curr ?? "exalted";
    xchgRate.value = undefined;
    priceIndex = new Map();
    load(true);
  });

  return {
    xchgRate: readonly(xchgRate),
    xchgRateCurrency: readonly(selectedCoreCurrency),
    findPriceByQuery,
    autoCurrency,
    queuePricesFetch,
    cachedCurrencyByQuery,
    initialLoading: () => isLoading.value && !priceIndex.size,
    availableCoreCurrencies: readonly(availableCoreCurrencies),
    ITEM_DROP,
  };
});

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
