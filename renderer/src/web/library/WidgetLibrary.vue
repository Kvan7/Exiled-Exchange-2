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
      cconnnteeetnty
    </div>
  </Widget>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

import Widget from "../overlay/Widget.vue";
import { WidgetSpec } from "../overlay/interfaces";
import { LibraryWidget } from "./widget";
import { useI18n } from "vue-i18n";

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
        wmFlags: ["invisible-on-blur"],
        anchor: {
          pos: "bc",
          x: 68,
          y: 98,
        },
        logItemKey: null,
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
    const { t } = useI18n();

    return {
      t,
    };
  },
});
</script>
