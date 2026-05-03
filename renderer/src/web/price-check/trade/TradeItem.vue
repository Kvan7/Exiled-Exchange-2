<template>
  <!-- Render nothing directly, all behavior is applied to the element passed via ref -->
  <tr
    ref="target"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="travelToHideoutRow"
    :class="{
      'cursor-pointer': showTravel === 'row' && isCtrlPressed,
    }"
  >
    <td class="px-2 whitespace-nowrap">
      <span
        :class="{
          'line-through': false,
        }"
        >{{ result.priceAmount }} {{ result.priceCurrency
        }}{{
          result.normalizedPriceCurrency &&
          result.priceCurrency !== result.normalizedPriceCurrency.id &&
          result.priceCurrency !== "divine" &&
          result.normalizedPrice
            ? ` (${result.normalizedPrice} ${result.normalizedPriceCurrency.abbrev})`
            : ""
        }}</span
      >
      <span
        v-if="result.listedTimes > 2"
        class="rounded px-1 text-gray-800 bg-gray-400 -mr-2"
        ><span class="font-sans">×</span> {{ result.listedTimes }}</span
      ><i v-else-if="!result.hasNote" class="fas fa-question" />
    </td>
    <td v-if="item.stackSize" class="px-2 text-right">
      {{ result.stackSize }}
    </td>

    <td v-if="itemLevel" class="px-2 whitespace-nowrap text-right">
      {{ result.itemLevel }}
    </td>
    <td
      v-if="
        item.category === ItemCategory.Gem ||
        item.category === ItemCategory.UncutGem
      "
      class="pl-2 whitespace-nowrap"
    >
      {{ result.level }}
    </td>
    <td
      v-if="item.category === ItemCategory.Gem"
      class="pl-2 whitespace-nowrap"
    >
      {{ result.gemSockets }}
    </td>
    <td
      v-if="
        (quality && !quality.disabled) || item.category === ItemCategory.Gem
      "
      class="px-2 whitespace-nowrap text-blue-400 text-right"
    >
      {{ result.quality }}
    </td>
    <td class="pr-2 pl-4 whitespace-nowrap">
      <div class="inline-flex items-center">
        <div
          class="account-status"
          :class="
            result.isInstantBuyout ? 'instantBuyout' : result.accountStatus
          "
        ></div>
        <div class="ml-1 font-sans text-xs">
          {{ result.relativeDate }}
        </div>
      </div>
      <span
        v-if="!showSeller && result.isMine"
        class="rounded px-1 text-gray-800 bg-gray-400 ml-1"
        >{{ t("You") }}</span
      >
      <span
        v-if="!showSeller && result.inDemand"
        class="rounded px-1 bg-yellow-500 text-black ml-1"
        >{{ t("in demand") }}</span
      >
      <span
        v-if="!showSeller && result.gone"
        class="rounded border px-1 border-red-500 text-red-500 ml-1"
        >{{ t("Gone") }}</span
      >
    </td>
    <td v-if="showSeller" class="px-2 whitespace-nowrap">
      <span
        v-if="result.isMine"
        class="rounded px-1 text-gray-800 bg-gray-400"
        >{{ t("You") }}</span
      >
      <span v-else class="font-sans text-xs">{{
        showSeller === "ign" ? result.ign : result.accountName
      }}</span>
      <span
        v-if="result.inDemand"
        class="rounded px-1 bg-yellow-500 text-black ml-1"
        >{{ t("in demand") }}</span
      >
      <span
        v-if="!showSeller && result.gone"
        class="rounded border-2 px-1 border-red-500 text-red-500 ml-1"
        >{{ t("Gone") }}</span
      >
    </td>
    <td
      v-if="showTravel === 'button' && result.hideoutToken"
      class="px-2 whitespace-nowrap"
    >
      <button
        @click="$emit('travel-to-hideout')"
        class="bg-gray-700 text-gray-400 rounded px-2"
      >
        <i class="w-5 fas fa-sack-dollar"></i>
      </button>
    </td>
  </tr>
</template>

<script lang="ts">
import {
  App,
  computed,
  createApp,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
} from "vue";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import { PricingResult } from "./pathofexile-trade";
import { ParsedItem } from "@/parser/ParsedItem";
import { FilterNumeric } from "../filters/interfaces";
import { useI18nNs } from "@/web/i18n";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import TooltipItem from "./TooltipItem.vue";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import { AppConfig } from "@/web/Config";
import { ItemCategory } from "@/parser";

export default defineComponent({
  name: "TradeItem",
  props: {
    result: {
      type: Object as PropType<
        PricingResult & {
          listedTimes: number;
        }
      >,
      required: true,
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
    showSeller: {
      type: [Boolean, String] as PropType<PriceCheckWidget["showSeller"]>,
      default: undefined,
    },
    showTravel: {
      type: String,
      default: "disabled",
    },
    itemLevel: {
      type: Object as PropType<FilterNumeric>,
      default: undefined,
    },
    quality: {
      type: Object as PropType<FilterNumeric>,
      default: undefined,
    },
  },
  emits: ["travel-to-hideout"],

  setup(props, ctx) {
    const tooltipOption = computed(
      () => AppConfig<PriceCheckWidget>("price-check")!.itemHoverTooltip,
    );
    const target = ref<HTMLElement>(null!);
    const { t } = useI18nNs("trade_result");
    let instance: Instance;
    let tooltipApp: App<Element> | undefined;

    // Shift Key Detection
    const isShiftPressed = ref(false);
    const isCtrlPressed = ref(false);
    const isHovered = ref(false); // Track hover state

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        instance.enable();
        if (isHovered.value) {
          instance.show();
        }
        isShiftPressed.value = true;
      }
      if (event.key === "Control") {
        isCtrlPressed.value = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        instance.hide();
        instance.disable();
        isShiftPressed.value = false;
      }
      if (event.key === "Control") {
        isCtrlPressed.value = false;
      }
    };

    onMounted(() => {
      if (tooltipOption.value === "off") return;
      if (tooltipOption.value === "keybind") {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
      }

      // tippy stuff
      instance = tippy(target.value, {
        interactive: true,
        theme: "light",
        trigger: undefined,
        placement: "left",
        arrow: true,
        delay: [0, 0],
        animation: false,
        maxWidth: "none",
        onMount() {
          tooltipApp = createApp(TooltipItem, {
            result: props.result,
          });
          const tooltipContainer = document.createElement("div");
          tooltipApp.mount(tooltipContainer);
          instance.setContent(tooltipContainer);
        },
        onDestroy() {
          tooltipApp?.unmount();
        },
      });
      if (tooltipOption.value === "keybind") {
        instance.disable();
      }
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      instance?.destroy();
    });
    return {
      t,
      target,
      isHovered,
      isShiftPressed,
      isCtrlPressed,
      ItemCategory,
      travelToHideoutRow() {
        if (props.showTravel !== "row") return;
        if (!props.result.hideoutToken) return;
        if (!isCtrlPressed.value) return;
        ctx.emit("travel-to-hideout");
      },
    };
  },
});
</script>

<style lang="postcss">
.tippy-box {
  @apply rounded;
}

.tippy-content {
  @apply p-1;
}
</style>
