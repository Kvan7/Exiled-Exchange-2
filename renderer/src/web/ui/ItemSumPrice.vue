<template>
  <div class="whitespace-nowrap overflow-hidden">
    <span :class="{ [$style.golden]: isValuable, 'px-1': minText === '?' }">{{
      minText
    }}</span>
    <span v-if="isRange" class="text-gray-600 font-sans"> ~ </span>
    <span v-if="isRange" :class="{ [$style.golden]: isValuable }">{{
      maxText
    }}</span>
    <span
      v-if="!currencyText"
      class="font-sans"
      :class="{ [$style.golden]: isValuable }"
    >
      ×</span
    >
    <span v-else :class="{ [$style.golden]: isValuable }"
      >&nbsp;{{ currency }}</span
    >
  </div>
  <div
    class="w-8 h-8 flex items-center justify-center shrink-0"
    v-if="!currencyText"
  >
    <img
      v-if="currency === 'div'"
      src="/images/divine.png"
      class="max-w-full max-h-full"
    />
    <img
      v-else-if="currency === 'chaos'"
      src="/images/chaos.png"
      class="max-w-full max-h-full"
    />
    <!-- <img
        v-else-if="currency === 'annul'"
        src="/images/annul.png"
        class="max-w-full max-h-full"
      /> -->
    <img v-else src="/images/exa.png" class="max-w-full max-h-full" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import { displayRounding, usePoeninja } from "@/web/background/Prices";
import { BaseType } from "@/assets/data";

export default defineComponent({
  props: {
    currencyText: {
      type: Boolean,
      default: false,
    },
    items: {
      type: Object as PropType<BaseType[]>,
      required: true,
    },
    items2: {
      type: Object as PropType<BaseType[]>,
      default: undefined,
    },
  },
  setup(props) {
    const { findPriceByQuery, autoCurrency, xchgRate } = usePoeninja();

    const sumPriceMin = computed(() => {
      const primary = props.items.reduce((sum, augment) => {
        const price = findPriceByQuery({
          ns: "ITEM",
          name: augment.refName,
        });
        if (!price) return sum;
        return sum + price.primaryValue;
      }, 0);
      return autoCurrency(primary);
    });

    const sumPriceMax = computed(() => {
      if (!props.items2) return sumPriceMin.value;

      const primary = props.items2.reduce((sum, augment) => {
        const price = findPriceByQuery({
          ns: "ITEM",
          name: augment.refName,
        });
        if (!price) return sum;
        return sum + price.primaryValue;
      }, 0);
      return sumPriceMin.value.currency === "div"
        ? {
            min: primary,
            max: primary,
            currency: sumPriceMin.value.currency,
          }
        : {
            min: primary * (xchgRate.value || 9999),
            max: primary * (xchgRate.value || 9999),
            currency: sumPriceMin.value.currency,
          };
    });

    const minText = computed(() =>
      displayRounding(sumPriceMin.value.min, false, true),
    );
    const maxText = computed(() =>
      displayRounding(sumPriceMax.value.max, false, true),
    );

    return {
      currency: computed(() => sumPriceMin.value.currency),
      minText,
      maxText,

      isRange: computed(() => {
        return minText.value !== maxText.value;
      }),
      isValuable: computed(() => {
        return sumPriceMax.value.currency === "div";
      }),
    };
  },
});
</script>

<style module>
.golden {
  color: #e4c29a;
}
</style>
