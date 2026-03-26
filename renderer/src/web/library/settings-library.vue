<template>
  <div class="flex flex-col gap-4 p-2 max-w-md">
    <div class="flex">
      <label class="flex-1">{{ t("item_search.ocr_gems_key") }}</label>
      <hotkey-input v-model="logItemKey" class="w-48" />
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
    };
  },
});
</script>
