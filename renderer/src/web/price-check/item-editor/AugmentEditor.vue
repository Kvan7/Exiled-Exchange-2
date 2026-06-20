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
          :onclick="() => print(augment)"
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
import { BaseType, ITEM_BY_REF } from "@/assets/data";
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
    return {
      currentAugments,
      print: (augment: BaseType) => console.log(augment),
    };
  },
});
</script>

<style lang="postcss" module></style>
