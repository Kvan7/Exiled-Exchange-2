<template>
  <!-- <item-editor-item
    v-for="augment in augments"
    :key="augment.displayString"
    :item="augment"
    :selected="augment.refName === selectedAugment.refName"
    @click="$emit('update:selectedAugment', augment)"
    class="m-1"
  /> -->

  <div
    v-for="augment in augments"
    :key="augment.displayString"
    @click="$emit('update:selectedAugment', augment)"
    class="m-1"
  >
    <item-editor-item
      :item="augment"
      :selected="augment.refName === selectedAugment?.refName"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { EditorItem } from "./augment";
import ItemEditorItem from "./ItemEditorItem.vue";

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
