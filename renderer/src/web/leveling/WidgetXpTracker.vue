<template>
  <Widget
    :config="config"
    :removable="false"
    :inline-edit="false"
    move-handles="top-bottom"
  >
    <div
      class="min-h-10"
      :class="[
        $style['xpContainer'],
        {
          'min-w-48': config.showExp,
          'min-w-32': !config.showExp,
        },
      ]"
    >
      <input
        :class="$style['xpInput']"
        :placeholder="t('min')"
        min="1"
        max="100"
        step="1"
        type="number"
        v-model.number="characterLevel"
        @mousewheel.stop
      />
      <div v-if="config.showExp">
        Exp
        {{ areaLevel > 70 || characterLevel >= 95 ? "*" : "" }}:
        <span
          class="font-semibold"
          :class="{
            'text-red-600': expPenalty !== '100.0',
            'text-green-600': expPenalty === '100.0',
          }"
          >{{ expPenalty }}%</span
        >
      </div>
      <div>
        Over:
        <span
          class="font-semibold"
          :class="{
            'text-red-600': overIdeal < 0,
            'text-green-600': overIdeal === 0 || overIdeal === 1,
          }"
          >{{ overIdeal }}</span
        >
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";

import Widget from "../overlay/Widget.vue";
import { WidgetSpec } from "../overlay/interfaces";
import { XpWidget } from "./widget";
import { useI18n } from "vue-i18n";
import { useClientLog } from "../client-log/client-log";

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
    type: "experience-tracker",
    instances: "single",
    initInstance: (): XpWidget => {
      return {
        wmId: 0,
        wmType: "experience-tracker",
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
      type: Object as PropType<XpWidget>,
      required: true,
    },
  },
  setup() {
    const { playerLevel, setPlayerLevel, areaLevel } = useClientLog();

    const characterLevel = computed({
      get() {
        return playerLevel.value;
      },
      set(value: number) {
        setPlayerLevel(value);
      },
    });

    const { t } = useI18n();

    return {
      t,
      characterLevel,
      areaLevel,
      expPenalty: computed(() => {
        return getExpPenalty(characterLevel.value, areaLevel.value).toFixed(1);
      }),
      overIdeal: computed(() => {
        return getOverIdeal(characterLevel.value, areaLevel.value);
      }),
    };
  },
});
</script>

<style lang="postcss" module>
.xpInput {
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

.xpContainer {
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
