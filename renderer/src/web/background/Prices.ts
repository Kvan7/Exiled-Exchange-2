import { shallowRef, watch, readonly, computed } from "vue";
import { createGlobalState } from "@vueuse/core";
import { Host } from "@/web/background/IPC";
import { useLeagues } from "./Leagues";
import { AppConfig } from "../Config";
import { PriceCheckWidget } from "../overlay/widgets";
import { ITEM_BY_REF } from "@/assets/data";

interface NinjaDenseInfo {
  exalted: number;
  graph?: Array<number | null>;
  name: string;
}

type PriceDatabase = Array<{ ns: string; url: string; lines: string }>;
const RETRY_INTERVAL_MS = 4 * 60 * 1000;
const UPDATE_INTERVAL_MS = 31 * 60 * 1000;
const INTEREST_SPAN_MS = 20 * 60 * 1000;

interface DbQuery {
  ns: string;
  name: string;
}

export interface CurrencyValue {
  min: number;
  max: number;
  currency: "chaos" | "exalted" | "div";
}

export interface CoreCurrency {
  id: "exalted" | "chaos";
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
  /**
   * exalted/div
   */
  const exaltXchgRate = shallowRef<number | undefined>(undefined);

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
    if (
      !league ||
      !league.isPopular ||
      league.realm !== "pc-ggg" ||
      // FIXME: only have non hc abyssal cached rn
      league.id !== "Rise of the Abyssal"
    )
      return;
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
        `api.exiledexchange2.dev/overviewData.json`,
        {
          signal: downloadController.signal,
        },
      );
      const jsonBlob = await response.text();
      if (!jsonBlob.startsWith('{"ok":true,"data":[{')) {
        PRICES_DB = [{ ns: "NAN", url: "NAN", lines: "NAN" }];
        console.log("Failed to load prices");
        // Set to now for now, determine better retry interval later
        lastUpdateTime = Date.now() - 3 * RETRY_INTERVAL_MS;
        return;
      }
      PRICES_DB = splitJsonBlob(jsonBlob);

      // TODO: update to search for requested currency instead of divine
      const divine = findPriceByQuery({
        ns: "ITEM",
        name: "Divine Orb",
      });
      const preferred = selectedCoreCurrency.value;

      if (divine && divine.exalted >= 30) {
        exaltXchgRate.value = divine.exalted;
        if (!preferred || preferred.id === "exalted") {
          xchgRate.value = divine.exalted;
          xchgRateCurrency.value = "exalted";
        } else {
          const ninjaPreferred = findPriceByQuery({
            ns: "ITEM",
            name: preferred.ref,
          });
          if (
            ninjaPreferred &&
            exaltXchgRate.value / ninjaPreferred.exalted >= 5
          ) {
            xchgRate.value = exaltXchgRate.value / ninjaPreferred.exalted;
            xchgRateCurrency.value = preferred.id;
          }
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function selectedLeagueToUrl(): string {
    const league = leagues.selectedId.value!;
    switch (league) {
      case "Standard":
        return "standard";
      case "Hardcore":
        return "hardcore";
      default:
        return league.startsWith("Hardcore ") ? "challengehc" : "challenge";
    }
  }

  function findPriceByQuery(query: DbQuery) {
    // NOTE: order of keys is important
    const searchString = JSON.stringify({
      name: query.name,
      exalted: 0,
    }).replace(":0}", ":");

    for (const { ns, url, lines } of PRICES_DB) {
      if (ns !== query.ns) continue;

      const startPos = lines.indexOf(searchString);
      if (startPos === -1) continue;
      const endPos = lines.indexOf("}", startPos);

      const info: NinjaDenseInfo = JSON.parse(
        lines.slice(startPos, endPos + 1),
      );

      return {
        ...info,
        // url: `https://poe.ninja/poe2/economy/${selectedLeagueToUrl()}/${url}`,
        // TODO: Currently i'm only supporting in league non hc
        url: `https://poe.ninja/poe2/economy/abyss/${url}`,
      };
    }
    return null;
  }

  /**
   * Converts item value from exalts to stable or current core currency
   * @param value item value in exalts
   * @returns Value in stable or core currency
   */
  function autoCurrency(
    value: number | [number, number],
    useOnlyCore: boolean = false,
  ): CurrencyValue {
    if (Array.isArray(value)) {
      if (value[1] > (exaltXchgRate.value || 9999) && !useOnlyCore) {
        return {
          min: exaltToStable(value[0]),
          max: exaltToStable(value[1]),
          currency: "div",
        };
      }
      if (selectedCoreCurrency.value?.id) {
        // NOTE: This if should catch everything
        return {
          min: exaltToCore(value[0]),
          max: exaltToCore(value[1]),
          currency: selectedCoreCurrency.value.id,
        };
      }
      // this should never run, assuming we have loaded a currency
      return { min: value[0], max: value[1], currency: "exalted" };
    }
    if (value > (exaltXchgRate.value || 9999) * 0.94 && !useOnlyCore) {
      if (value < (exaltXchgRate.value || 9999) * 1.06) {
        return { min: 1, max: 1, currency: "div" };
      } else {
        return {
          min: exaltToStable(value),
          max: exaltToStable(value),
          currency: "div",
        };
      }
    }
    if (selectedCoreCurrency.value?.id) {
      // NOTE: This if should catch everything
      return {
        min: exaltToCore(value),
        max: exaltToCore(value),
        currency: selectedCoreCurrency.value.id,
      };
    }
    // this should never run, assuming we have loaded a currency
    return { min: value, max: value, currency: "exalted" };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function coreToStable(count: number) {
    return count / (xchgRate.value || 9999);
  }
  function exaltToStable(count: number) {
    return count / (exaltXchgRate.value || 9999);
  }
  function exaltToCore(count: number) {
    // ex -> core
    // ex => ex * (div/ex) * (core/div) = core
    return (count / (exaltXchgRate.value || 9999)) * (xchgRate.value || 9999);
  }

  function cachedCurrencyByQuery(query: DbQuery, count: number) {
    const key = { ns: query.ns, name: query.name, count };
    if (priceCache.has(key)) {
      return priceCache.get(key)!;
    }

    const price = // since ex aren't currently in db
      query.name === "Exalted Orb" ? { exalted: 1 } : findPriceByQuery(query);
    if (!price) {
      return;
    }
    const currency = autoCurrency(price.exalted * count);
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function denseInfoToDetailsId(info: NinjaDenseInfo): string {
  return info.name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9:\- ]/g, "")
    .toLowerCase()
    .replace(/ /g, "-");
}

function splitJsonBlob(jsonBlob: string): PriceDatabase {
  const NINJA_OVERVIEW = '{"type":"';
  const NAMESPACE_MAP: Array<{ ns: string; url: string; type: string }> = [
    { ns: "ITEM", url: "currency", type: "Currency" },
    { ns: "ITEM", url: "fragments", type: "Fragments" },
    { ns: "ITEM", url: "abyssal-bones", type: "Abyss" },
    { ns: "ITEM", url: "uncut-gems", type: "UncutGems" },
    { ns: "ITEM", url: "lineage-support-gems", type: "LineageSupportGems" },
    { ns: "ITEM", url: "essences", type: "Essences" },
    { ns: "ITEM", url: "soul-cores", type: "Ultimatum" },
    { ns: "ITEM", url: "talismans", type: "Talismans" },
    { ns: "ITEM", url: "runes", type: "Runes" },
    { ns: "ITEM", url: "omens", type: "Ritual" },
    { ns: "ITEM", url: "expedition", type: "Expedition" },
    { ns: "ITEM", url: "distilled-emotions", type: "Delirium" },
    { ns: "ITEM", url: "breach-catalyst", type: "Breach" },
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
      database.push({ ns: isSupported.ns, url: isSupported.url, lines });
    }

    if (endPos === -1) break;
    startPos = endPos;
  }
  return database;
}

export function displayRounding(
  value: number,
  fraction: boolean = false,
): string {
  if (fraction && Math.abs(value) < 1) {
    if (value === 0) return "0";
    const r = `1\u200A/\u200A${displayRounding(1 / value)}`;
    return r === "1\u200A/\u200A1" ? "1" : r;
  }
  if (Math.abs(value) < 10) {
    return Number(value.toFixed(1)).toString().replace(".", "\u200A.\u200A");
  }
  return Math.round(value).toString();
}
