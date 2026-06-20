<template>
  <div>
    <div class="flex mb-2 gap-px">
      <button
        v-for="(tab, index) in tabs"
        :key="tab"
        @click="updateTab(tab)"
        class="px-2 py-1 text-gray-400 leading-none"
        :class="{
          'bg-gray-900': modelValue === tab,
          'bg-gray-700': modelValue !== tab,
          'rounded-l': index === 0,
          'rounded-r': index === tabs.length - 1,
        }"
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

<style lang="postcss" module></style>
