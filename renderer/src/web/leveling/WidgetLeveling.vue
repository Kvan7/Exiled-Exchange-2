<template>
  <Widget :config="config" :removable="false" move-handles="top-bottom">
    <div
      class="widget-default-style min-w-48 min-h-10"
      :class="$style['container']"
    >
      <input
        :class="$style['rollInput']"
        :placeholder="t('min')"
        min="1"
        max="100"
        step="1"
        type="number"
        v-model.number="playerLevel"
        @mousewheel.stop
      />
      <div v-if="expDisplay">{{ expDisplay + playerLevel }}%</div>
      <div>Over: {{ playerLevel }}</div>
    </div>
  </Widget>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";

import Widget from "../overlay/Widget.vue";
import { WidgetSpec } from "../overlay/interfaces";
import { LevelingWidget } from "./widget";
import { useI18n } from "vue-i18n";

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
        showExp: true,
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
  setup(props) {
    const _playerLevel = ref<number | "">(1);
    const _monsterLevel = ref<number>(1);

    const playerLevel = computed({
      get() {
        return _playerLevel.value;
      },
      set(value: "" | number) {
        console.log(value);
        _playerLevel.value = value;
      },
    });

    const expDisplay = computed(() => {
      if (props.config.showExp) {
        if (
          _monsterLevel.value > 70 ||
          (playerLevel.value !== "" && playerLevel.value >= 95)
        ) {
          return "Exp*: ";
        }
        return "Exp: ";
      } else {
        return false;
      }
    });

    const { t } = useI18n();

    return {
      t,
      playerLevel,
      expDisplay,
    };
  },
});
</script>

<style lang="postcss" module>
.rollInput {
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply text-center;
  @apply w-12;
  @apply px-1;
  @apply border border-transparent;

  &:first-child {
    @apply rounded-l;
  }
  &:last-child {
    @apply rounded-r;
  }

  &::placeholder {
    @apply text-gray-700;
    font-size: 0.8125rem;
  }

  /* &:not(:placeholder-shown) { @apply border-gray-600; } */

  &:focus {
    @apply border-gray-500;
    cursor: none;
  }
}

.container {
  @apply flex flex-row;
  @apply justify-between items-center;
  @apply px-2;
}
</style>
