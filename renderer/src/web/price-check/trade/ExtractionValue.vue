<template>
  <div
    v-if="extractionProfits"
    class="p-2 border-2 rounded mt-2 flex items-center gap-1"
    :class="{
      'border-red-500 border': extractionProfits,
      'border-gray-600 border-dashed': !extractionProfits,
    }"
  >
    <div class="text-2xl">Σ</div>
    <item-quick-price
      :price="augmentPrice"
      :item-img="'/images/augments/rune.png'"
      :currency-text="false"
      :show-arrow="false"
    />
    <i class="fa-solid fa-minus mr-2" />
    <item-quick-price
      :price="extractionOrb"
      :item-img="'/images/extractor.png'"
      :currency-text="false"
      :show-arrow="false"
    />
    <i class="fa-solid fa-equals mr-2" />
    <item-quick-price
      :price="profitValue"
      :currency-text="false"
      :show-img="false"
      :show-arrow="false"
    />
  </div>
</template>
<script lang="ts">
import { ParsedItem } from "@/parser";
import { computed, defineComponent, PropType } from "vue";
import { PricingResult } from "./pathofexile-trade";
import { useI18nNs } from "@/web/i18n";
import { CurrencyValue, usePoeninja } from "@/web/background/Prices";
import ItemQuickPrice from "@/web/ui/ItemQuickPrice.vue";

export default defineComponent({
  components: {
    ItemQuickPrice,
  },
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
    firstResult: {
      type: Object as PropType<PricingResult>,
      required: false,
    },
  },
  setup(props) {
    const { findPriceByQuery, autoCurrency, comparePrice, subtractPrice } =
      usePoeninja();

    const extractionOrb = computed(() => {
      const price = findPriceByQuery({
        ns: "ITEM",
        name: "Orb of Extraction",
      });

      return autoCurrency(price?.primaryValue || 99999);
    });

    const augmentPrice = computed(() => {
      if (!props.item.augmentSockets) return autoCurrency(0);

      const price = props.item.augmentSockets.augments.reduce(
        (sum, augment) => {
          if (!augment) return sum;
          const price = findPriceByQuery({
            ns: "ITEM",
            name: augment.refName,
          });
          if (!price) return sum;
          return sum + price.primaryValue;
        },
        0,
      );

      return autoCurrency(price);
    });

    const profitValue = computed(() =>
      subtractPrice(augmentPrice.value, extractionOrb.value),
    );

    const firstResultValue = computed<CurrencyValue | null>(() => {
      if (!props.firstResult || !props.firstResult.normalizedPrice) return null;

      const num = Number.parseFloat(props.firstResult.normalizedPrice);
      if (Number.isNaN(num)) return null;
      return {
        min: num,
        max: num,
        currency: props.firstResult.normalizedPriceCurrency!.id,
      };
    });

    const { t } = useI18nNs("trade_result");
    return {
      t,
      extractionOrb,
      augmentPrice,
      profitValue,
      extractionProfits: computed(() => {
        if (!firstResultValue.value) return false;
        return comparePrice(firstResultValue.value, "<", profitValue.value);
      }),
    };
  },
});
</script>
