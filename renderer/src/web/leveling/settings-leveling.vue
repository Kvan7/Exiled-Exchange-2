<template>
  <div class="max-w-md p-2"></div>
</template>
<script lang="ts">
import { defineComponent, computed } from "vue";
import { useI18nNs } from "@/web/i18n";
import UiRadio from "@/web/ui/UiRadio.vue";
import UiCheckbox from "@/web/ui/UiCheckbox.vue";
import UiToggle from "@/web/ui/UiToggle.vue";
import UiErrorBox from "@/web/ui/UiErrorBox.vue";
import { configModelValue, configProp, findWidget } from "../settings/utils.js";
import type { PriceCheckWidget } from "@/web/overlay/interfaces";

export default defineComponent({
  name: "price_check.name",
  components: { UiRadio, UiCheckbox, UiToggle, UiErrorBox },
  props: configProp(),
  setup(props) {
    const configWidget = computed(
      () => findWidget<PriceCheckWidget>("leveling", props.config)!,
    );

    const { t } = useI18nNs("leveling");

    return {
      t,
      leagueId: configModelValue(() => configWidget.value, "showSeller"),
    };
  },
});
</script>
