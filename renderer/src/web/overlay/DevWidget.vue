<template>
  <!-- <div
    v-if="isDev"
    class="w-1/2 h-5/6 bg-purple-900 grid grid-cols-8 gap-1 p-4"
  >
    <ui-detailed-item-img
      v-for="(item, index) in items"
      :key="index"
      :icon="item.icon"
      :item-width="item.width"
      :item-height="item.height"
      :sockets="item.sockets"
      class="w-fit h-fit"
    />
  </div> -->
  <div v-if="isDev" class="bg-purple-900 w-fit h-fit">
    <item-editor-v2 :item="item" :filters="itemFilters" :stats="itemStats" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import UiDetailedItemImg from "@/web/ui/UiDetailedItemImg.vue";
import ItemEditorV2 from "@/web/price-check/item-editor/ItemEditorV2.vue";
import { createVirtualItem, ItemRarity } from "@/parser/ParsedItem";
import { FilterPreset } from "../price-check/filters/interfaces";
import { createPresets } from "../price-check/filters/create-presets";
import { ItemCategory } from "@/parser";
export default defineComponent({
  components: {
    UiDetailedItemImg,
    ItemEditorV2,
  },
  props: {
    text: {
      type: String,
      default: "Trade",
    },
  },
  // #region Image stuff
  // setup() {
  //   const inputItems: {
  //     icon: string;
  //     width: number;
  //     height: number;
  //     sockets?: { type: string; item?: string }[];
  //   }[] = [
  //     {
  //       icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvUmluZ3MvTGFrZVJpbmcxIiwidyI6MSwiaCI6MSwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/40b81baee3/LakeRing1.png",
  //       width: 1,
  //       height: 1,
  //     },
  //     {
  //       icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvV2VhcG9ucy9Ud29IYW5kV2VhcG9ucy9Dcm9zc2Jvd3MvMkhDcm9zc2JvdzA1IiwidyI6MiwiaCI6NCwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/28ab8c9744/2HCrossbow05.png",
  //       width: 2,
  //       height: 4,
  //       sockets: [
  //         { type: "rune" },
  //         { type: "rune" },
  //         { type: "rune" },
  //         { type: "rune" },
  //       ],
  //     },
  //     {
  //       icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQXJtb3Vycy9HbG92ZXMvQmFzZXR5cGVzL0dsb3Zlc1N0cjAzIiwidyI6MiwiaCI6Miwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/5a4d47e4f0/GlovesStr03.png",
  //       width: 2,
  //       height: 2,
  //       sockets: [{ type: "rune" }, { type: "rune" }, { type: "rune" }],
  //     },
  //     {
  //       icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQmVsdHMvQmFzZXR5cGVzL0JlbHQxMSIsInciOjIsImgiOjEsInNjYWxlIjoxLCJyZWFsbSI6InBvZTIifV0/10040b2473/Belt11.png",
  //       width: 2,
  //       height: 1,
  //       sockets: [{ type: "rune" }, { type: "rune" }],
  //     },
  //     {
  //       icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQXJtb3Vycy9Cb2R5QXJtb3Vycy9CYXNldHlwZXMvQm9keVN0cjAyIiwidyI6MiwiaCI6Mywic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/7996e5d86a/BodyStr02.png",
  //       width: 2,
  //       height: 3,
  //       sockets: [
  //         { type: "rune" },
  //         { type: "rune" },
  //         { type: "rune" },
  //         { type: "rune" },
  //         { type: "rune" },
  //       ],
  //     },
  //     {
  //       icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvV2VhcG9ucy9PbmVIYW5kV2VhcG9ucy9XYW5kcy9CYXNldHlwZXMvV2FuZDA2IiwidyI6MSwiaCI6Mywic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/ade4b84c31/Wand06.png",
  //       width: 1,
  //       height: 3,
  //       sockets: [{ type: "rune" }, { type: "rune" }],
  //     },
  //     {
  //       icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvV2VhcG9ucy9PbmVIYW5kV2VhcG9ucy9PbmVIYW5kU3BlYXJzLzFIU3BlYXIwNiIsInciOjEsImgiOjQsInNjYWxlIjoxLCJyZWFsbSI6InBvZTIifV0/2d898d5c1f/1HSpear06.png",
  //       width: 1,
  //       height: 4,
  //       sockets: [{ type: "rune" }, { type: "rune" }, { type: "rune" }],
  //     },
  //     {
  //       icon: "https://web.poecdn.com/gen/image/WzksMTQseyJmIjoiMkRJdGVtcy9GbGFza3MvVW5pcXVlcy9NZWx0aW5nTWFlbHN0cm9tIiwidyI6MSwiaCI6Miwic2NhbGUiOjEsInJlYWxtIjoicG9lMiIsImxldmVsIjoxfV0/3ffec91606/MeltingMaelstrom.png",
  //       width: 1,
  //       height: 2,
  //     },
  //   ];

  //   const maxSockets = Math.max(
  //     ...inputItems.map((i) => i.sockets?.length ?? 0),
  //   );

  //   const items = computed(() => {
  //     const rows = [];
  //     for (let socketCount = 0; socketCount <= maxSockets; socketCount++) {
  //       for (const item of inputItems) {
  //         rows.push({
  //           ...item,
  //           sockets: item.sockets?.slice(0, socketCount) ?? [],
  //         });
  //       }
  //     }
  //     return rows;
  //   });

  //   return { isDev: import.meta.env.DEV, items };
  // },
  // #endregion Image stuff
  // #region item editor
  setup() {
    const item = ref(
      createVirtualItem({
        category: ItemCategory.Bow,
        info: {
          name: "Obliterator Bow",
          refName: "Obliterator Bow",
          namespace: "ITEM",
          icon: "",
          tags: [],
        },
        rarity: ItemRarity.Magic,
        itemLevel: 75,
        weaponCRIT: 5,
        weaponAS: 1.1,
        weaponPHYSICAL: 108.5,
        quality: 20,
        augmentSockets: {
          empty: 2,
          current: 0,
          normal: 2,
          augments: [null, null],
        },
        isCorrupted: false,
        isUnidentified: false,
        statsByType: [],
        newMods: [],
      }),
    );

    const presets = ref<{ active: string; presets: FilterPreset[] }>(null!);
    const itemFilters = computed(
      () =>
        presets.value.presets.find(
          (preset) => preset.id === presets.value.active,
        )!.filters,
    );
    const itemStats = computed(
      () =>
        presets.value.presets.find(
          (preset) => preset.id === presets.value.active,
        )!.stats,
    );

    watch(
      () => item,
      (item) => {
        performance.mark("checked-item-item-changed");
        presets.value = createPresets(item.value, {
          league: "Standard",
          collapseListings: "app",
          activateStockFilter: true,
          searchStatRange: 10,
          useEn: true,
          currency: undefined,
          listingType: undefined,
          defaultAllSelected: false,
        });

        performance.mark("checked-item-switch-item-end");
      },
      { immediate: true, deep: true },
    );

    return { isDev: import.meta.env.DEV, item, itemFilters, itemStats };
  },
  // #endregion item editor
});
</script>
