<template>
  <div v-if="item.augmentSockets">
    <div class="flex flex-row justify-between p-2">
      <div class="grid grid-cols-6 gap-2">
        <!-- List of current augments -->
        <template
          v-for="(augment, index) of item.augmentSockets?.augments"
          :key="`${index}+${augment?.refName}`"
        >
          <div
            class="rounded-full bg-opacity-50 border-2 border-transparent"
            :class="{
              'hover:bg-gray-700 hover:border-gray-500 cursor-pointer':
                selectedAugment,
            }"
          >
            <img
              v-if="augment"
              class="w-8 h-8"
              :src="augment.icon"
              :title="augment.name"
              :onclick="() => replaceAugment(index)"
            />
            <img
              v-else
              src="/images/augments/empty-socket.png"
              class="w-8 h-8"
              :onclick="() => replaceAugment(index)"
            />
          </div>
        </template>
      </div>
      <div class="flex items-center gap-x-1">
        <!-- price of augments -->
        <i class="fas fa-arrow-right text-gray-600 px-1 text-sm" />
        <item-sum-price :items="item.augmentSockets?.augments" />
      </div>
    </div>
    <div>
      <!-- augment adding section -->
      <ui-tabs
        v-model="mainTab"
        :tabs="['Rune', 'Soul Core', 'Idol', 'Legacy', 'Other']"
      >
        <template #default="{ selected }">
          <ui-tabs
            v-if="selected === 'Rune'"
            v-model="runeTab"
            :tabs="['Lesser', 'Normal', 'Greater', 'Perfect', 'Other']"
          >
            <template #default="{ selected }">
              <augments-list
                v-if="selected === 'Lesser'"
                :augments="GROUPED_AUGMENTS.Rune.Lesser"
                v-model:selectedAugment="selectedAugment"
              />
              <augments-list
                v-else-if="selected === 'Normal'"
                :augments="GROUPED_AUGMENTS.Rune.Normal"
                v-model:selectedAugment="selectedAugment"
              />
              <augments-list
                v-else-if="selected === 'Greater'"
                :augments="GROUPED_AUGMENTS.Rune.Greater"
                v-model:selectedAugment="selectedAugment"
              />
              <augments-list
                v-else-if="selected === 'Perfect'"
                :augments="GROUPED_AUGMENTS.Rune.Perfect"
                v-model:selectedAugment="selectedAugment"
              />
              <augments-list
                v-else-if="selected === 'Other'"
                :augments="GROUPED_AUGMENTS.Rune.Other"
                v-model:selectedAugment="selectedAugment"
              />
            </template>
          </ui-tabs>
          <ui-tabs
            v-else-if="selected === 'Soul Core'"
            v-model="soulCoreTab"
            :tabs="['Normal', 'Special']"
          >
            <template #default="{ selected }">
              <augments-list
                v-if="selected === 'Normal'"
                :augments="GROUPED_AUGMENTS.SoulCore.Normal"
                v-model:selectedAugment="selectedAugment"
              />
              <augments-list
                v-else-if="selected === 'Special'"
                :augments="GROUPED_AUGMENTS.SoulCore.Special"
                v-model:selectedAugment="selectedAugment"
              />
            </template>
          </ui-tabs>
          <augments-list
            v-else-if="selected === 'Idol'"
            :augments="GROUPED_AUGMENTS.Idol"
            v-model:selectedAugment="selectedAugment"
          />
          <augments-list
            v-else-if="selected === 'Legacy'"
            :augments="GROUPED_AUGMENTS.Legacy"
            v-model:selectedAugment="selectedAugment"
          />
          <augments-list
            v-else-if="selected === 'Other'"
            :augments="GROUPED_AUGMENTS.Other"
            v-model:selectedAugment="selectedAugment"
          />
        </template>
      </ui-tabs>
    </div>
  </div>
  <div v-else class="bg-purple-700 text-green-600 border border-green-600">
    no augments available for item
  </div>
</template>

<script lang="ts">
import {
  AUGMENT_LIST,
  BaseType,
  GROUPED_AUGMENTS,
  ITEM_BY_REF,
} from "@/assets/data";
import { ParsedItem } from "@/parser";
import { defineComponent, PropType, shallowRef } from "vue";
import ItemSumPrice from "@/web/ui/ItemSumPrice.vue";
import UiTabs from "@/web/ui/UiTabs.vue";
import AugmentsList from "./AugmentsList.vue";

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
  },
  components: {
    AugmentsList,
    ItemSumPrice,
    UiTabs,
  },
  setup(props) {
    const mainTab = shallowRef("Rune");
    const runeTab = shallowRef("Greater");
    const soulCoreTab = shallowRef("Normal");

    const selectedAugment = shallowRef<BaseType | null>(
      ITEM_BY_REF("ITEM", "Iron Rune")![0],
    );

    console.log(AUGMENT_LIST);
    console.log(GROUPED_AUGMENTS);
    console.log(props.item.augmentSockets?.augments);
    return {
      mainTab,
      runeTab,
      soulCoreTab,
      selectedAugment,
      GROUPED_AUGMENTS,
      replaceAugment: (index: number) => {
        if (!props.item.augmentSockets) return;
        props.item.augmentSockets.augments![index] = selectedAugment.value;
        console.log(props.item.augmentSockets.augments);
      },
      selectAugment: (augment: BaseType) => {
        selectedAugment.value = augment;
      },
    };
  },
});
</script>

<style lang="postcss" module>
.golden {
  color: #e4c29a;
}
</style>
