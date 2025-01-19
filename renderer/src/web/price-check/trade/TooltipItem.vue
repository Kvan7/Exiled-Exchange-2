<template>
  <!-- 9e9eff -->
  <div
    class="flex flex-col gap-x-8 p-1 bg-gray-800 text-indigo-400 text-center"
  >
    <template v-if="item.runeMods">
      <div>
        <div v-for="runeMod in item.runeMods" :key="runeMod">
          {{ runeMod }}
        </div>
      </div>
      <div v-if="item.implicitMods || item.explicitMods" class="divider"></div>
    </template>
    <template v-if="item.implicitMods">
      <div>
        <div v-for="implicitMod in item.implicitMods" :key="implicitMod">
          {{ implicitMod }}
        </div>
      </div>
      <div v-if="item.explicitMods" class="divider"></div>
    </template>
    <template v-if="item.explicitMods">
      <div>
        <div v-for="explicitMod in item.explicitMods" :key="explicitMod">
          {{ explicitMod }}
        </div>
      </div>
    </template>
    <template v-if="item.pseudoMods">
      <div>
        <div
          v-for="pseudoMod in item.pseudoMods"
          :key="pseudoMod"
          class="text-gray-400"
        >
          {{ pseudoMod }}
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

<style lang="postcss">
.divider {
  @apply h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-transparent my-1;
}

.mod {
  @apply text-sm;
}
</style>
