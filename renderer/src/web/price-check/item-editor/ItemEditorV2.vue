<template>
  <div class="bg-gray-800 text-gray-200 min-w-96 max-w-96">
    <augment-editor
      v-if="itemEditorType === ItemEditorType.Augment"
      :item="item"
    />
    <quality-editor
      v-else-if="itemEditorType === ItemEditorType.Catalyst"
      :item="item"
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
