<template>
  <div class="flex flex-col gap-4 p-2 max-w-md">
    <HotkeysGeneric :hotkeys="hotkeys" />
    <div class="flex flex-col mb-4">
      <div class="flex-1 flex gap-2 mb-2">
        <label class="flex-1">{{ t(":remnants_bounding_box") }}</label>
        <svg
          v-if="calibrating !== null && calibrating === 0"
          width="1.25rem"
          height="1.25rem"
          class="animate-spin"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
            opacity=".25"
          />
          <path
            d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
          />
        </svg>
        <button
          class="btn min-w-12"
          @click="calibrate('remnants')"
          :class="{
            'cursor-wait': calibrating !== null,
          }"
        >
          {{ calibrating === null ? t(":calibrate") : calibrating }}
        </button>
      </div>
      <div class="flex-1 flex gap-2 mb-2">
        <label class="flex-1">{{ t(":x") }}</label>
        <input
          v-model.number="remnantsCvX"
          class="rounded bg-gray-900 px-1 block w-12 font-sans"
          placeholder="0"
        />
        <label class="flex-1">{{ t(":y") }}</label>
        <input
          v-model.number="remnantsCvY"
          class="rounded bg-gray-900 px-1 block w-12 font-sans"
          placeholder="0"
        />
      </div>
      <div class="flex-1 flex gap-2 mb-2">
        <label class="flex-1">{{ t(":width") }}</label>
        <input
          v-model.number="remnantsCvWidth"
          class="rounded bg-gray-900 px-1 block w-12 font-sans"
          placeholder="0"
        />
        <label class="flex-1">{{ t(":height") }}</label>
        <input
          v-model.number="remnantsCvHeight"
          class="rounded bg-gray-900 px-1 block w-12 font-sans"
          placeholder="0"
        />
      </div>
      <div class="italic text-gray-500 mb-4">
        {{ t(":remnants_bounding_box_help") }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, shallowRef } from "vue";
import {
  configProp,
  _configModelValue,
  findWidget,
} from "../settings/utils.js";
import { ItemSearchWidget } from "./widget.js";
import HotkeysGeneric from "../settings/HotkeysGeneric.vue";
import type { HotkeySchema } from "../settings/HotkeysGeneric.vue";
import { useI18nNs } from "@/web/i18n";
import { Host, MainProcess } from "@/web/background/IPC";

export default defineComponent({
  name: "item_search.name",
  components: {
    HotkeysGeneric,
  },
  props: configProp(),
  setup(props) {
    const calibrating = shallowRef<number | null>(null);

    const configItemSearchWidget = computed(
      () => findWidget<ItemSearchWidget>("item-search", props.config)!,
    );

    MainProcess.onEvent("MAIN->CLIENT::cv-calibration-result", (e) => {
      if (e.target !== "success") {
        console.log(e.error);
        return;
      }

      configItemSearchWidget.value.boundingBoxes.remnants = {
        x: e.data.bbox.x,
        y: e.data.bbox.y,
        width: e.data.bbox.width,
        height: e.data.bbox.height,
      };
      configItemSearchWidget.value.scale = e.data.scale;
      console.log(e);

      calibrating.value = null;
    });

    const { t } = useI18nNs("item_search");

    const hotkeys = computed<HotkeySchema[]>(() => [
      {
        translationKey: "item_search.remnants_cv_key",
        config: _configModelValue(
          configItemSearchWidget.value,
          "remnantsCvKey",
        ),
      },
    ]);

    return {
      t,
      hotkeys,
      remnantsCvX: computed(
        () => configItemSearchWidget.value.boundingBoxes.remnants.x,
      ),
      remnantsCvY: computed(
        () => configItemSearchWidget.value.boundingBoxes.remnants.y,
      ),
      remnantsCvWidth: computed(
        () => configItemSearchWidget.value.boundingBoxes.remnants.width,
      ),
      remnantsCvHeight: computed(
        () => configItemSearchWidget.value.boundingBoxes.remnants.height,
      ),
      calibrating,
      calibrate: (target: string) => {
        if (calibrating.value !== null) return;

        calibrating.value = 5;

        const timer = setInterval(() => {
          if (calibrating.value === null) {
            clearInterval(timer);
            return;
          }

          calibrating.value--;

          if (calibrating.value === 0) {
            clearInterval(timer);

            Host.sendEvent({
              name: "CLIENT->MAIN::cv-calibration",
              payload: {
                target,
                debug: false,
              },
            });
          }
        }, 1000);
      },
    };
  },
});
</script>
