<template>
  <div>
    <div>
      <!-- current quality -->
      <div></div>
      <div></div>
    </div>
    <div></div>
  </div>
</template>

<script lang="ts">
import { ParsedItem } from "@/parser";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
    },
  },
});
</script>

<style lang="postcss" module></style>
