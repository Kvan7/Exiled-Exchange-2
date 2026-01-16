<template>
  <widget
    :config="config"
    move-handles="corners"
    v-slot="{ isMoving, isEditing }"
  >
    <div class="relative p-2 rounded bg-gray-900 shadow-lg">
      <div
        v-if="!isEditing"
        class="text-gray-100 m-1 leading-4 text-center truncate"
        :style="{ width: `${currentWidth}px` }"
      >
        {{ config.wmTitle || "Untitled" }}
      </div>
      <input
        v-else
        class="leading-4 rounded text-gray-100 p-1 bg-gray-700 w-full mb-1"
        :placeholder="t('widget.title')"
        v-model="config.wmTitle"
      />
      <textarea
        v-model="noteBody"
        :disabled="isMoving"
        :placeholder="t('notepad.placeholder')"
        class="min-h-[150px] resize-none overflow-y-auto overflow-x-hidden box-border whitespace-pre-wrap break-words block p-2 rounded bg-gray-800 text-white font-mono border border-transparent outline-none focus:border-white/30 placeholder:text-gray-500"
        :style="
          {
            width: `${currentWidth}px`,
            maxHeight: `${maxDimensions.maxHeight}px`,
            fieldSizing: 'content',
          } as any
        "
      />
      <div
        v-if="!isMoving && isEditing"
        class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-gray-700 p-1 rounded"
      >
        <span class="text-gray-400 text-xs leading-none"
          >{{ t("notepad.size") }}:</span
        >
        <button
          class="rounded text-gray-400 w-6 h-6 leading-none text-xs border border-transparent cursor-pointer transition-all duration-150 hover:enabled:bg-gray-600 hover:enabled:text-white disabled:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 bg-gray-900"
          @click="decreaseSize"
          :disabled="widgetSize === 'small'"
          :title="t('notepad.decrease_size')"
        >
          <i class="fas fa-minus"></i>
        </button>
        <button
          class="rounded text-gray-400 w-6 h-6 leading-none text-xs border border-transparent cursor-pointer transition-all duration-150 hover:enabled:bg-gray-600 hover:enabled:text-white disabled:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 bg-gray-900"
          @click="increaseSize"
          :disabled="widgetSize === 'large'"
          :title="t('notepad.increase_size')"
        >
          <i class="fas fa-plus"></i>
        </button>
      </div>
    </div>
  </widget>
</template>

<script lang="ts">
import { defineComponent, PropType, inject, computed } from "vue";
import { useI18n } from "vue-i18n";
import Widget from "../overlay/Widget.vue";
import {
  WidgetManager,
  WidgetSpec,
  NotepadWidget,
} from "../overlay/interfaces";

const windowWidthPresets = {
  small: 250,
  medium: 500,
  large: 750,
};

export default defineComponent({
  widget: {
    type: "notepad",
    instances: "multi",
    trNameKey: "notepad.name",
  } satisfies WidgetSpec,
  components: { Widget },
  props: {
    config: {
      type: Object as PropType<NotepadWidget>,
      required: true,
    },
  },
  setup(props) {
    const wm = inject<WidgetManager>("wm")!;
    const { t } = useI18n();

    if (props.config.wmFlags[0] === "uninitialized") {
      const config = props.config as any;
      config.anchor = {
        pos: "tl",
        x: Math.random() * (5 - 1) + 1,
        y: Math.random() * (12 - 8) + 16,
      };
      config.wmTitle = t("notepad.name");
      config.notepadBody = "";
      config.wmFlags = ["invisible-on-blur"];
      config.notepadSize = "medium";
      wm.show(config.wmId);
    }

    const widgetSize = computed({
      get: () => props.config.notepadSize || "medium",
      set: (val) => {
        props.config.notepadSize = val;
      },
    });

    const currentWidth = computed(() => windowWidthPresets[widgetSize.value]);

    const decreaseSize = () => {
      if (widgetSize.value === "medium") widgetSize.value = "small";
      else if (widgetSize.value === "large") widgetSize.value = "medium";
    };

    const increaseSize = () => {
      if (widgetSize.value === "small") widgetSize.value = "medium";
      else if (widgetSize.value === "medium") widgetSize.value = "large";
    };

    // Max dimensions: 1/3 of overlay size
    const maxDimensions = computed(() => ({
      maxWidth: Math.floor(wm.size.value.width / 3),
      maxHeight: Math.floor(wm.size.value.height / 3),
    }));

    const noteBody = computed({
      get: () => props.config.notepadBody || "",
      set: (val) => {
        props.config.notepadBody = val;
      },
    });

    return {
      t,
      maxDimensions,
      widgetSize,
      currentWidth,
      decreaseSize,
      increaseSize,
      noteBody,
    };
  },
});
</script>
