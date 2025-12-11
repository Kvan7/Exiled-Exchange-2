<template>
  <div class="max-w-md p-2">
    <div class="mb-4">{{ t(":enable_read_client_logs") }}</div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t("settings.poe_log_file") }}</div>
      <input
        v-model.trim="clientLog"
        class="rounded bg-gray-900 px-1 block w-full font-sans"
        placeholder="...?/Grinding Gear Games/Path of Exile 2/logs/Client.txt"
      />
    </div>
    <ui-checkbox class="mb-1" v-model="readClientLog">{{
      t("settings.read_client_log")
    }}</ui-checkbox>
    <div class="italic text-gray-500 mb-4">
      {{ t("settings.client_log_explain") }}
    </div>
    <div class="mb-4 border-b min-w-full" />

    <div class="text-lg">{{ t(":exp_tracking") }}</div>
    {{ t(":exp_tracking_help_tldr") }}
    <div class="italic text-gray-500 mb-4">
      {{ t(":exp_tracking_help") }}
    </div>

    <div class="italic text-gray-500 mb-4">
      {{ t(":exp_inspire") }}
      <a
        class="text-blue-400 underline"
        href="https://github.com/JusKillmeQik/PoE-Leveling-Guide?tab=readme-ov-file#experience-tracker"
        target="_blank"
        >PoE-Leveling-Guide</a
      >
    </div>

    <ui-checkbox class="mb-4" v-model="showExp">{{
      t(":show_exp")
    }}</ui-checkbox>
  </div>
</template>
<script lang="ts">
import { defineComponent, computed } from "vue";
import { useI18nNs } from "@/web/i18n";
import UiCheckbox from "@/web/ui/UiCheckbox.vue";
import { configModelValue, configProp, findWidget } from "../settings/utils.js";
import { XpWidget } from "./widget.js";

export default defineComponent({
  name: "leveling.name",
  components: { UiCheckbox },
  props: configProp(),
  setup(props) {
    const configXpWidget = computed(
      () => findWidget<XpWidget>("experience-tracker", props.config)!,
    );

    const { t } = useI18nNs("leveling");

    return {
      t,
      readClientLog: configModelValue(() => props.config, "readClientLog"),
      clientLog: configModelValue(() => props.config, "clientLog"),
      showExp: configModelValue(() => configXpWidget.value, "showExp"),
    };
  },
});
</script>
