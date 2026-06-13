<template>
  <!-- Render nothing directly, all behavior is applied to the element passed via ref -->
  <tr
    ref="target"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
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
      v-if="isGem || item.category === ItemCategory.UncutGem"
      class="pl-2 whitespace-nowrap"
    >
      {{ result.level }}
    </td>
    <td v-if="isGem" class="pl-2 whitespace-nowrap">
      {{ result.gemSockets }}
    </td>
    <td
      v-if="(quality && !quality.disabled) || isGem"
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
  </tr>
  <div ref="content">
    <!-- isHovered is mostly used here to prevent tooltip from rendering on initial load, tooltip is kinda expensive to mount -->
    <tooltip-item :result="result" v-if="isHovered" />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
} from "vue";
import { PricingResult } from "./pathofexile-trade";
import { ParsedItem } from "@/parser/ParsedItem";
import { FilterNumeric } from "../filters/interfaces";
import { useI18nNs } from "@/web/i18n";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { AppConfig } from "@/web/Config";
import { ItemCategory } from "@/parser";
import TooltipItem from "./TooltipItem.vue";
import { GEM } from "@/parser/meta";

export default defineComponent({
  name: "TradeItem",
  components: { TooltipItem },
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
    itemLevel: {
      type: Object as PropType<FilterNumeric>,
      default: undefined,
    },
    quality: {
      type: Object as PropType<FilterNumeric>,
      default: undefined,
    },
  },

  setup(props) {
    const tooltipOption = computed(
      () => AppConfig<PriceCheckWidget>("price-check")!.itemHoverTooltip,
    );
    const target = ref<HTMLElement>(null!);
    const content = ref<HTMLElement>(null!);
    const { t } = useI18nNs("trade_result");
    let instance: Instance;

    // Shift Key Detection
    const isShiftPressed = ref(false);
    const isHovered = ref(false); // Track hover state

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        instance.enable();
        if (isHovered.value) {
          instance.show();
        }
        isShiftPressed.value = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        instance.hide();
        instance.disable();
        isShiftPressed.value = false;
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
        content: content.value,
        interactive: true,
        theme: "item-tooltip",
        trigger: "mouseenter",
        placement: "left",
        arrow: true,
        delay: [0, 0],
        animation: false,
        maxWidth: "none",
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
      content,
      isHovered,
      isShiftPressed,
      ItemCategory,
      isGem: computed(
        () => props.item.category && GEM.has(props.item.category),
      ),
    };
  },
});
</script>

<style lang="postcss">
.tippy-box[data-theme~="item-tooltip"] {
  @apply w-fit h-fit;
  /* hiding box more */
  @apply shadow-none bg-transparent;
}

div[data-tippy-root] .tippy-box[data-theme~="item-tooltip"] {
  @apply bg-transparent;
}

.tippy-box[data-theme~="item-tooltip"] .tippy-content {
  @apply p-0 w-fit h-fit;
}

.tippy-box[data-theme~="item-tooltip"] > .tippy-arrow::before {
  @apply text-white;
}
</style>
