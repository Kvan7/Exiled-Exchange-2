<template>
  <Widget
    :config="config"
    :removable="false"
    :inline-edit="false"
    move-handles="top-bottom"
  >
    <div
      class="widget-default-style p-1 flex flex-col overflow-y-auto min-h-0 min-w-48"
    >
      <div class="text-gray-100 p-1 flex items-center justify-between gap-4">
        <div
          v-if="inSession"
          class="text-gray-100 m-1 leading-4 w-full text-center p-1"
        >
          {{ sessionName }}
        </div>
        <input
          v-else
          class="leading-4 rounded text-gray-100 p-1 bg-gray-700 w-full mb-1"
          v-model="sessionName"
        />
        <button v-if="!inSession" @click="startSession" :class="$style.button">
          <i class="fas fa-play"></i>
        </button>
        <button v-else @click="endSession" :class="$style.button">
          <i class="fas fa-stop"></i>
        </button>
      </div>
      <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0">
        <div :class="$style.dataField">
          <div>{{ t(":record_count") }}</div>
          <div :class="$style.numericField">
            {{ rollCount }}
          </div>
        </div>
        <div v-if="lastMod" :class="$style.dataField">
          <div>{{ lastMod }}</div>
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

import Widget from "@/web/overlay/Widget.vue";
import { WidgetSpec } from "@/web/overlay/interfaces";
import { LibraryWidget } from "./widget";
import { Host, MainProcess } from "@/web/background/IPC";
import { parseClipboard, ParsedItem } from "@/parser";
import { AppConfig } from "@/web/Config";
import { err, ok, Result } from "neverthrow";
import { useI18nNs } from "@/web/i18n";

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
    const filteredMods = item.newMods.filter(
      (mod) =>
        mod.info.generation === "suffix" || mod.info.generation === "prefix",
    );
    if (filteredMods.length === 1) {
      const mod = filteredMods[0];
      return ok(
        [item.info.refName, item.itemLevel, mod.info.name, mod.info.tier].join(
          ",",
        ),
      );
    }

    return ok(
      [
        item.info.refName,
        item.itemLevel,
        `"${JSON.stringify(filteredMods.map((mod) => mod.info.name)).replaceAll('"', "\\'")}"`,
        `"${JSON.stringify(filteredMods.map((mod) => mod.info.tier))}"`,
      ].join(","),
    );
  }
  return err("sessionType not supported");
}
const headers = {
  chaos: "base,ilvl,mods,tiers",
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
      if (!libEnabled.value) return;
      if (!inSession.value) return;

      performance.mark("log-item-event");
      item.value = parseClipboard(e.clipboard).unwrapOr(null);
      performance.mark("log-item-parsed");
    });

    const { t } = useI18nNs("library");

    return {
      t,
      startSession,
      endSession,
      inSession,
      sessionName,
      rollCount,
      lastMod: computed(() => item.value?.newMods.find(() => true)?.info.name),
    };
  },
  beforeUnmount() {
    endSessionHost();
  },
});
</script>

<style lang="postcss" module>
.button {
  @apply bg-gray-800;
  @apply rounded;
  line-height: 1;
  @apply w-8 h-8;
  @apply max-w-8 max-h-8;
  @apply min-w-8 min-h-8;

  &:hover {
    @apply bg-gray-700;
  }
}

.dataField {
  flex-shrink: 0;
  @apply rounded;
  @apply max-w-sm;
  @apply p-2 leading-4;
  @apply text-gray-100 bg-gray-800;
  @apply flex flex-row justify-between;
  @apply content-center items-center;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.numericField {
  @apply text-center p-1;
  @apply bg-transparent text-gray-300;
  @apply rounded border-2 border-gray-900;
  @apply min-w-8;
}
</style>
