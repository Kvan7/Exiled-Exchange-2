<template>
  <div
    class="hover:bg-gray-700 rounded flex items-center overflow-hidden px-1 cursor-pointer"
    :class="[selected ? ' bg-gray-900 border' : '']"
  >
    <div class="flex items-center justify-center shrink-0 w-8 h-8">
      <slot>
        <img
          :src="item.icon === '%NOT_FOUND%' ? '/images/404.png' : item.icon"
          class="max-w-full max-h-full"
        />
      </slot>
    </div>
    <div class="mb-1 pl-1">
      <div class="text-left text-gray-500 whitespace-nowrap">
        {{ item.name }}
      </div>
      <div class="text-left whitespace-pre-line text-wrap break-words">
        {{ item.displayString }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { EditorItem } from "@/parser/ParsedItem";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  emits: ["update:modelValue"],
  props: {
    item: {
      type: Object as PropType<EditorItem>,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },
});
</script>
