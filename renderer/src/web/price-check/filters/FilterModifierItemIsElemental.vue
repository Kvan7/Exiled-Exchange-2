<template>
  <div v-if="options" class="flex gap-x-1">
    <button
      v-for="option in options"
      :class="[
        $style.button,
        { [$style.selected]: option.isSelected },
        $style[`type-${option.tag}`],
      ]"
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
          [ItemIsElementalModifier.Any, "item.has_elemental_affix", "any"],
          [
            ItemIsElementalModifier.Fire,
            "item.has_elemental_fire_affix",
            "fire",
          ],
          [
            ItemIsElementalModifier.Cold,
            "item.has_elemental_cold_affix",
            "cold",
          ],
          [
            ItemIsElementalModifier.Lightning,
            "item.has_elemental_lightning_affix",
            "lightning",
          ],
        ] as const
      ).map(([value, text, tag]) => ({
        text,
        select: () => select(value),
        isSelected: filter.option!.value === value,
        tag,
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
.type-fire {
  @apply text-fire;
}
.type-fire.selected {
  @apply border-fire;
}
.type-cold {
  @apply text-cold;
}
.type-cold.selected {
  @apply border-cold;
}
.type-lightning {
  @apply text-lightning;
}
.type-lightning.selected {
  @apply border-lightning;
}
</style>
