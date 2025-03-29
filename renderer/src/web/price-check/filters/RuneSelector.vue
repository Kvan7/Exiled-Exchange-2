<template>
  <div
    v-if="result && showRuneSelector.editing"
    :class="[$style['wrapper'], $style[clickPosition]]"
  >
    <div v-if="'error' in result" class="p-2">
      {{ result.error }}
    </div>
    <div
      v-if="'runes' in result && result.runes.length"
      class="flex-1 p-2 w-1/2"
    >
      <div
        v-for="rune in result.runes"
        :key="rune.name"
        class="hover:bg-gray-700 rounded"
        @click="selectRune(rune.refName)"
      >
        <div class="flex items-center justify-center shrink-0 w-8 h-8">
          <img :src="rune.icon" class="max-w-full max-h-full overflow-hidden" />
        </div>
        <div
          class="text-left text-gray-600 mb-1 whitespace-nowrap overflow-hidden"
        >
          {{ rune.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { ParsedItem } from "@/parser";
import ItemQuickPrice from "@/web/ui/ItemQuickPrice.vue";
import { RUNE_LIST } from "@/assets/data";

export default defineComponent({
  components: { ItemQuickPrice },
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
      type: Object as PropType<{ editing: boolean; value: string }>,
      required: true,
    },
  },
  setup(props) {
    const result = computed(() => {
      if (!props.item) return;

      return {
        runes: RUNE_LIST,
      };
    });

    return {
      result,
      selectRune(id: string) {
        props.showRuneSelector.value = id;
      },
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
