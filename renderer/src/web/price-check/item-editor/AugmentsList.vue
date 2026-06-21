<template>
  <item-editor-item
    v-for="augment in augments"
    :key="augment.displayString"
    :item="augment"
    :selected="augment.refName === selectedAugment?.refName"
    @click="$emit('update:selectedAugment', augment)"
    class="m-1"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

import ItemEditorItem from "./ItemEditorItem.vue";
import { EditorItem } from "@/parser/ParsedItem";

export default defineComponent({
  emits: ["update:selectedAugment"],
  components: { ItemEditorItem },
  props: {
    augments: {
      type: Array as PropType<EditorItem[]>,
      required: true,
    },
    selectedAugment: {
      type: Object as PropType<EditorItem>,
    },
  },
});
</script>
