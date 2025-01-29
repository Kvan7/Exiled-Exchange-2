<template>
  <div v-if="options" class="flex gap-x-1">
    <button
      v-for="option in options"
      :class="[$style.button, { [$style.selected]: option.isSelected }]"
      @click="option.select"
      type="button"
    >
      {{ t(option.text) }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { useI18n } from "vue-i18n";
import { StatFilter, ItemIsElementalModifier } from "./interfaces";

export default defineComponent({
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true,
    },
  },
  setup(props) {
    function select(value: ItemIsElementalModifier) {
      const { filter } = props;
      filter.option!.value = value;
      filter.disabled = false;
    }

    const options = computed(() => {
      const { filter } = props;
      if (filter.tradeId[0] !== "item.elemental_dps") return null;

      return (
        [
          [ItemIsElementalModifier.Any, "item.has_elemental_affix"],
          [ItemIsElementalModifier.Fire, "item.has_elemental_fire_affix"],
          [ItemIsElementalModifier.Cold, "item.has_elemental_cold_affix"],
          [
            ItemIsElementalModifier.Lightning,
            "item.has_elemental_lightning_affix",
          ],
        ] as const
      ).map(([value, text]) => ({
        text,
        select: () => select(value),
        isSelected: filter.option!.value === value,
      }));
    });

    const { t } = useI18n();
    return { t, options };
  },
});
</script>

<style lang="postcss" module>
.button {
  @apply bg-gray-700;
  @apply rounded;
  @apply px-2;
  @apply border border-transparent;
  line-height: 1.15rem;
}

.selected {
  @apply border-gray-500;
}
</style>
