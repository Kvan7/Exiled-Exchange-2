import { ITEM_BY_REF } from "@/assets/data";
import { createGlobalState } from "@vueuse/core";
import { computed, shallowRef, readonly } from "vue";
import { AppConfig } from "../Config";
import { PriceCheckWidget } from "../overlay/widgets";

interface PrimaryCurrency {
  id: string;
  abbrev: string;
  ref: string;
  text: string;
  icon: string;
}

function getAvailableCurrencies(): PrimaryCurrency[] {
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

export const usePrimaryCurrency = createGlobalState(() => {
  const availableCurrencies = shallowRef<PrimaryCurrency[]>([]);
  const selectedId = computed<"exalted" | "chaos">({
    get() {
      return availableCurrencies.value.length
        ? AppConfig<PriceCheckWidget>("price-check")!.primaryCurrency
        : "exalted";
    },
    set(id) {
      AppConfig<PriceCheckWidget>("price-check")!.primaryCurrency = id;
    },
  });

  const selected = computed(() => {
    const { primaryCurrency } = AppConfig<PriceCheckWidget>("price-check")!;
    if (!availableCurrencies.value || !primaryCurrency) return undefined;
    const listed = availableCurrencies.value.find(
      (currency) => currency.id === primaryCurrency,
    );
    return listed;
  });

  function load() {
    availableCurrencies.value = getAvailableCurrencies().map((currency) => ({
      ...currency,
      text: ITEM_BY_REF("ITEM", currency.ref)![0].name,
    }));
    const haveCurrency = availableCurrencies.value.some(
      (currency) => currency.id === selectedId.value,
    );
    if (!haveCurrency) {
      selectedId.value = "exalted";
    }
  }

  return {
    selectedId,
    selected,
    list: readonly(availableCurrencies),
    load,
  };
});
