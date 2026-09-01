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
    <hr class="my-2 border-gray-700" />
    <div class="flex flex-row justify-between">
      <div class="flex flex-row gap-1">
        <div>{{ t(":save_type") }}</div>
        <select v-model="saveType" class="p-1 rounded bg-gray-700 w-32">
          <option value="class">
            {{ item.info.craftable?.category ?? "Unknown" }}
          </option>
          <option value="casterWeapon">{{ t(":caster_weapon") }}</option>
          <option value="maritalWeapon">{{ t(":marital_weapon") }}</option>
          <option value="spectre">{{ t(":spectre") }}</option>
          <option value="armour">{{ t(":armour") }}</option>
          <option value="all">{{ t(":all") }}</option>
        </select>
      </div>
      <div class="flex flex-row gap-1">
        <button
          @click="handleClear"
          class="btn border-red-700 border-2 active:bg-gray-900"
        >
          {{ t(":clear") }}
        </button>

        <button
          v-if="saveButtonState === 'save'"
          @click="handleSave"
          class="btn active:bg-gray-900"
        >
          {{ t(":save") }}
        </button>
        <button
          v-else-if="saveButtonState === 'confirm'"
          class="btn bg-green-500 active:bg-green-900"
        >
          {{ t(":confirm") }}
        </button>
      </div>
    </div>
  </div>
  <div v-else class="bg-purple-700 text-green-600 border border-green-600">
    no augments available for item
  </div>
</template>

<script lang="ts">
import { AugmentGroup, GROUPED_AUGMENTS, ITEM_BY_REF } from "@/assets/data";
import { ItemCategory, ParsedItem } from "@/parser";
import {
  computed,
  defineComponent,
  PropType,
  ref,
  shallowRef,
  watch,
} from "vue";
import ItemSumPrice from "@/web/ui/ItemSumPrice.vue";
import UiTabs from "@/web/ui/UiTabs.vue";
import AugmentsList from "./AugmentsList.vue";
import { useAugment, getCategoryGroups } from "./augment";
import { AppConfig } from "@/web/Config";
import { EditorItem } from "@/parser/ParsedItem";
import { buildEditorItems } from "@/parser/augment-builder";
import { AugmentSaveType } from "./item-editor";
import { useI18nNs } from "@/web/i18n";
import { PriceCheckWidget } from "@/web/overlay/widgets";

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

    const saveType = shallowRef<AugmentSaveType>(AugmentSaveType.Class);
    const saveButtonState = shallowRef<"save" | "confirm">("save");

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
    const savedConfig = computed(
      () => AppConfig<PriceCheckWidget>("PriceCheckWidget")!.savedAugments,
    );

    function getSaveType() {
      switch (saveType.value) {
        case AugmentSaveType.Class:
          return props.item?.info.craftable?.category ?? "Unknown";
        case AugmentSaveType.CasterWeapon:
          return "casterWeapon";
        case AugmentSaveType.MaritalWeapon:
          return "maritalWeapon";
        case AugmentSaveType.Spectre:
          return "spectre";
        case AugmentSaveType.Armour:
          return "armour";
        case AugmentSaveType.All:
          return "all";
        default:
          return props.item?.info.craftable?.category ?? "Unknown";
      }
    }

    function handleSave() {
      const s = getSaveType();
      savedConfig.value[s] =
        props.item?.augmentSockets?.augments.map((a) => a?.refName ?? null) ??
        [];
    }
    function handleClear() {
      const s = getSaveType();
      savedConfig.value[s] = [];
    }

    const { t } = useI18nNs("item_editor");

    return {
      t,
      mainTab,
      runeTab,
      soulCoreTab,
      selectedAugment,
      displayGroups,
      saveType,
      saveButtonState,
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
      handleSave,
      handleClear,
    };
  },
});
</script>

<style lang="postcss" module>
.golden {
  color: #e4c29a;
}
</style>
