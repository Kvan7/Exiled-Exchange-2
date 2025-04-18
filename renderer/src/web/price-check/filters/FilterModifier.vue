<template>
  <div :class="$style['filter']">
    <div v-if="showSourceInfo" :class="$style['mods']">
      <div class="pl-5 py-1" v-for="(source, idx) of filter.sources" :key="idx">
        <source-info :source="source" :filter="filter" />
      </div>
    </div>
    <div class="flex flex-col min-w-0 flex-1">
      <div class="pb-px flex items-baseline justify-between">
        <button
          class="flex items-baseline text-left min-w-0"
          @click="toggleFilter"
          type="button"
        >
          <i
            class="w-5"
            :class="{
              'far fa-square text-gray-500': isDisabled,
              'fas fa-check-square': !isDisabled,
            }"
          ></i>
          <div
            class="search-text flex-1 mr-1 relative flex min-w-0"
            style="line-height: 1rem"
          >
            <span class="truncate"
              ><item-modifier-text
                :text="timeLost ? timeLostText : text"
                :roll="roll?.value"
            /></span>
            <span class="search-text-full whitespace-pre-wrap"
              ><item-modifier-text :text="text" :roll="roll?.value"
            /></span>
          </div>
        </button>
        <div class="flex items-baseline gap-x-1">
          <div
            v-if="showRuneNotice"
            :class="$style['qualityLabel']"
            class="self-center"
          >
            <img
              :src="
                showRuneNotice === '%NOT_FOUND%'
                  ? '/images/404.png'
                  : showRuneNotice
              "
              class="min-w-5 min-h-5 w-5 h-5"
            />
          </div>
          <div v-if="showQ20Notice" :class="$style['qualityLabel']">
            {{ t("item.prop_quality", [calcQuality]) }}
          </div>
          <div class="flex gap-x-px">
            <input
              :class="$style['rollInput']"
              :placeholder="t('min')"
              :min="roll?.bounds?.min"
              :max="roll?.bounds?.max"
              :step="changeStep"
              type="number"
              v-if="showInputs"
              ref="inputMinEl"
              v-model.number="inputMin"
              @focus="inputFocus($event, 'min')"
              @mousewheel.stop
            />
            <input
              :class="$style['rollInput']"
              :placeholder="t('max')"
              :min="roll?.bounds?.min"
              :max="roll?.bounds?.max"
              :step="changeStep"
              type="number"
              v-if="showInputs"
              ref="inputMaxEl"
              v-model.number="inputMax"
              @focus="inputFocus($event, 'max')"
              @mousewheel.stop
            />
          </div>
        </div>
      </div>
      <div class="flex">
        <div class="w-5 flex items-start">
          <ui-popover
            v-if="isHidden"
            tag-name="div"
            class="flex"
            placement="right-start"
            boundary="#price-window"
          >
            <template #target>
              <span class="text-xs leading-none text-gray-600 cursor-pointer">
                <i
                  class="fas fa-eye-slash"
                  :class="{ 'faa-ring': !isDisabled }"
                ></i>
              </span>
            </template>
            <template #content>
              <div style="max-width: 18.5rem">{{ hiddenReason }}</div>
            </template>
          </ui-popover>
        </div>

        <div class="flex-1 flex flex-col gap-1">
          <div class="flex-1 flex items-start gap-x-2">
            <span v-if="showTag" :class="[$style['tag'], $style[`tag-${tag}`]]"
              >{{ t(`filters.tag_${tag.replace("-", "_")}`)
              }}{{
                filter.sources.length > 1 ? ` x ${filter.sources.length}` : null
              }}</span
            >
            <filter-modifier-tiers :filter="filter" :item="item" />
            <filter-modifier-item-has-empty :filter="filter" />
          </div>
          <filter-modifier-item-is-elemental :filter="filter" />
        </div>

        <stat-roll-slider
          v-if="roll && roll.bounds"
          class="mr-4"
          style="width: 12.5rem"
          v-model="sliderValue"
          :roll="roll.value"
          :dp="roll.dp"
          :bounds="roll.bounds"
        />
        <div style="width: calc(2 * 3rem + 1px)" />
      </div>
    </div>
    <div class="flex flex-col">
      <modifier-anointment :filter="filter" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import UiPopover from "@/web/ui/Popover.vue";
import StatRollSlider from "../../ui/StatRollSlider.vue";
import ItemModifierText from "../../ui/ItemModifierText.vue";
import ModifierAnointment from "./FilterModifierAnointment.vue";
import FilterModifierItemHasEmpty from "./FilterModifierItemHasEmpty.vue";
import FilterModifierTiers from "./FilterModifierTiers.vue";
import { AppConfig } from "@/web/Config";
import { ItemCategory, ItemRarity, ParsedItem } from "@/parser";
import { FilterTag, StatFilter, INTERNAL_TRADE_IDS } from "./interfaces";
import SourceInfo from "./SourceInfo.vue";
import FilterModifierItemIsElemental from "./FilterModifierItemIsElemental.vue";
import { CLIENT_STRINGS as _$ } from "@/assets/data";

export default defineComponent({
  components: {
    ItemModifierText,
    ModifierAnointment,
    FilterModifierItemHasEmpty,
    FilterModifierTiers,
    SourceInfo,
    StatRollSlider,
    UiPopover,
    FilterModifierItemIsElemental,
  },
  emits: ["submit"],
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true,
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
    showSources: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, ctx) {
    const showTag = computed(
      () =>
        props.filter.tag !== FilterTag.Property &&
        props.filter.tradeId[0] !== "item.has_empty_modifier" &&
        props.item.info.refName !== "Chronicle of Atzoatl" &&
        props.item.info.refName !== "Mirrored Tablet" &&
        props.item.info.refName !== "Filled Coffin" &&
        !(
          props.item.rarity === ItemRarity.Unique &&
          (props.filter.tag === FilterTag.Explicit ||
            props.filter.tag === FilterTag.Pseudo)
        ),
    );

    const showRuneNotice = computed(() => {
      if (props.filter.editorAdded) {
        return props.filter.editorAdded.icon;
      }
      return false;
    });

    const showQ20Notice = computed(() => {
      return (
        [
          "item.armour",
          "item.evasion_rating",
          "item.energy_shield",
          "item.total_dps",
          "item.physical_dps",
        ].includes(props.filter.tradeId[0]) && !props.item.isCorrupted
      );
    });

    const calcQuality = computed(() => Math.max(20, props.item.quality || 0));

    const inputMinEl = ref<HTMLInputElement | null>(null);
    const inputMaxEl = ref<HTMLInputElement | null>(null);

    const sliderValue = computed<Array<number | "" | undefined>>({
      get() {
        const roll = props.filter.roll!;
        return [roll.min, roll.max];
      },
      set(value) {
        if (typeof value[0] === "number") {
          props.filter.roll!.min = value[0];
          nextTick(() => {
            inputMinEl.value!.focus();
          });
        } else if (typeof value[1] === "number") {
          props.filter.roll!.max = value[1];
          nextTick(() => {
            inputMaxEl.value!.focus();
          });
        }
        props.filter.disabled = false;
      },
    });

    function inputFocus(e: FocusEvent, type: "min" | "max") {
      const target = e.target as HTMLInputElement;
      if (target.value === "") {
        if (type === "max") {
          props.filter.roll!.max = props.filter.roll!.default.max;
        } else if (type === "min") {
          props.filter.roll!.min = props.filter.roll!.default.min;
        }
        nextTick(() => {
          target.select();
        });
      } else {
        target.select();
      }
      props.filter.disabled = false;
    }

    function toggleFilter(e: MouseEvent) {
      if (e.detail === 0) {
        ctx.emit("submit");
      } else {
        props.filter.disabled = !props.filter.disabled;
      }
    }

    const text = computed(() => {
      if (
        !(INTERNAL_TRADE_IDS as readonly string[]).includes(
          props.filter.tradeId[0],
        )
      ) {
        return props.filter.text;
      } else {
        return t(props.filter.tradeId[0], ["#", "#"]);
      }
    });

    const { t } = useI18n();

    return {
      t,
      showTag,
      showRuneNotice,
      showQ20Notice,
      calcQuality,
      inputMinEl,
      inputMaxEl,
      sliderValue,
      inputMin: computed({
        get(): any {
          return props.filter.roll!.min;
        },
        set(value: "" | number) {
          props.filter.roll!.min = value;
        },
      }),
      inputMax: computed({
        get(): any {
          return props.filter.roll!.max;
        },
        set(value: "" | number) {
          props.filter.roll!.max = value;
        },
      }),
      tag: computed(() => props.filter.tag),
      // TODO: change
      changeStep: computed(() => (props.filter.roll!.dp ? 0.01 : 1)),
      showInputs: computed(
        () => props.filter.roll != null && !props.filter.oils,
      ),
      fontSize: computed(() => AppConfig().fontSize),
      isDisabled: computed(() => props.filter.disabled),
      timeLostText: computed(() => {
        if (
          props.item.category === ItemCategory.Jewel &&
          props.item.info.refName.startsWith("Time-Lost")
        ) {
          const raw = text.value;
          const templates = [
            _$.TIMELESS_SMALL_PASSIVES,
            _$.TIMELESS_NOTABLE_PASSIVES,
          ];
          for (const template of templates) {
            const escaped = template.replace("{0}", "(.*)");
            const regex = new RegExp("^" + escaped + "$");
            const match = raw.match(regex);
            if (match) return match[1];
          }
        }
        return text.value;
      }),
      text,
      roll: computed(() => props.filter.roll),
      isHidden: computed(() => props.filter.hidden != null),
      hiddenReason: computed(() => t(props.filter.hidden!)),
      showSourceInfo: computed(
        () =>
          props.showSources &&
          props.filter.sources.length &&
          (props.filter.option == null ||
            (props.filter.tradeId &&
              props.filter.tradeId.length > 0 &&
              props.filter.tradeId[0] === "item.elemental_dps")) &&
          (props.filter.tag === FilterTag.Pseudo ||
            props.filter.sources.length >= 2 ||
            props.filter.sources[0].modifier.info.name != null ||
            props.filter.sources[0].modifier.info.tier != null ||
            props.filter.sources[0].modifier.info.rank != null),
      ),
      inputFocus,
      toggleFilter,
      timeLost: computed(
        () =>
          props.item.category === ItemCategory.Jewel &&
          props.item.info.refName.startsWith("Time-Lost"),
      ),
    };
  },
});
</script>

<style lang="postcss" module>
.filter {
  @apply py-2;
  @apply border-b border-gray-700;
  display: flex;
  position: relative;
}

.rollInput {
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply text-center;
  @apply w-12;
  @apply px-1;
  @apply border border-transparent;

  &:first-child {
    @apply rounded-l;
  }
  &:last-child {
    @apply rounded-r;
  }

  &::placeholder {
    @apply text-gray-700;
    font-size: 0.8125rem;
  }

  /* &:not(:placeholder-shown) { @apply border-gray-600; } */

  &:focus {
    @apply border-gray-500;
    cursor: none;
  }
}

.qualityLabel {
  @apply text-gray-500;
  @apply border border-gray-700;
  @apply rounded;
  @apply px-2;
  @apply text-center;
}

.mods {
  @apply border-b-4 border-gray-500;
  background: linear-gradient(
    to bottom,
    theme("colors.gray.800"),
    theme("colors.gray.900")
  );
  @apply -mx-4 px-4;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 10;
}

.filter:not(:hover) > .mods {
  display: none;
}

.tag {
  @apply px-1;
  @apply rounded;
  @apply text-xs;
  line-height: 1;
}
.tag-variant {
  @apply bg-yellow-700 text-yellow-100;
}
.tag-eldritch {
  background: linear-gradient(
    to right,
    theme("colors.red.700"),
    theme("colors.blue.700")
  );
}
.tag-explicit-shaper,
.tag-explicit-elder,
.tag-explicit-crusader,
.tag-explicit-hunter,
.tag-explicit-redeemer,
.tag-explicit-warlord,
.tag-explicit-delve,
.tag-explicit-veiled,
.tag-explicit-incursion {
  display: flex;
  align-items: center;
  @apply -mx-1 pl-0.5 gap-x-0.5 text-gray-600;
  text-shadow: 0 0 4px theme("colors.gray.900");

  &::before {
    background-size: contain;
    @apply w-5 h-5 -my-5;
    content: "";
  }
}
.tag-explicit-shaper::before {
  background-image: url("/images/influence-Shaper.png");
}
.tag-explicit-elder::before {
  background-image: url("/images/influence-Elder.png");
}
.tag-explicit-crusader::before {
  background-image: url("/images/influence-Crusader.png");
}
.tag-explicit-hunter::before {
  background-image: url("/images/influence-Hunter.png");
}
.tag-explicit-redeemer::before {
  background-image: url("/images/influence-Redeemer.png");
}
.tag-explicit-warlord::before {
  background-image: url("/images/influence-Warlord.png");
}
.tag-explicit-delve::before {
  background-image: url("/images/delve.png");
}
.tag-explicit-veiled::before {
  background-image: url("/images/veiled.png");
}
.tag-explicit-incursion::before {
  background-image: url("/images/incursion.png");
}

.tag-corrupted {
  @apply bg-red-700 text-red-100;
}
.tag-fractured {
  @apply bg-yellow-400 text-black;
}
.tag-crafted,
.tag-synthesised {
  @apply bg-blue-600 text-blue-100;
}
.tag-implicit,
.tag-explicit {
  @apply -mx-1 text-gray-600;
  text-shadow: 0 0 4px theme("colors.gray.900");
}
.tag-scourge {
  @apply bg-orange-600 text-white;
}
.tag-enchant {
  @apply bg-purple-600 text-purple-100;
}
.tag-pseudo {
  @apply bg-gray-700 text-black;
}
.tag-rune {
  @apply bg-blue-600 text-blue-100;
}
.tag-added-rune {
  @apply text-blue-100 relative overflow-hidden;

  background: repeating-linear-gradient(
    45deg,
    #3182ce,
    #3182ce 8px,
    #1a4773 8px,
    #1a4773 16px
  );
}
.tag-sanctum {
  @apply border;
}
</style>

<style lang="postcss">
.search-text-full {
  position: absolute;
  left: 0px;
  right: 0px;
  top: 0px;
  padding-bottom: 1px;
  z-index: 10;

  .search-text:not(:hover) & {
    display: none;
  }

  .search-text:hover & {
    @apply bg-gray-700;
  }
}

.truncate-start {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
}
.truncate-start:after {
  position: absolute;
  left: 0px;
  content: "...";
}
</style>
