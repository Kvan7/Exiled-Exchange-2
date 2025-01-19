<template>
  <div class="flex flex-col p-1 bg-gray-800 text-indigo-400 text-center">
    <template v-for="(section, index) in sections">
      <div v-if="section.content" :key="index">
        <div
          v-for="mod in section.content"
          :key="mod"
          class="flex items-center justify-between"
        >
          <span
            v-if="section.key === 'corrupted'"
            class="flex-grow text-center text-red-600"
          >
            {{ mod }}
          </span>
          <span v-else class="flex-grow text-center">{{ mod }}</span>
          <!-- <span class="ml-2 text-gray-400">▲</span> -->
        </div>
      </div>
      <div v-if="shouldShowDivider(index)" class="divider"></div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { PricingResult } from "./pathofexile-trade";

export default defineComponent({
  props: {
    result: {
      type: Object as PropType<PricingResult>,
      required: true,
    },
  },
  setup(props) {
    const item = props.result.displayItem;
    const sections = [
      { key: "runeMods", content: item.runeMods },
      { key: "implicitMods", content: item.implicitMods },
      { key: "explicitMods", content: item.explicitMods },
      { key: "pseudoMods", content: item.pseudoMods },
      {
        key: "corrupted",
        content: props.result.corrupted ? ["Corrupted"] : [],
      },
    ];

    function shouldShowDivider(currentIndex: number) {
      return (
        sections[currentIndex].content &&
        sections
          .slice(currentIndex + 1)
          .some((section) => section.content && section.content.length > 0)
      );
    }
    return {
      item,
      sections,
      shouldShowDivider,
    };
  },
});
</script>

<style lang="postcss">
.divider {
  @apply h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-transparent my-1;
}

.mod {
  @apply text-sm;
}
</style>
