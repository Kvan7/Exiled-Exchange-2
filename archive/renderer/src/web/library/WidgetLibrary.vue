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
      <single-item-session :in-session="inSession" :lib-enabled="libEnabled" />
      <div
        v-if="errMessage && errMessage !== ''"
        class="flex-row bg-orange-700 mt-1"
        :class="[$style.dataField, $style.dataFieldColumn]"
      >
        <div>{{ errMessage }}</div>
        <button
          @click="errMessage = null"
          class="w-6 h-6 min-w-6 min-h-6 max-w-6 max-h-6"
          :class="$style.button"
        >
          <i class="fas fa-times"></i>
        </button>
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
import { ColumnOpts, getHeader, LibraryWidget } from "./widget";
import { Host } from "@/web/background/IPC";
import { AppConfig } from "@/web/Config";
import { useI18nNs } from "@/web/i18n";
import SingleItemSession from "./SingleItemSession.vue";

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
        libraryOutputPath: null,
        selectedProfile: "chaos",
        profiles: {
          chaos: {
            refName: true,
            itemLevel: true,
            rarity: true,
            sockets: true,
            mods: true,
            addedMods: true,
            removedMods: true,
            keep: {
              explicit: true,
              implicit: false,
              enchant: false,
              augment: false,
            },
            modOpts: {
              name: true,
              tier: true,
              roll: true,
              ref: true,
              type: true,
              generation: true,
            },
          },
        },
      };
    },
  } satisfies WidgetSpec,
  components: { Widget, SingleItemSession },
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
    const sessionType = shallowRef<string>(props.config.selectedProfile);
    const currentOpts = ref<ColumnOpts>(props.config.profiles.chaos);
    const errMessage = shallowRef<string | null>();

    watch(libEnabled, (curr) => {
      if (!curr) {
        endSessionHost();
        inSession.value = false;
      }
    });

    // update selected options when user changes settings for profiles or switches profiles
    watch(
      props.config.profiles,
      () => {
        currentOpts.value = props.config.profiles[sessionType.value];
      },
      { deep: true },
    );
    watch(sessionType, () => {
      currentOpts.value = props.config.profiles[sessionType.value];
    });

    function startSession() {
      const header = getHeader(sessionType.value);

      if (header.isErr()) {
        errMessage.value = header.error;
        return;
      }
      startSessionHost(sessionName.value, header.value);
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

    const { t } = useI18nNs("library");

    return {
      t,
      startSession,
      endSession,
      libEnabled,
      inSession,
      sessionName,
      sessionType,
      currentOpts,
      errMessage,
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
  @apply content-center items-center justify-between;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dataFieldRow {
  @apply flex flex-row;
}
.dataFieldColumn {
  @apply flex flex-col;
}

.numericField {
  @apply text-center p-1;
  @apply bg-transparent text-gray-300;
  @apply rounded border-2 border-gray-900;
  @apply min-w-8;
}
</style>
