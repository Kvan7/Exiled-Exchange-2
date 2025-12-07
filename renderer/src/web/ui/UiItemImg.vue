<template>
  <img
    :src="icon === '%NOT_FOUND%' || icon === '' ? '/images/404.png' : icon"
    class="max-w-full max-h-full"
    :class="{ 'overflow-hidden': overflowHidden }"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    icon: {
      type: String,
      required: true,
    },
    overflowHidden: {
      type: Boolean,
      default: false,
    },
  },
});
</script>
