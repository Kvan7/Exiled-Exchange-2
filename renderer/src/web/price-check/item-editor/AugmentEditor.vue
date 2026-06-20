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
      <div class="flex items-center gap-x-1">
        <!-- price of augments -->
        <i class="fas fa-arrow-right text-gray-600 px-1 text-sm" />
        <item-sum-price :items="currentAugments" />
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
import ItemSumPrice from "@/web/ui/ItemSumPrice.vue";

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
  },
  components: {
    ItemSumPrice,
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

<style lang="postcss" module>
.golden {
  color: #e4c29a;
}
</style>
