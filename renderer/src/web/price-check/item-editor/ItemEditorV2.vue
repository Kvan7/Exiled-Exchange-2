<template>
  <div class="bg-gray-800">
    <augment-editor :item="item" />
    <quality-editor :item="item" />
  </div>
</template>

<script lang="ts">
import { ParsedItem } from "@/parser";
import { defineComponent, PropType } from "vue";
import AugmentEditor from "./AugmentEditor.vue";
import QualityEditor from "./QualityEditor.vue";

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
  },
  components: {
    AugmentEditor,
    QualityEditor,
  },
});
</script>

<style lang="postcss" module></style>
