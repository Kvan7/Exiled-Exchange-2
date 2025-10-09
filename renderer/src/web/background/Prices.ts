import { shallowRef, watch, readonly } from "vue";
import { createGlobalState } from "@vueuse/core";
import { Host } from "@/web/background/IPC";
import { useLeagues } from "./Leagues";

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

export const usePoeninja = createGlobalState(() => {
  const leagues = useLeagues();

  const xchgRate = shallowRef<number | undefined>(undefined);

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
      const divine = findPriceByQuery({
        ns: "ITEM",
        name: "Divine Orb",
      });
      if (divine && divine.exalted >= 30) {
        xchgRate.value = divine.exalted;
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

  function autoCurrency(value: number | [number, number]): CurrencyValue {
    if (Array.isArray(value)) {
      if (value[1] > (xchgRate.value || 9999)) {
        return {
          min: exaltedToStable(value[0]),
          max: exaltedToStable(value[1]),
          currency: "div",
        };
      }
      return { min: value[0], max: value[1], currency: "exalted" };
    }
    if (value > (xchgRate.value || 9999) * 0.94) {
      if (value < (xchgRate.value || 9999) * 1.06) {
        return { min: 1, max: 1, currency: "div" };
      } else {
        return {
          min: exaltedToStable(value),
          max: exaltedToStable(value),
          currency: "div",
        };
      }
    }
    return { min: value, max: value, currency: "exalted" };
  }

  function exaltedToStable(count: number) {
    return count / (xchgRate.value || 9999);
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

  return {
    xchgRate: readonly(xchgRate),
    findPriceByQuery,
    autoCurrency,
    queuePricesFetch,
    cachedCurrencyByQuery,
    initialLoading: () => isLoading.value && !PRICES_DB.length,
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
