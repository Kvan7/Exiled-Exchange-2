<template>
  <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0">
    <div :class="[$style.dataField, $style.dataFieldRow]">
      <div>{{ t(":record_count") }}</div>
      <div :class="$style.numericField">
        {{ rollCount }}
      </div>
    </div>
    <div
      v-if="modsDiff.length"
      :class="[$style.dataField, $style.dataFieldColumn]"
    >
      <div v-for="mod in modsDiff">{{ mod }}</div>
    </div>
    <div
      v-if="errMessage && errMessage !== ''"
      class="flex-row bg-orange-700"
      :class="[$style.dataField, $style.dataFieldColumn]"
    >
      <div>{{ errMessage }}</div>
      <button
        @click="errMessage = null"
        class="w-6 h-6 min-w-6 min-h-6 max-w-6 max-h-6"
        :class="$style.button"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, shallowRef, watch } from "vue";
import { useI18nNs } from "@/web/i18n";
import { ParsedModifier } from "@/parser/advanced-mod-desc";
import { parseClipboard, ParsedItem } from "@/parser";
import { buildCsvString, diffItem, LibraryWidget } from "./widget";
import { ok } from "neverthrow";
import { Host, MainProcess } from "@/web/background/IPC";
import { AppConfig } from "../Config";

export default defineComponent({
  name: "SingleItemSession",
  props: {
    libEnabled: {
      type: Boolean,
      required: true,
    },
    inSession: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const item = ref<ParsedItem | null>(null);
    const itemModsDiff = ref<{
      added: ParsedModifier[];
      removed: ParsedModifier[];
    }>({ added: [], removed: [] });
    const rollCount = shallowRef<number>(0);
    const errMessage = ref<string | null>(null);
    const widget = computed(() => AppConfig<LibraryWidget>("library")!);

    watch(
      () => props.inSession,
      (curr) => {
        if (!curr) {
          item.value = null;
          rollCount.value = 0;
          errMessage.value = null;
        }
      },
    );

    watch(
      item,
      (curr, prev) => {
        if (!curr) return;

        itemModsDiff.value = diffItem(curr, prev);

        buildCsvString(
          curr,
          widget.value.selectedProfile,
          itemModsDiff.value.added,
          itemModsDiff.value.removed,
          {
            columnOpts: widget.value.profiles[widget.value.selectedProfile],
          },
        )
          .andThen((text) => {
            Host.sendEvent({
              name: "CLIENT->MAIN::write-data",
              payload: {
                action: "log-item",
                text,
              },
            });
            rollCount.value++;
            return ok(null);
          })
          .mapErr((err) => {
            errMessage.value = err;
            console.warn(err);
          });
      },
      { deep: true },
    );

    MainProcess.onEvent("MAIN->CLIENT::item-text", (e) => {
      if (e.target !== "log-item") return;
      if (!props.libEnabled) return;
      if (!props.inSession) return;

      performance.mark("log-item-event");
      const res = parseClipboard(e.clipboard);
      if (res.isErr()) {
        errMessage.value = res.error;
        item.value = null;
        return;
      }
      item.value = res.value;
      performance.mark("log-item-parsed");
    });

    const { t } = useI18nNs("library");
    return {
      t,
      item,
      rollCount,
      modsDiff: computed(() => {
        if (itemModsDiff.value.added.length === 0) return ["None added"];
        return itemModsDiff.value.added.map((mod) => mod.info.name);
      }),
      errMessage,
    };
  },
});
</script>

<style lang="postcss" module>
.button {
  @apply bg-gray-800;
  @apply rounded;
  line-height: 1;
  @apply w-8 h-8;
  @apply max-w-8 max-h-8;
  @apply min-w-8 min-h-8;

  &:hover {
    @apply bg-gray-700;
  }
}

.dataField {
  flex-shrink: 0;
  @apply rounded;
  @apply max-w-sm;
  @apply p-2 leading-4;
  @apply text-gray-100 bg-gray-800;
  @apply content-center items-center justify-between;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dataFieldRow {
  @apply flex flex-row;
}
.dataFieldColumn {
  @apply flex flex-col;
}

.numericField {
  @apply text-center p-1;
  @apply bg-transparent text-gray-300;
  @apply rounded border-2 border-gray-900;
  @apply min-w-8;
}
</style>
