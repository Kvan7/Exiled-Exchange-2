<template>
  <div>
    <div>
      <div>
        <!-- List of current augments -->
        <img
          v-for="(augment, index) of currentAugments"
          :src="augment.icon"
          :key="index + augment.refName"
          :title="augment.name"
          @click="console.log(augment)"
        />
      </div>
      <div>
        <!-- price of augments -->
      </div>
    </div>
    <div>
      <!-- augment adding section -->
    </div>
  </div>
</template>

<script lang="ts">
import { ITEM_BY_REF } from "@/assets/data";
import { ParsedItem } from "@/parser";
import { computed, defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
  },
  setup(props) {
    const currentAugments = computed(() => {
      const socketed = props.item.augmentSockets?.augments ?? [];
      return socketed.map((aug) => {
        // swap item_by_ref for augment specific one
        return ITEM_BY_REF("ITEM", aug)![0];
      });
    });

    console.log(currentAugments.value);
    return { currentAugments };
  },
});
</script>

<style lang="postcss" module></style>
