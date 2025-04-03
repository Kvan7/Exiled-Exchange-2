<template>
  <div
    v-if="
      result &&
      showRuneSelector &&
      !showRuneSelector.disabled &&
      showRuneSelector.editing
    "
    :class="[$style['wrapper'], $style[clickPosition]]"
    @mouseleave="onMouseLeave"
  >
    <div v-if="'error' in result" class="p-2">
      {{ result.error }}
    </div>
    <div
      v-if="'runes' in result && result.runes.length"
      class="flex-1 p-2 w-1/2"
    >
      <rune-selector-button
        ref-name="None"
        :name="t('price_check.use_tooltip_off')"
        :show-rune-selector="showRuneSelector"
      >
        <div
          class="flex items-center justify-center shrink-0 w-8 h-8 border-2 border-dashed border-gray-400 rounded-full"
        />
      </rune-selector-button>
      <rune-selector-button
        v-for="rune in result.runes"
        :key="rune.name"
        :ref-name="rune.refName"
        :name="rune.name"
        :icon="rune.icon"
        :stat="rune.stat"
        :show-rune-selector="showRuneSelector"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { ParsedItem } from "@/parser";
import { HIGH_VALUE_RUNES_HARDCODED, RUNE_LIST } from "@/assets/data";
import RuneSelectorButton from "./RuneSelectorButton.vue";
import { useI18n } from "vue-i18n";
import { selectRuneEffectByItemCategory } from "./fill-runes";
import { replaceHashWithValues } from "@/parser/Parser";
import { refEffectsPseudos } from "./pseudo";

export default defineComponent({
  components: { RuneSelectorButton },
  props: {
    item: {
      type: Object as PropType<ParsedItem | null>,
      default: null,
    },
    clickPosition: {
      type: String,
      required: true,
    },
    showRuneSelector: {
      type: Object as PropType<
        | {
            editing: boolean;
            value: string;
            disabled: boolean;
          }
        | undefined
      >,
      required: true,
    },
  },
  setup(props) {
    function onMouseLeave() {
      if (
        props.showRuneSelector &&
        !props.showRuneSelector.disabled &&
        props.showRuneSelector.editing
      ) {
        props.showRuneSelector.editing = false;
      }
    }

    const result = computed(() => {
      if (!props.item) return;

      const runes: Array<{
        name: string;
        refName: string;
        icon: string;
        stat: string;
      }> = [];

      for (const rune of RUNE_LIST) {
        let stat = "";
        if (props.item.category) {
          const runeEffect = selectRuneEffectByItemCategory(
            props.item.category,
            rune.rune,
          );
          if (runeEffect) {
            if (
              !(
                refEffectsPseudos(runeEffect.string) ||
                HIGH_VALUE_RUNES_HARDCODED.has(rune.refName)
              )
            )
              continue;
            stat = replaceHashWithValues(runeEffect.string, runeEffect.values);
          }
        }
        runes.push({
          name: rune.name,
          refName: rune.refName,
          icon: rune.icon,
          stat,
        });
      }

      runes.sort((a, b) => {
        const rank = (s: string) =>
          s.includes(" Rune")
            ? 0
            : s.includes("Soul Core of")
              ? 1
              : s.includes("Talisman")
                ? 2
                : 3;
        const rA = rank(a.refName);
        const rB = rank(b.refName);
        return rA - rB || a.refName.localeCompare(b.refName);
      });

      return {
        runes,
      };
    });
    const { t } = useI18n();

    return {
      t,
      result,
      selectRune(id: string) {
        if (props.showRuneSelector && !props.showRuneSelector.disabled) {
          props.showRuneSelector.value = id;
        }
      },
      onMouseLeave,
    };
  },
});
</script>

<style lang="postcss" module>
.wrapper {
  display: flex;
  @apply bg-gray-800 text-gray-400 mt-6;
  @apply border border-gray-900;
  border-width: 0.25rem;
  max-width: min(100%, 24rem);
}

.stash {
  @apply rounded-l-lg;
  box-shadow: inset -0.5rem 0 0.5rem -0.5rem rgb(0 0 0 / 70%);
  border-right: none;
}

.inventory {
  @apply rounded-r-lg;
  box-shadow: inset 0.5rem 0 0.5rem -0.5rem rgb(0 0 0 / 70%);
  border-left: none;
}
</style>
