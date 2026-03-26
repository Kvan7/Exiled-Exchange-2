<template>
  <Widget
    :config="config"
    :removable="false"
    :inline-edit="false"
    move-handles="top-bottom"
  >
    <div
      class="widget-default-style p-1 flex flex-col overflow-y-auto min-h-0"
      style="min-width: 5rem"
    >
      <div class="text-gray-100 p-1 flex items-center justify-between gap-4">
        <span class="truncate">{{ sessionName }}</span>
        <button v-if="!inSession" @click="startSession" :class="$style.button">
          <i class="fas fa-play"></i>
        </button>
        <button v-else @click="endSession" :class="$style.button">
          <i class="fas fa-stop"></i>
        </button>
      </div>
      <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0">
        <div :class="$style.dataField">
          {{ t(":record_count") }} {{ rollCount }}
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  shallowRef,
  watch,
} from "vue";

import Widget from "../overlay/Widget.vue";
import { WidgetSpec } from "../overlay/interfaces";
import { LibraryWidget } from "./widget";
import { useI18n } from "vue-i18n";
import { Host, MainProcess } from "../background/IPC";
import { parseClipboard, ParsedItem } from "@/parser";
import { AppConfig } from "../Config";
import { err, ok, Result } from "neverthrow";

function startSessionHost(name: string, header: string) {
  Host.sendEvent({
    name: "CLIENT->MAIN::write-data",
    payload: {
      action: "session",
      start: true,
      name,
      header,
    },
  });
}
function endSessionHost() {
  Host.sendEvent({
    name: "CLIENT->MAIN::write-data",
    payload: {
      action: "session",
      start: false,
    },
  });
}

function buildCsvString(
  item: ParsedItem,
  sessionType: "chaos",
): Result<string, string> {
  if (sessionType === "chaos") {
    return ok(
      [
        item.info.refName,
        item.itemLevel,
        item.newMods.map((mod) => mod.info.name).toString(),
        item.newMods.map((mod) => mod.info.tier).toString(),
      ].join(","),
    );
  }
  return err("sessionType not supported");
}
const headers = {
  chaos: "base,ilvl,mod,tier",
};

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
          pos: "tl",
          x: 20,
          y: 20,
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

    const inSession = shallowRef<boolean>(false);

    const sessionName = shallowRef<string>("mySession");
    const item = ref<ParsedItem | null>(null);
    const rollCount = shallowRef<number>(0);
    const sessionType = shallowRef<"chaos">("chaos");

    watch(libEnabled, (curr) => {
      if (!curr) {
        endSessionHost();
        inSession.value = false;
      }
    });

    function startSession() {
      item.value = null;
      rollCount.value = 0;
      startSessionHost(sessionName.value, headers[sessionType.value]);
      inSession.value = true;
      props.config.wmFlags = props.config.wmFlags.filter(
        (f) => f !== "invisible-on-blur",
      );
    }
    function endSession() {
      endSessionHost();
      inSession.value = false;
      if (!props.config.wmFlags.includes("invisible-on-blur")) {
        props.config.wmFlags.push("invisible-on-blur");
      }
    }

    watch(
      item,
      (curr) => {
        if (!curr) return;

        buildCsvString(curr, sessionType.value)
          .andThen((text) => {
            Host.sendEvent({
              name: "CLIENT->MAIN::write-data",
              payload: {
                action: "log-item",
                text,
              },
            });
            rollCount.value++;
            return ok(null);
          })
          .mapErr((err) => {
            console.warn(err);
          });
      },
      { deep: true },
    );

    MainProcess.onEvent("MAIN->CLIENT::item-text", (e) => {
      if (e.target !== "log-item") return;

      performance.mark("log-item-event");
      item.value = parseClipboard(e.clipboard).unwrapOr(null);
      performance.mark("log-item-parsed");
    });

    const { t } = useI18n();

    return {
      t,
      startSession,
      endSession,
      inSession,
      sessionName,
      rollCount,
    };
  },
  beforeUnmount() {
    endSessionHost();
  },
});
</script>

<style lang="postcss" module>
.button {
  background: rgba(29, 29, 29, 0.863);
  @apply rounded;
  line-height: 1;
  width: 2rem;
  height: 2rem;
  @apply mx-1;
}

.dataField {
  flex-shrink: 0;
  @apply rounded;
  @apply max-w-sm;
  @apply p-2 leading-4;
  @apply text-gray-100 bg-gray-800;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
