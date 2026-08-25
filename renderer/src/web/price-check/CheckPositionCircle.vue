<template>
  <div
    class="absolute rounded-full"
    :style="{
      top: relativePos.top,
      left: relativePos.left,
      width: '5rem',
      height: '5rem',
      background: 'rgba(255,255,255,0.35)',
    }"
    style="
      box-shadow:
        0 1px 3px 0 rgb(0, 0, 0),
        0 1px 2px 0 rgb(0, 0, 0);
    "
  >
    <div
      class="relative rounded-full"
      :style="{
        top: `1.875rem`,
        left: `1.875rem`,
        width: '1.25rem',
        height: '1.25rem',
        background: 'rgba(255,255,255,0.5)',
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  position: { x: number; y: number };
}>();

const relativePos = computed(() => {
  const localX = clampToViewport(
    props.position.x - screenOffsetX(),
    window.innerWidth,
  );
  const localY = clampToViewport(
    props.position.y - screenOffsetY(),
    window.innerHeight,
  );

  return {
    top: `calc(${localY}px - 2.5rem)`,
    left: `calc(${localX}px - 2.5rem)`,
  };
});

function screenOffsetX() {
  return isUsableScreenOffset(window.screenX, window.innerWidth)
    ? window.screenX
    : 0;
}

function screenOffsetY() {
  return isUsableScreenOffset(window.screenY, window.innerHeight)
    ? window.screenY
    : 0;
}

function isUsableScreenOffset(offset: number, viewportSize: number) {
  return Number.isFinite(offset) && offset >= 0 && offset <= viewportSize;
}

function clampToViewport(value: number, viewportSize: number) {
  return Math.min(Math.max(value, 0), viewportSize);
}
</script>
