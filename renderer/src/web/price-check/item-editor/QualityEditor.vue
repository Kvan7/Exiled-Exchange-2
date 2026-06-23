<template>
  <div v-if="active" class="p-2">
    <div class="flex flex-row justify-between content-center">
      <div class="flex flex-row gap-x-2">
        <div class="flex gap-px items-center mx-2">
          <button
            v-for="(value, index) in amountOptions"
            :key="value"
            @click="selectedAmount = value"
            class="px-2 py-1 text-gray-400 leading-none h-6"
            :class="{
              'bg-gray-900': selectedAmount === value,
              'bg-gray-700': selectedAmount !== value,
              'rounded-l': index === 0,
              'rounded-r': index === amountOptions.length - 1,
            }"
          >
            {{ value }}
          </button>
        </div>
      </div>
      <div class="flex items-center gap-x-1">
        <!-- price of augments -->
        <item-quick-price
          :item-img="selectedCatalyst?.icon"
          :price="totalPrice"
        />
      </div>
    </div>
    <hr class="my-2 border-gray-700" />
    <div>
      <div class="overflow-y-auto max-h-96">
        <item-editor-item
          v-for="item in result"
          :key="item.displayString"
          :item="item"
          :selected="item.refName === selectedCatalyst?.refName"
          class="m-1"
          @click="selectCatalyst(item)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { BaseType, CATALYST_TO_TAG, CATALYST_TYPES } from "@/assets/data";
import { ItemCategory, ParsedItem } from "@/parser";
import { ItemEditorType } from "@/parser/meta";
import { EditorItem, itemIsModifiable } from "@/parser/ParsedItem";
import { computed, defineComponent, PropType, shallowRef, watch } from "vue";
import { applyCatalyst, getItemEditorType } from "./item-editor";
import ItemQuickPrice from "@/web/ui/ItemQuickPrice.vue";
import { usePoeninja } from "@/web/background/Prices";
import { AppConfig } from "@/web/Config";
import ItemEditorItem from "./ItemEditorItem.vue";

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
    },
  },
  components: {
    ItemQuickPrice,
    ItemEditorItem,
  },
  setup(props) {
    const { findPriceByQuery, autoCurrency } = usePoeninja();

    const selectedCatalyst = shallowRef<BaseType | undefined>(undefined);
    const selectedAmount = shallowRef<0 | 20 | 30 | 40 | 50 | 60 | 70>(20);
    const amountOptions = shallowRef<Array<0 | 20 | 30 | 40 | 50 | 60 | 70>>([
      0, 20, 30, 40, 50,
    ]);
    const totalPrice = shallowRef<{
      min: number;
      max: number;
      currency: string;
    }>({
      min: 0,
      max: 0,
      currency: "ex",
    });

    const catalystCache = new Map<ItemCategory, EditorItem[]>();

    watch(
      () => AppConfig().language,
      () => {
        catalystCache.clear();
      },
    );

    const result = computed(() => {
      if (!props.item) return [];

      const items: EditorItem[] = [];

      const category = props.item.category;
      if (!category) return [];
      if (catalystCache.has(category)) {
        return catalystCache.get(category)!;
      }
      if (getItemEditorType(props.item) === ItemEditorType.Catalyst) {
        const catalysts =
          props.item.category === ItemCategory.Jewel
            ? CATALYST_TYPES.Refined
            : CATALYST_TYPES.Normal;
        for (const catalyst of catalysts) {
          items.push({
            name: catalyst.name,
            refName: catalyst.refName,
            icon: catalyst.icon,
            displayString: CATALYST_TO_TAG[catalyst.tags[1]].join(", "),
            stats: [],
            baseItem: catalyst,
          });
        }
      }

      catalystCache.set(category, items);

      return items;
    });

    watch(
      () => props.item,
      (newItem) => {
        if (newItem) {
          selectedCatalyst.value = undefined;

          if (newItem.info.refName === "Breach Ring") {
            selectedAmount.value = 40;
            amountOptions.value = [0, 20, 30, 40, 50, 60, 70];
          } else {
            selectedAmount.value = 20;
            amountOptions.value = [0, 20, 30, 40, 50];
          }

          // if (newItem.qualityType && newItem.quality) {
          //   const catalysts =
          //     newItem.category === ItemCategory.Jewel
          //       ? CATALYST_TYPES.Refined
          //       : CATALYST_TYPES.Normal;
          //   selectedCatalyst.value = catalysts.find(
          //     (c) => c.tags[1] === newItem.qualityType,
          //   );
          //   if (selectedCatalyst.value) {
          //     selectedAmount.value = newItem.quality;
          //   }
          // }
        }
      },
      { immediate: true },
    );

    watch(
      () => [selectedAmount.value, selectedCatalyst.value],
      () => {
        if (!selectedCatalyst.value || !props.item) return;
        applyCatalyst(props.item, selectedCatalyst.value, selectedAmount.value);

        const price = findPriceByQuery({
          ns: "ITEM",
          name: selectedCatalyst.value.name,
        });

        if (!price) {
          totalPrice.value = { min: 0, max: 0, currency: "ex" };
          return;
        }

        const sumPrice = price.primaryValue * selectedAmount.value;
        const currencyPrice = autoCurrency(sumPrice);
        totalPrice.value = currencyPrice;
      },
    );

    return {
      selectedCatalyst,
      selectedAmount,
      amountOptions,
      result,
      totalPrice,
      selectCatalyst(item: EditorItem) {
        selectedCatalyst.value = item.baseItem;
      },
      active: computed(() => {
        return (
          props.item &&
          itemIsModifiable(props.item) &&
          getItemEditorType(props.item) === ItemEditorType.Catalyst
        );
      }),
    };
  },
});
</script>

<style lang="postcss" module></style>
