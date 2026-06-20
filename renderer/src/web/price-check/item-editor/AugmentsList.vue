<template>
  <div
    v-for="augment in augments"
    :key="augment.refName"
    @click="$emit('update:selectedAugment', augment)"
    class="m-2 border"
    :class="{
      'bg-red-400': augment.refName === selectedAugment?.refName,
    }"
  >
    {{ augment.name }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { EditorItem } from "./augment";

export default defineComponent({
  emits: ["update:selectedAugment"],
  props: {
    augments: {
      type: Array as PropType<EditorItem[]>,
      required: true,
    },
    selectedAugment: {
      type: Object as PropType<EditorItem | undefined>,
      required: true,
    },
  },
});
</script>
