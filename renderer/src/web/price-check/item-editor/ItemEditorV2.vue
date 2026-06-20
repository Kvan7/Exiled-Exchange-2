<template>
  <div class="bg-gray-800 text-gray-200">
    <augment-editor
      v-if="itemEditorType === ItemEditorType.Augment"
      :item="actualItem"
    />
    <quality-editor
      v-else-if="itemEditorType === ItemEditorType.Catalyst"
      :item="actualItem"
    />
    <div v-else-if="itemEditorType === ItemEditorType.AugmentAndCatalyst">
      AAAAA DO BOTH NEED TO ADD IT STILL
    </div>
  </div>
</template>

<script lang="ts">
import { ParsedItem } from "@/parser";
import { computed, defineComponent, PropType, ref } from "vue";
import AugmentEditor from "./AugmentEditor.vue";
import QualityEditor from "./QualityEditor.vue";
import { getItemEditorType } from "../filters/util";
import { ItemCategory, ItemEditorType } from "@/parser/meta";
import { createVirtualItem } from "@/parser/ParsedItem";
import { ITEM_BY_REF } from "@/assets/data";

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
    },
  },
  components: {
    AugmentEditor,
    QualityEditor,
  },

  setup(props) {
    const actualItem = ref(
      props.item ??
        createVirtualItem({
          info: ITEM_BY_REF("ITEM", "Artillery Bow")![0],
          augmentSockets: {
            empty: 1,
            current: 2,
            normal: 2,
            augments: [ITEM_BY_REF("ITEM", "Greater Resolve Rune")![0], null],
          },
          category: ItemCategory.Bow,
        }),
    );

    const itemEditorType = computed(() => getItemEditorType(actualItem.value));

    return {
      actualItem,
      itemEditorType,
      ItemEditorType,
    };
  },
});
</script>

<style lang="postcss" module></style>
