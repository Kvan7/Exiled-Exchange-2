<template>
  <div
    class="max-w-full max-h-full"
    :class="{ 'overflow-hidden': overflowHidden }"
  >
    <ui-item-img :icon="icon" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import UiItemImg from "@/web/ui/UiItemImg.vue";

export default defineComponent({
  components: {
    UiItemImg,
  },
  props: {
    currency: {
      type: String,
      required: true,
    },
    overflowHidden: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const icon = computed(() => {
      switch (props.currency.toLowerCase().charAt(0)) {
        case "d":
          return "/images/divine.png";
        case "c":
          return "/images/chaos.png";
        case "e":
          return "/images/exa.png";
        case "a":
          return "/images/annul.png";
        default:
          return "/images/404.png";
      }
    });

    return {
      icon,
    };
  },
});
</script>
