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
import { BaseType } from "@/assets/data";

export default defineComponent({
  emits: ["update:selectedAugment"],
  props: {
    augments: {
      type: Array as PropType<BaseType[]>,
      required: true,
    },
    selectedAugment: {
      type: Object as PropType<BaseType | null>,
      required: true,
    },
  },
});
</script>
