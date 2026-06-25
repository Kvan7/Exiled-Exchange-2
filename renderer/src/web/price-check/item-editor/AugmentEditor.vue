<template>
  <div v-if="item?.augmentSockets" class="p-2">
    <div class="flex flex-row justify-between">
      <div class="grid grid-cols-6 gap-2">
        <!-- List of current augments -->
        <template
          v-for="(augment, index) of item.augmentSockets.augments"
          :key="`${index}+${augment?.refName}`"
        >
          <div
            class="rounded-full bg-opacity-50 border-2 border-transparent"
            :class="{
              'hover:bg-gray-700 hover:border-gray-500 cursor-pointer':
                selectedAugment && (augment === null || !augment.socketBound),
              'border-red-900 cursor-not-allowed': augment?.socketBound,
            }"
          >
            <img
              :src="
                augment ? augment.icon : '/images/augments/empty-socket.png'
              "
              :title="augment?.name"
              class="w-8 h-8"
              :onclick="() => replaceAugment(index)"
            />
          </div>
        </template>
      </div>
      <div class="flex items-center gap-x-1">
        <!-- price of augments -->
        <i class="fas fa-arrow-right text-gray-600 px-1 text-sm" />
        <item-sum-price
          :items="
            item.augmentSockets.augments.map((augment) =>
              augment ? augment.baseItem : null,
            )
          "
        />
      </div>
    </div>
    <hr class="my-2 border-gray-700" />
    <div>
      <!-- augment adding section -->
      <ui-tabs
        v-if="displayGroups"
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
                :augments="displayGroups.Rune.Lesser"
                v-model:selectedAugment="selectedAugment"
              />
              <augments-list
                v-else-if="selected === 'Normal'"
                :augments="displayGroups.Rune.Normal"
                v-model:selectedAugment="selectedAugment"
              />
              <augments-list
                v-else-if="selected === 'Greater'"
                :augments="displayGroups.Rune.Greater"
                v-model:selectedAugment="selectedAugment"
              />
              <augments-list
                v-else-if="selected === 'Perfect'"
                :augments="displayGroups.Rune.Perfect"
                v-model:selectedAugment="selectedAugment"
              />
              <augments-list
                v-else-if="selected === 'Other'"
                :augments="displayGroups.Rune.Other"
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
                :augments="displayGroups.SoulCore.Normal"
                v-model:selectedAugment="selectedAugment"
              />
              <augments-list
                v-else-if="selected === 'Special'"
                :augments="displayGroups.SoulCore.Special"
                v-model:selectedAugment="selectedAugment"
              />
            </template>
          </ui-tabs>
          <augments-list
            v-else-if="selected === 'Idol'"
            :augments="displayGroups.Idol"
            v-model:selectedAugment="selectedAugment"
          />
          <augments-list
            v-else-if="selected === 'Legacy'"
            :augments="displayGroups.Legacy"
            v-model:selectedAugment="selectedAugment"
          />
          <augments-list
            v-else-if="selected === 'Other'"
            :augments="displayGroups.Other"
            v-model:selectedAugment="selectedAugment"
          />
        </template>
      </ui-tabs>
    </div>
    <!-- <div>hey do something</div> -->
  </div>
  <div v-else class="bg-purple-700 text-green-600 border border-green-600">
    no augments available for item
  </div>
</template>

<script lang="ts">
import { AugmentGroup, GROUPED_AUGMENTS, ITEM_BY_REF } from "@/assets/data";
import { ItemCategory, ParsedItem } from "@/parser";
import { defineComponent, PropType, ref, shallowRef, watch } from "vue";
import ItemSumPrice from "@/web/ui/ItemSumPrice.vue";
import UiTabs from "@/web/ui/UiTabs.vue";
import AugmentsList from "./AugmentsList.vue";
import { useAugment, getCategoryGroups } from "./augment";
import { AppConfig } from "@/web/Config";
import { EditorItem } from "@/parser/ParsedItem";
import { buildEditorItems } from "@/parser/augment-builder";

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
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

    const selectedAugment = shallowRef<EditorItem | undefined>(
      // TODO: see if this can be better
      buildEditorItems(
        [ITEM_BY_REF("ITEM", "Greater Iron Rune")![0]],
        props.item?.category ?? ItemCategory.Unknown,
      )[0],
    );

    const augmentCache = new Map<ItemCategory, AugmentGroup<EditorItem>>();
    const displayGroups = ref<AugmentGroup<EditorItem> | null>(null);

    watch(
      () => AppConfig().language,
      (curr, prev) => {
        if (curr === prev) return;
        // clear cache
        augmentCache.clear();
        displayGroups.value = null;
      },
      { immediate: true },
    );

    watch(
      () => props.item?.category,
      (curr, prev) => {
        if (curr === prev && displayGroups.value) return;
        if (!curr) {
          displayGroups.value = null;
          return;
        }

        const augment = augmentCache.get(curr);
        if (augment) {
          displayGroups.value = augment;
          return;
        }

        // have category, cache miss => load data
        const augmentData = getCategoryGroups(GROUPED_AUGMENTS, curr);
        augmentCache.set(curr, augmentData);
        displayGroups.value = augmentData;
      },
      { immediate: true },
    );

    return {
      mainTab,
      runeTab,
      soulCoreTab,
      selectedAugment,
      displayGroups,
      replaceAugment: (index: number) => {
        if (
          !props.item?.augmentSockets ||
          !selectedAugment.value ||
          props.item.augmentSockets.augments[index]?.socketBound
        )
          return;

        // replace augment
        useAugment(props.item, selectedAugment.value, index);
      },
      selectAugment: (augment: EditorItem) => {
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
