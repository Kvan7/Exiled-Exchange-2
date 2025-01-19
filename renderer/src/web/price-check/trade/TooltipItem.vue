<template>
  <div class="flex flex-col gap-x-8 p-2 bg-gray-800 text-gray-400">
    <template v-if="item.runeMods">
      <div class="text-lg">
        <div v-for="runeMod in item.runeMods" :key="runeMod">
          {{ runeMod }}
        </div>
      </div>
      <div
        v-if="item.implicitMods || item.explicitMods"
        class="h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-transparent my-3"
      ></div>
    </template>
    <template v-if="item.implicitMods">
      <div class="text-lg">
        <div v-for="implicitMod in item.implicitMods" :key="implicitMod">
          {{ implicitMod }}
        </div>
      </div>
      <div
        v-if="item.explicitMods"
        class="h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-transparent my-3"
      ></div>
    </template>
    <template v-if="item.explicitMods">
      <div class="text-lg">
        <div v-for="explicitMod in item.explicitMods" :key="explicitMod">
          {{ explicitMod }}
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { DisplayItem } from "./pathofexile-trade";

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<DisplayItem>,
      required: true,
    },
  },
});
</script>
