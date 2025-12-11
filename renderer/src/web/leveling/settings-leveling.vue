<template>
  <div class="max-w-md p-2">
    <div class="mb-4">Reminder to enable read client logs in settings</div>

    <ui-checkbox class="mb-4" v-model="showExp">{{
      t(":remember_currency")
    }}</ui-checkbox>
  </div>
</template>
<script lang="ts">
import { defineComponent, computed } from "vue";
import { useI18nNs } from "@/web/i18n";
import UiCheckbox from "@/web/ui/UiCheckbox.vue";
import { configModelValue, configProp, findWidget } from "../settings/utils.js";
import { LevelingWidget } from "./widget.js";

export default defineComponent({
  name: "leveling.name",
  components: { UiCheckbox },
  props: configProp(),
  setup(props) {
    const configWidget = computed(
      () => findWidget<LevelingWidget>("leveling", props.config)!,
    );

    const { t } = useI18nNs("leveling");

    return {
      t,
      showExp: configModelValue(() => configWidget.value, "showExp"),
    };
  },
});
</script>
