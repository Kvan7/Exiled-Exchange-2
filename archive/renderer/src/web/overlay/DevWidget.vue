<template>
  <div
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
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import UiDetailedItemImg from "@/web/ui/UiDetailedItemImg.vue";

export default defineComponent({
  components: {
    UiDetailedItemImg,
  },
  props: {
    text: {
      type: String,
      default: "Trade",
    },
  },
  setup() {
    const inputItems: {
      icon: string;
      width: number;
      height: number;
      sockets?: { type: string; item?: string }[];
    }[] = [
      {
        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvUmluZ3MvTGFrZVJpbmcxIiwidyI6MSwiaCI6MSwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/40b81baee3/LakeRing1.png",
        width: 1,
        height: 1,
      },
      {
        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvV2VhcG9ucy9Ud29IYW5kV2VhcG9ucy9Dcm9zc2Jvd3MvMkhDcm9zc2JvdzA1IiwidyI6MiwiaCI6NCwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/28ab8c9744/2HCrossbow05.png",
        width: 2,
        height: 4,
        sockets: [
          { type: "rune" },
          { type: "rune" },
          { type: "rune" },
          { type: "rune" },
        ],
      },
      {
        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQXJtb3Vycy9HbG92ZXMvQmFzZXR5cGVzL0dsb3Zlc1N0cjAzIiwidyI6MiwiaCI6Miwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/5a4d47e4f0/GlovesStr03.png",
        width: 2,
        height: 2,
        sockets: [{ type: "rune" }, { type: "rune" }, { type: "rune" }],
      },
      {
        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQmVsdHMvQmFzZXR5cGVzL0JlbHQxMSIsInciOjIsImgiOjEsInNjYWxlIjoxLCJyZWFsbSI6InBvZTIifV0/10040b2473/Belt11.png",
        width: 2,
        height: 1,
        sockets: [{ type: "rune" }, { type: "rune" }],
      },
      {
        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQXJtb3Vycy9Cb2R5QXJtb3Vycy9CYXNldHlwZXMvQm9keVN0cjAyIiwidyI6MiwiaCI6Mywic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/7996e5d86a/BodyStr02.png",
        width: 2,
        height: 3,
        sockets: [
          { type: "rune" },
          { type: "rune" },
          { type: "rune" },
          { type: "rune" },
          { type: "rune" },
        ],
      },
      {
        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvV2VhcG9ucy9PbmVIYW5kV2VhcG9ucy9XYW5kcy9CYXNldHlwZXMvV2FuZDA2IiwidyI6MSwiaCI6Mywic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/ade4b84c31/Wand06.png",
        width: 1,
        height: 3,
        sockets: [{ type: "rune" }, { type: "rune" }],
      },
      {
        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvV2VhcG9ucy9PbmVIYW5kV2VhcG9ucy9PbmVIYW5kU3BlYXJzLzFIU3BlYXIwNiIsInciOjEsImgiOjQsInNjYWxlIjoxLCJyZWFsbSI6InBvZTIifV0/2d898d5c1f/1HSpear06.png",
        width: 1,
        height: 4,
        sockets: [{ type: "rune" }, { type: "rune" }, { type: "rune" }],
      },
      {
        icon: "https://web.poecdn.com/gen/image/WzksMTQseyJmIjoiMkRJdGVtcy9GbGFza3MvVW5pcXVlcy9NZWx0aW5nTWFlbHN0cm9tIiwidyI6MSwiaCI6Miwic2NhbGUiOjEsInJlYWxtIjoicG9lMiIsImxldmVsIjoxfV0/3ffec91606/MeltingMaelstrom.png",
        width: 1,
        height: 2,
      },
    ];

    const maxSockets = Math.max(
      ...inputItems.map((i) => i.sockets?.length ?? 0),
    );

    const items = computed(() => {
      const rows = [];
      for (let socketCount = 0; socketCount <= maxSockets; socketCount++) {
        for (const item of inputItems) {
          rows.push({
            ...item,
            sockets: item.sockets?.slice(0, socketCount) ?? [],
          });
        }
      }
      return rows;
    });

    return { isDev: import.meta.env.DEV, items };
  },
});
</script>
