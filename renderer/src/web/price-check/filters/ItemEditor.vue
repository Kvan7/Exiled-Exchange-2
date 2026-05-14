<template>
  <div
    v-if="
      result &&
      itemEditorOptions &&
      !itemEditorOptions.disabled &&
      itemEditorOptions.editing
    "
    :class="[$style['wrapper'], $style[clickPosition]]"
    @mouseleave="onMouseLeave"
  >
    <div v-if="'error' in result" class="p-2">
      {{ result.error }}
    </div>
    <div
      v-if="'items' in result && result.items.length"
      class="flex-1 p-2 w-1/2"
    >
      <item-editor-button
        ref-name="None"
        :name="t('price_check.use_tooltip_off')"
        :item-editor-options="itemEditorOptions"
      >
        <div
          class="flex items-center justify-center shrink-0 w-8 h-8 border-2 border-dashed border-gray-400 rounded-full"
        />
      </item-editor-button>
      <item-editor-button
        v-for="item in result.items"
        :key="item.name"
        :ref-name="item.refName"
        :name="item.name"
        :icon="item.icon"
        :display-string="item.displayString"
        :item-editor-options="itemEditorOptions"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { ParsedItem } from "@/parser";
import { HIGH_VALUE_AUGMENTS_HARDCODED, AUGMENT_LIST } from "@/assets/data";
import ItemEditorButton from "./ItemEditorButton.vue";
import { useI18n } from "vue-i18n";
import { selectAugmentEffectByItemCategory } from "./fill-augments";
import { replaceHashWithValues } from "@/parser/Parser";
import { translatedEffectsPseudos } from "./pseudo";
import { ItemCategory, ItemEditorType } from "@/parser/meta";
import { getItemEditorType } from "./util";

interface EditorItem {
  name: string;
  refName: string;
  icon: string;
  displayString: string;
}

export default defineComponent({
  components: { ItemEditorButton },
  props: {
    item: {
      type: Object as PropType<ParsedItem | null>,
      default: null,
    },
    clickPosition: {
      type: String,
      required: true,
    },
    itemEditorOptions: {
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
        props.itemEditorOptions &&
        !props.itemEditorOptions.disabled &&
        props.itemEditorOptions.editing
      ) {
        props.itemEditorOptions.editing = false;
      }
    }
    const augmentCache = new Map<ItemCategory, EditorItem[]>();

    const result = computed(() => {
      if (!props.item) return { items: [] };

      const items: EditorItem[] = [];

      const category = props.item.category;
      if (!category) return { items };
      if (augmentCache.has(category)) {
        return { items: augmentCache.get(category)! };
      }
      if (getItemEditorType(props.item) === ItemEditorType.Augment) {
        for (const augment of AUGMENT_LIST) {
          let stat = "";
          if (props.item.category) {
            const augmentEffect = selectAugmentEffectByItemCategory(
              props.item.category,
              augment.augment,
            );

            if (
              !augmentEffect ||
              !(
                translatedEffectsPseudos(augmentEffect.string) ||
                HIGH_VALUE_AUGMENTS_HARDCODED.has(augment.refName)
              )
            )
              continue;

            stat = replaceHashWithValues(
              augmentEffect.string,
              augmentEffect.values,
            );
          }
          items.push({
            name: augment.name,
            refName: augment.refName,
            icon: augment.icon,
            displayString: stat,
          });
        }

        items.sort((a, b) => {
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
      }

      augmentCache.set(category, items);

      return {
        items,
      };
    });
    const { t } = useI18n();

    return {
      t,
      result,
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
