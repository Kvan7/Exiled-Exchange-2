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

interface TradeStat {
  id: string;
  text: string;
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
  const statDataSet = shallowRef<Set<string>>(new Set([]));
  const statData = shallowRef<Map<string, { [type: string]: string[] }>>(
    new Map(),
  );

  async function loadStatData(): Promise<
    [Map<string, Record<string, string[]>>, Set<string>]
  > {
    if (!downloadController) {
      throw new Error("download controller not initialized");
    }

    const response = await Host.proxy(
      // don't use `getTradeEndpoint` since we want ref items, not translated
      `www.pathofexile.com/api/trade2/data/stats`,
      {
        signal: downloadController.signal,
      },
    );
    const resText = await response.text();
    const tradeStatsProcessingTime = performance.now();

    const rawStatsData = JSON.parse(resText) as {
      result: Array<{ id: string; entries: TradeStat[] }>;
    };

    const outStatData: Map<string, { [type: string]: string[] }> = new Map();
    const statDataSet = new Set<string>();

    for (const { id: modType, entries } of rawStatsData.result) {
      for (const { id: statId, text: matcher } of entries) {
        let modMap = outStatData.get(matcher);

        if (!modMap) {
          modMap = {};
          outStatData.set(matcher, modMap);
        }

        let statIds = modMap[modType];

        if (!statIds) {
          statIds = [];
          modMap[modType] = statIds;
        }

        statDataSet.add(statId);
        statIds.push(statId);
      }
    }
    performance.measure("loadStatData", {
      start: tradeStatsProcessingTime,
      end: performance.now(),
    });

    return [outStatData, statDataSet];
  }

  async function loadItemData() {
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
    const resText = await response.text();
    const tradeItemsProcessingTime = performance.now();

    const rawItemData = JSON.parse(resText) as {
      result: Array<{ entries: TradeItem[] }>;
    };

    const outItemData = new Set<string>();

    for (const category of rawItemData.result) {
      for (const { type, text } of category.entries) {
        if (type) {
          outItemData.add(type);
        }
        if (text) {
          outItemData.add(text);
        }
      }
    }

    performance.measure("loadItemData", {
      start: tradeItemsProcessingTime,
      end: performance.now(),
    });

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
      performance.mark("trade-data-load-start");
      isLoading.value = true;
      error.value = null;
      downloadController = new AbortController();

      // grab the data
      const [outItemData, outStatTuple] = await Promise.all([
        loadItemData(),
        loadStatData(),
      ]);

      itemData.value = outItemData;
      statData.value = outStatTuple[0];
      statDataSet.value = outStatTuple[1];

      lastUpdateTime = Date.now();
    } catch (e) {
      console.warn(e);
      error.value = (e as Error).message;
    } finally {
      isLoading.value = false;
    }
    performance.mark("trade-data-load-end");
  }

  function expressInterest() {
    lastInterestTime = Date.now();
  }

  // TODO: remove possibly, if this is laggy then don't want to load at random times
  setInterval(() => {
    load();
  }, RETRY_INTERVAL_MS);

  return {
    isLoading,
    error,
    expressInterest,
    tradeItemData: readonly(itemData),
    tradeStatData: readonly(statData),
    tradeStatDataSet: readonly(statDataSet),
    load,
  };
});
