<template>
  <Widget
    :config="config"
    :removable="false"
    :inline-edit="false"
    move-handles="top-bottom"
  >
    <div
      class="widget-default-style flex flex-col p-1 gap-1"
      style="min-width: 24rem"
    >
      super<br />
      text
    </div>
  </Widget>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";

import Widget from "../overlay/Widget.vue";
import { WidgetSpec } from "../overlay/interfaces";
import { LibraryWidget } from "./widget";
import { useI18n } from "vue-i18n";
import { MainProcess } from "../background/IPC";
import { parseClipboard, ParsedItem } from "@/parser";

export default defineComponent({
  widget: {
    type: "library",
    instances: "single",
    initInstance: (): LibraryWidget => {
      return {
        wmId: 0,
        wmType: "library",
        wmTitle: "{icon=fa-book}",
        wmWants: "hide",
        wmZorder: null,
        wmFlags: ["invisible-on-blur", "menu::skip"],
        anchor: {
          pos: "bc",
          x: 68,
          y: 98,
        },
        logItemKey: null,
        outputPath: null,
      };
    },
  } satisfies WidgetSpec,
  components: { Widget },
  props: {
    config: {
      type: Object as PropType<LibraryWidget>,
      required: true,
    },
  },
  setup() {
    const item = ref<ParsedItem | null>(null);
    MainProcess.onEvent("MAIN->CLIENT::item-text", (e) => {
      if (e.target !== "log-item") return;

      performance.mark("log-item-event");
      item.value = parseClipboard(e.clipboard).unwrapOr(null);
      performance.mark("log-item-parsed");

      if (item.value) {
        console.log(item.value);
      }
    });

    const { t } = useI18n();

    return {
      t,
    };
  },
});
</script>
