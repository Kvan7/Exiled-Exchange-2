<template>
  <div class="flex flex-col gap-4 p-2 max-w-md">
    <div class="flex mb-4">
      <label class="flex-1">{{ t(":log_item_key") }}</label>
      <hotkey-input v-model="logItemKey" class="w-48" />
    </div>
    <div class="mb-4">
      <div class="flex-1 mb-1">{{ t(":poe_log_file") }}</div>
      <input
        v-model.trim="outputPath"
        class="rounded bg-gray-900 px-1 block w-full font-sans"
        placeholder="...?/Documents/My Games/Path of Exile 2/output.csv"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useI18nNs } from "@/web/i18n";
import { configModelValue, configProp, findWidget } from "../settings/utils.js";
import { LibraryWidget } from "./widget.js";
import HotkeyInput from "../settings/HotkeyInput.vue";

export default defineComponent({
  name: "library.name",
  components: { HotkeyInput },
  props: configProp(),
  setup(props) {
    const configLibraryWidget = computed(
      () => findWidget<LibraryWidget>("library", props.config)!,
    );

    const { t } = useI18nNs("library");

    return {
      t,
      logItemKey: configModelValue(
        () => configLibraryWidget.value,
        "logItemKey",
      ),
      outputPath: configModelValue(
        () => configLibraryWidget.value,
        "outputPath",
      ),
    };
  },
});
</script>
