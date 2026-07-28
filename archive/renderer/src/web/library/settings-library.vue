<template>
  <div class="flex flex-col gap-4 p-2 max-w-md">
    <div class="flex mb-4">
      <label class="flex-1">{{ t(":log_item_key") }}</label>
      <hotkey-input v-model="logItemKey" class="w-48" />
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(":output_folder") }}</div>
      <input
        v-model.trim="outputFolder"
        class="rounded bg-gray-900 px-1 block w-full font-sans"
        placeholder="...?/AppData/Roaming/exiled-exchange-2/apt-data/csv-data"
      />
    </div>
    <profile-settings selected-profile="chaos" :profiles="profiles" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useI18nNs } from "@/web/i18n";
import { configModelValue, configProp, findWidget } from "../settings/utils.js";
import { LibraryWidget } from "./widget.js";
import HotkeyInput from "../settings/HotkeyInput.vue";
import ProfileSettings from "./ProfileSettings.vue";

export default defineComponent({
  name: "library.name",
  components: { HotkeyInput, ProfileSettings },
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
      outputFolder: configModelValue(
        () => configLibraryWidget.value,
        "libraryOutputPath",
      ),
      profiles: computed(() => configLibraryWidget.value.profiles),
    };
  },
});
</script>
