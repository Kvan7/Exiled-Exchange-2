<template>
  <div class="flex flex-row justify-between border-b border-gray-700">
    <div class="py-2 flex flex-col">
      <div class="pb-1 flex items-baseline">
        <i class="w-5 shrink-0 fas fa-exclamation-triangle text-orange-400"></i>
        <div
          class="search-text mr-1 relative flex min-w-0"
          style="line-height: 1rem"
        >
          <span class="truncate"><ItemModifierText :text="stat.text" /></span>
          <span class="search-text-full whitespace-pre-wrap cursor-default"
            ><ItemModifierText :text="stat.text"
          /></span>
        </div>
      </div>
      <div class="ml-5 text-xs leading-none">
        <span class="text-gray-600">{{ t(stat.type) }} &mdash; </span>
        <span class="text-orange-400">{{ t("Not recognized modifier") }}</span>
      </div>
    </div>
    <div class="text-xs max-w-48 m-1">
      <reload-trade-data button-margin :item-text="itemText" />
    </div>
  </div>
</template>

<script lang="ts">
import { useI18n } from "vue-i18n";
import { ParsedItem } from "@/parser";
import ItemModifierText from "../../ui/ItemModifierText.vue";
import { defineComponent, PropType } from "vue";
import ReloadTradeData from "../fallback/ReloadTradeData.vue";

export default defineComponent({
  components: { ItemModifierText, ReloadTradeData },
  props: {
    stat: {
      type: Object as PropType<ParsedItem["unknownModifiers"][number]>,
      required: true,
    },
    itemText: {
      type: String,
      required: true,
    },
  },
  setup() {
    const { t } = useI18n();

    return { t };
  },
});
</script>
