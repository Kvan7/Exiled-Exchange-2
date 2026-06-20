<template>
  <div>
    <div class="flex gap-2">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="updateTab(tab)"
        :class="{ active: modelValue === tab }"
      >
        {{ tab }}
      </button>
    </div>

    <slot :selected="modelValue" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "UiTabs",
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    tabs: {
      type: Array as () => string[],
      required: true,
    },
  },
  emits: ["update:modelValue"],
  setup(_, { emit }) {
    return {
      updateTab(tab: string) {
        emit("update:modelValue", tab);
      },
    };
  },
});
</script>
