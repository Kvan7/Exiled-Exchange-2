<template>
  <item-quick-price v-if="result" :price="result.price" currency-text>
    <template #item>
      <div class="flex">
        <img
          v-for="oil in result.oils"
          class="w-8 h-8"
          :title="oil.name"
          :src="
            oil.icon === '%NOT_FOUND%' || oil.icon === ''
              ? '/images/404.png'
              : oil.icon
          "
        />
      </div>
    </template>
  </item-quick-price>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { StatFilter } from "./interfaces";
import { usePoeninja } from "@/web/background/Prices";
import { ITEM_BY_REF } from "@/assets/data";
import ItemQuickPrice from "@/web/ui/ItemQuickPrice.vue";

export default defineComponent({
  components: { ItemQuickPrice },
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true,
    },
  },
  setup(props) {
    const { findPriceByQuery, autoCurrency } = usePoeninja();

    const result = computed(() => {
      if (!props.filter.oils) return null;

      const oils = props.filter.oils.map(
        (oilName) => ITEM_BY_REF("ITEM", oilName)![0],
      );

      let totalDiv: number | undefined = 0;
      for (const oil of oils) {
        if (!oil) return null;
        const price = findPriceByQuery({
          ns: "ITEM",
          name: oil.refName,
        });
        if (price) {
          totalDiv += price.primaryValue;
        } else {
          totalDiv = undefined;
          break;
        }
      }

      return {
        oils: oils.map((item) => ({ icon: item!.icon, name: item!.name })),
        price: totalDiv != null ? autoCurrency(totalDiv) : undefined,
      };
    });

    return { result };
  },
});
</script>
