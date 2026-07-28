<template>
  <div
    v-if="loadedCounts && (loadedCounts.foundItems || loadedCounts.foundStats)"
    class="flex flex-col"
  >
    <div>
      {{
        t("poe2_new.found_data", [
          loadedCounts.foundItems,
          loadedCounts.foundStats,
        ])
      }}
    </div>
    <button class="btn w-fit" @click="retryItem">{{ t("Retry Item") }}</button>
  </div>
  <div v-else-if="loadedCounts">
    {{ t("poe2_new.no_data") }}
  </div>
  <div v-else-if="err">{{ t(err) }}</div>
  <button
    v-else-if="!isLoading"
    class="btn"
    :class="{ 'my-2': buttonMargin }"
    @click="reloadData"
  >
    {{ t("Reload fallback data") }}
  </button>
  <div v-else>{{ t("Loading...") }}</div>
</template>

<script lang="ts">
import { defineComponent, PropType, shallowRef } from "vue";
import { useTradeData } from "@/web/background/TradeData";
import { useI18n } from "vue-i18n";
import { Host } from "@/web/background/IPC";

export default defineComponent({
  props: {
    buttonMargin: {
      type: Boolean,
    },
    itemText: {
      type: String,
      required: true,
    },
    pos: {
      type: Object as PropType<{ x: number; y: number }>,
      default: () => ({ x: 0, y: 0 }),
    },
  },
  setup(props) {
    const { load, isLoading } = useTradeData();
    const { t } = useI18n();

    const loadedCounts = shallowRef<
      undefined | { foundItems: number; foundStats: number }
    >(undefined);

    const err = shallowRef<string | undefined>(undefined);

    const reloadData = () => {
      const res = load(true); // force to go around timer
      res.then(
        (updatedNumbers) => {
          if (!updatedNumbers) {
            err.value = "poe2_new.failed_to_load";
          } else {
            loadedCounts.value = updatedNumbers;
          }
        },
        () => {
          // shouldn't happen, load is internally try caught
          err.value = "unhandled internal error, please report on github";
        },
      );
    };

    const retryItem = () => {
      console.log("retrying item");
      Host.selfDispatch({
        name: "MAIN->CLIENT::item-text",
        payload: {
          target: "price-check",
          clipboard: props.itemText,
          position: props.pos,
          focusOverlay: true,
        },
      });
    };

    return {
      t,
      reloadData,
      retryItem,
      isLoading,
      loadedCounts,
      err,
    };
  },
});
</script>
