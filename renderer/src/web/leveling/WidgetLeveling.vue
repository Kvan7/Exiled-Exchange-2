<template>
  <Widget
    :config="config"
    :removable="false"
    :inline-edit="false"
    move-handles="top-bottom"
  >
    <div class="min-w-48 min-h-10" :class="$style['levelingContainer']">
      <input
        :class="$style['levelingInput']"
        :placeholder="t('min')"
        min="1"
        max="100"
        step="1"
        type="number"
        v-model.number="playerLevel"
        @mousewheel.stop
      />
      <div v-if="expDisplay">{{ expDisplay + expPenalty }}%</div>
      <div>Over: {{ overIdeal }}</div>
    </div>
  </Widget>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";

import Widget from "../overlay/Widget.vue";
import { WidgetSpec } from "../overlay/interfaces";
import { LevelingWidget } from "./widget";
import { useI18n } from "vue-i18n";

function calcBaseSafeZone(playerLevel: number): number {
  return Math.floor(playerLevel / 16) + 3;
}

function getOverIdeal(playerLevel: number, monsterLevel: number): number {
  const safeZone = calcBaseSafeZone(playerLevel);
  return safeZone - (monsterLevel - playerLevel);
}

function getExpPenalty(playerLevel: number, monsterLevel: number): number {
  const safeZone =
    monsterLevel > playerLevel ? calcBaseSafeZone(playerLevel) : 0;

  const effectiveDiff = Math.max(
    Math.abs(monsterLevel - playerLevel) - safeZone,
    0,
  );

  const expMulti = Math.max(
    0.01,
    ((playerLevel + 5) / (playerLevel + 5 + effectiveDiff ** 2.5)) ** 1.3,
  );

  return 100 * expMulti;
}

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
    const _playerLevel = ref<number>(1);
    const _monsterLevel = ref<number>(42);

    const playerLevel = computed({
      get() {
        return _playerLevel.value;
      },
      set(value: number) {
        console.log(value);
        _playerLevel.value = value;
      },
    });

    const expDisplay = computed(() => {
      if (props.config.showExp) {
        if (_monsterLevel.value > 70 || playerLevel.value >= 95) {
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
      expPenalty: computed(() => {
        return getExpPenalty(playerLevel.value, _monsterLevel.value).toFixed(1);
      }),
      overIdeal: computed(() => {
        return getOverIdeal(playerLevel.value, _monsterLevel.value);
      }),
    };
  },
});
</script>

<style lang="postcss" module>
.levelingInput {
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply text-center;
  @apply w-8;
  @apply px-1;
  @apply border border-transparent;
  @apply rounded;

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

.levelingContainer {
  @apply flex flex-row;
  @apply justify-between items-center;
  @apply px-2;

  @apply rounded;
  @apply bg-gray-800;
  @apply border-4 border-gray-900;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.75),
    0 1px 2px 0 rgba(0, 0, 0, 0.75);
}
</style>
