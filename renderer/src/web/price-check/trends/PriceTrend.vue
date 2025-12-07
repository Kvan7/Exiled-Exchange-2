<template>
  <div v-if="priceData" class="flex items-center pb-4" style="min-height: 3rem">
    <div
      v-if="!isValuableBasetype && !slowdown.isReady.value"
      class="flex flex-1 justify-center"
    >
      <div><i class="fas fa-dna fa-spin text-gray-600"></i></div>
      <i18n-t keypath="trade_result.getting_price" class="pl-2">
        <span class="text-gray-600">{{ t(":getting_price_from") }}</span>
      </i18n-t>
    </div>
    <template v-else>
      <div
        v-if="priceData.volume && volumeSetting !== 'none'"
        @click="openNinja"
        class="flex flex-col items-center gap-y-1 rounded hover:bg-gray-700 px-1 cursor-pointer"
      >
        <!-- Currency per hour -->
        <div
          v-if="volumeSetting === 'value' || volumeSetting === 'both'"
          class="flex flex-row items-center"
        >
          {{ priceData.volume.primaryVolumePerHour }}
          <div class="w-6 h-6 flex items-center justify-center shrink-0">
            <img
              v-if="priceData.volume.currency === 'div'"
              src="/images/divine.png"
              class="max-w-full max-h-full"
            />
            <img
              v-else-if="priceData.volume.currency === 'chaos'"
              src="/images/chaos.png"
              class="max-w-full max-h-full"
            />
            <img v-else src="/images/exa.png" class="max-w-full max-h-full" />
          </div>
          <div class="text-xs text-gray-500">/hr</div>
        </div>
        <!-- Items per hour -->
        <div
          v-if="volumeSetting === 'item' || volumeSetting === 'both'"
          class="flex flex-row items-center"
        >
          {{ priceData.volume.itemsPerHour }}
          <div class="w-6 h-6 flex items-center justify-center shrink-0">
            <ui-item-img :icon="item.info.icon" overflow-hidden />
          </div>
          <div class="text-xs text-gray-500">/hr</div>
        </div>
      </div>
      <item-quick-price
        class="flex-1 text-base justify-center"
        :price="priceData.price"
        :fraction="filters.stackSize != null"
        :item-img="item.info.icon"
        :item-base="item.info"
      >
        <template #item v-if="isValuableBasetype">
          <span class="text-gray-400">{{ t(":base_item") }}</span>
        </template>
      </item-quick-price>
      <div
        v-if="priceData.change || priceData.volume"
        class="flex flex-col items-center"
      >
        <div
          v-if="priceData.change"
          @click="openNinja"
          :class="$style['trend-btn']"
        >
          <div class="text-center">
            <div class="leading-tight">
              <i
                v-if="priceData.change.forecast === 'down'"
                class="fas fa-angle-double-down pr-1 text-red-600"
              ></i>
              <i
                v-if="priceData.change.forecast === 'up'"
                class="fas fa-angle-double-up pr-1 text-green-500"
              ></i>
              <span
                v-if="priceData.change.forecast === 'const'"
                class="pr-1 text-gray-600 font-sans leading-none"
                >±</span
              >
              <span>{{ priceData.change.text }}</span>
            </div>
            <div class="text-xs text-gray-500 leading-none">
              {{ t(":graph_7d") }}
            </div>
          </div>
          <div v-if="priceData.change" class="w-12 h-8">
            <vue-apexcharts
              type="area"
              :options="{
                chart: {
                  sparkline: { enabled: true },
                  animations: { enabled: false },
                },
                stroke: {
                  curve: 'smooth',
                  width: 1,
                  colors: ['#a0aec0' /* gray.500 */],
                },
                fill: { colors: ['#4a5568' /* gray.700 */], type: 'solid' },
                tooltip: { enabled: false },
                plotOptions: { area: { fillTo: 'end' } },
                yaxis: {
                  show: false,
                  min: priceData.change.graph.drawMin,
                  max: priceData.change.graph.drawMax,
                },
              }"
              :series="[
                {
                  data: priceData.change.graph.points,
                },
              ]"
            />
          </div>
        </div>
        <div v-if="priceData.volume" class="flex flex-row items-center">
          <div class="text-xs text-gray-500">{{ t(":highest_volume") }}</div>

          <div class="w-6 h-6 flex items-center justify-center shrink-0">
            <img
              v-if="priceData.volume.highestVolumeCurrency === 'divine'"
              src="/images/divine.png"
              class="max-w-full max-h-full"
            />
            <img
              v-else-if="priceData.volume.highestVolumeCurrency === 'chaos'"
              src="/images/chaos.png"
              class="max-w-full max-h-full"
            />
            <img
              v-else-if="priceData.volume.highestVolumeCurrency === 'exalted'"
              src="/images/exa.png"
              class="max-w-full max-h-full"
            />
            <img v-else src="/images/404.png" class="max-w-full max-h-full" />
          </div>
        </div>
      </div>
    </template>
  </div>
  <div
    v-else-if="!item.info.craftable"
    class="flex items-center pb-4"
    style="min-height: 3rem"
  >
    <item-quick-price
      class="flex-1 text-base justify-center"
      currency-text
      :item-img="item.info.icon"
      :item-base="item.info"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch } from "vue";
import { useI18nNs } from "@/web/i18n";
import { displayRounding, usePoeninja } from "@/web/background/Prices";
import { isValuableBasetype, getDetailsId } from "./getDetailsId";
import ItemQuickPrice from "@/web/ui/ItemQuickPrice.vue";
import VueApexcharts from "vue3-apexcharts";
import { ParsedItem } from "@/parser";
import { artificialSlowdown } from "../trade/artificial-slowdown";
import { ItemFilters } from "../filters/interfaces";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/interfaces";
import UiItemImg from "@/web/ui/UiItemImg.vue";

const slowdown = artificialSlowdown(800);

export default defineComponent({
  components: {
    ItemQuickPrice,
    VueApexcharts,
    UiItemImg,
  },
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18nNs("trade_result");
    const { findPriceByQuery, autoCurrency } = usePoeninja();

    const volumeSetting = computed(
      () => AppConfig<PriceCheckWidget>("price-check")!.currencyVolume,
    );

    watch(
      () => props.item,
      (item) => {
        slowdown.reset(item);
      },
      { immediate: true },
    );

    const priceData = computed(() => {
      const detailsId = getDetailsId(props.item);
      const entry = detailsId && findPriceByQuery(detailsId);
      if (!entry) return;
      const usePerHour = "volumePrimaryValue" in entry;
      const price = autoCurrency(entry.primaryValue);

      let volume;
      if (usePerHour) {
        const perHour = autoCurrency(entry.volumePrimaryValue);

        const itemsPerHour =
          perHour!.min /
          (perHour!.currency === "div" ? entry.primaryValue : price.min);

        volume = {
          currency: perHour!.currency,
          primaryVolumePerHour: displayRounding(perHour!.min),
          itemsPerHour: displayRounding(itemsPerHour!, false, true),
          highestVolumeCurrency: entry.maxVolumeCurrency,
        };
      }

      return {
        price,
        volume,
        change: entry.sparkline.data
          ? deltaFromGraph(entry.sparkline.data)
          : undefined,
        url: entry.url,
      };
    });

    return {
      t,
      priceData,
      openNinja() {
        window.open(priceData.value!.url);
      },
      isValuableBasetype: computed(() => {
        return isValuableBasetype(props.item);
      }),
      slowdown,
      volumeSetting,
    };
  },
});

function deltaFromGraph(graphPoints: Array<number | null>) {
  const points = graphPoints.filter((p) => p != null) as number[];
  if (points.length < 2) return null;

  let forecast = "const";
  if (points.length === 7) {
    if (
      points.filter((p) => p > 0).length >= 4 ||
      points.slice(4).every((p) => p > 0)
    ) {
      forecast = "up";
    } else if (
      points.filter((p) => p < 0).length >= 4 ||
      points.slice(4).every((p) => p < 0)
    ) {
      forecast = "down";
    }
  }

  const mean = points.reduce((a, b) => a + b) / points.length;
  const changeVal = Math.sqrt(
    points.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) /
      (points.length - 1),
  );

  return {
    graph: {
      points,
      drawMin: Math.min(...points) - (changeVal || 1),
      drawMax: Math.max(...points) + (changeVal || 1),
    },
    forecast,
    text: `${Math.round(changeVal * 2)}\u2009%`,
  };
}
</script>

<style lang="postcss" module>
.trend-btn {
  display: flex;
  align-items: center;
  @apply gap-x-2;
  cursor: pointer;
  @apply rounded;
  @apply -my-0.5 py-0.5;
  @apply px-1;

  &:hover {
    @apply bg-gray-700;
  }
}
</style>
