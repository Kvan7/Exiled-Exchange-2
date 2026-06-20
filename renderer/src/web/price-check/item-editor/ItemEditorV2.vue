<template>
  <div class="bg-gray-800 text-gray-200">
    <augment-editor
      v-if="itemEditorType === ItemEditorType.Augment"
      :item="item"
      :filters="filters"
      :stats="stats"
    />
    <quality-editor
      v-else-if="itemEditorType === ItemEditorType.Catalyst"
      :item="item"
      :filters="filters"
      :stats="stats"
    />
    <div v-else-if="itemEditorType === ItemEditorType.AugmentAndCatalyst">
      AAAAA DO BOTH NEED TO ADD IT STILL
    </div>
  </div>
</template>

<script lang="ts">
import { ParsedItem } from "@/parser";
import { computed, defineComponent, PropType } from "vue";
import AugmentEditor from "./AugmentEditor.vue";
import QualityEditor from "./QualityEditor.vue";
import { getItemEditorType } from "./item-editor";
import { ItemEditorType } from "@/parser/meta";
import { ItemFilters, StatFilter } from "@/web/price-check/filters/interfaces";

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
    },
    filters: {
      type: Object as PropType<ItemFilters>,
    },
    stats: {
      type: Array as PropType<StatFilter[]>,
    },
  },
  components: {
    AugmentEditor,
    QualityEditor,
  },

  setup(props) {
    const itemEditorType = computed(() =>
      props.item ? getItemEditorType(props.item) : undefined,
    );

    return {
      itemEditorType,
      ItemEditorType,
    };
  },
});
</script>

<style lang="postcss" module></style>
