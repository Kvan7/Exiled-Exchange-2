import { readonly, shallowRef } from "vue";
import { createGlobalState } from "@vueuse/core";
import { Host } from "./IPC";

const RETRY_INTERVAL_MS = 4 * 60 * 1000;
const UPDATE_INTERVAL_MS = 2 * 60 * 60 * 1000;
const INTEREST_SPAN_MS = 20 * 60 * 1000;

export interface ItemQuery {
  group: string;
  type: string;
  name?: string;
}

interface TradeItem {
  type: string;
  text?: string;
  name?: string;
  flags?: {
    unique: true;
  };
}

export const useTradeData = createGlobalState(() => {
  let lastUpdateTime = 0;
  let downloadController: AbortController | undefined;
  let lastInterestTime = 0;

  const isLoading = shallowRef(false);
  const error = shallowRef<string | null>(null);
  // ref data - nameplates are always REF
  const itemData = shallowRef<Set<string>>(new Set([]));
  // translated data
  const statData = shallowRef<string[]>([]);

  async function loadStatData() {
    console.log("loading stat data");

    return [];
  }

  async function loadItemData() {
    console.log("loading item data");
    if (!downloadController) {
      throw new Error("download controller not initialized");
    }

    const response = await Host.proxy(
      // don't use `getTradeEndpoint` since we want ref items, not translated
      `www.pathofexile.com/api/trade2/data/items`,
      {
        signal: downloadController.signal,
      },
    );

    const rawItemData = (await response.json()) as {
      result: Array<{ id: string; label: string; entries: TradeItem[] }>;
    };

    const outItemData = new Set<string>();

    for (const category of rawItemData.result) {
      for (const entry of category.entries) {
        if (entry.type) {
          outItemData.add(entry.type);
        }
        if (entry.text) {
          outItemData.add(entry.text);
        }
      }
    }

    return outItemData;
  }

  async function load(force: boolean = false) {
    if (
      !force &&
      // don't update more that this frequently
      (Date.now() - lastUpdateTime < UPDATE_INTERVAL_MS ||
        // don't update if user hasn't needed them recently
        Date.now() - lastInterestTime > INTEREST_SPAN_MS)
    )
      return;

    if (downloadController) downloadController.abort();

    try {
      isLoading.value = true;
      error.value = null;
      downloadController = new AbortController();

      // grab the data
      [itemData.value, statData.value] = await Promise.all([
        loadItemData(),
        loadStatData(),
      ]);

      lastUpdateTime = Date.now();
    } catch (e) {
      console.warn(e);
      error.value = (e as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  function expressInterest() {
    lastInterestTime = Date.now();
  }

  setInterval(() => {
    load();
  }, RETRY_INTERVAL_MS);

  return {
    isLoading,
    error,
    expressInterest,
    tradeItemData: readonly(itemData),
    tradeStatData: readonly(statData),
    load,
  };
});
