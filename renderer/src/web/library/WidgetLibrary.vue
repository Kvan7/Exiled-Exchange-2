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
import { computed, defineComponent, PropType, ref, watch } from "vue";

import Widget from "../overlay/Widget.vue";
import { WidgetSpec } from "../overlay/interfaces";
import { LibraryWidget } from "./widget";
import { useI18n } from "vue-i18n";
import { Host, MainProcess } from "../background/IPC";
import { parseClipboard, ParsedItem } from "@/parser";
import { AppConfig } from "../Config";

function startSession() {
  Host.sendEvent({
    name: "CLIENT->MAIN::write-data",
    payload: {
      action: "session",
      start: true,
      name: "library",
      header: "base,ilvl,mod,tier",
    },
  });
}
function endSession() {
  Host.sendEvent({
    name: "CLIENT->MAIN::write-data",
    payload: {
      action: "session",
      start: false,
    },
  });
}

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
  setup(props) {
    const libEnabled = computed(
      () => AppConfig().enableAlphas && AppConfig().alphas.includes("library"),
    );
    if (libEnabled.value) {
      startSession();
    }
    watch(libEnabled, (curr) => {
      if (curr) {
        startSession();
      } else {
        endSession();
      }
      console.log(props.config);
    });

    const item = ref<ParsedItem | null>(null);
    MainProcess.onEvent("MAIN->CLIENT::item-text", (e) => {
      if (e.target !== "log-item") return;

      performance.mark("log-item-event");
      item.value = parseClipboard(e.clipboard).unwrapOr(null);
      performance.mark("log-item-parsed");
    });

    watch(
      item,
      (curr) => {
        if (!curr) return;

        Host.sendEvent({
          name: "CLIENT->MAIN::write-data",
          payload: {
            action: "log-item",
            text: [
              curr.info.refName,
              curr.itemLevel,
              curr.newMods[0].info.name,
              curr.newMods[0].info.tier,
            ].join(","),
          },
        });
      },
      { deep: true },
    );

    const { t } = useI18n();

    return {
      t,
    };
  },
  beforeUnmount() {
    endSession();
  },
});
</script>
