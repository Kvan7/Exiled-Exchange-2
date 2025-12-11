<template>
  <Widget :config="config" :removable="false" move-handles="top-bottom">
    <div class="widget-default-style min-w-40 min-h-10">SOME TEXT</div>
  </Widget>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

import Widget from "../overlay/Widget.vue";
import { WidgetSpec } from "../overlay/interfaces";
import { LevelingWidget } from "./widget";

export default defineComponent({
  widget: {
    type: "leveling",
    instances: "single",
    initInstance: (): LevelingWidget => {
      return {
        wmId: 0,
        wmType: "leveling",
        wmTitle: "XP",
        wmWants: "hide",
        wmZorder: null,
        wmFlags: [],
        anchor: {
          pos: "bc",
          x: 68,
          y: 98,
        },
      };
    },
  } satisfies WidgetSpec,
  components: { Widget },
  props: {
    config: {
      type: Object as PropType<LevelingWidget>,
      required: true,
    },
  },
});
</script>
