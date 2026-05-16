<template>
  <div
    v-if="icon"
    :class="[$style['icon-w-' + itemWidth], $style['icon-container']]"
  >
    <ui-item-img :icon="icon" />
    <div
      v-if="sockets && sockets.length > 0"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div
        :class="[
          $style['socket-grid'],
          $style[
            'socket-cols-' +
              (sockets.length < itemWidth ? sockets.length : itemWidth)
          ],
        ]"
      >
        <div
          v-for="socket in sockets"
          class="w-8 h-8 bg-no-repeat bg-center bg-[size:2rem]"
          :class="$style[`t-${socket.type}-${socket.item ?? 'empty'}`]"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import UiItemImg from "./UiItemImg.vue";

export default defineComponent({
  components: {
    UiItemImg,
  },
  props: {
    icon: {
      type: String,
      required: true,
    },
    itemWidth: {
      type: Number,
      default: 1,
    },
    itemHeight: {
      type: Number,
      default: 1,
    },
    sockets: {
      type: Array as () => { type: string; item?: string }[] | undefined,
      default: undefined,
    },
  },
});
</script>

<style lang="postcss" module>
.icon-w-1 {
  @apply w-12;
}
.icon-w-2 {
  @apply w-24;
}
.icon-w-3 {
  @apply w-36;
}

.icon-container {
  @apply inline-block relative bg-contain bg-no-repeat align-top;
}

.socket-w1 {
  @apply w-12;
}
.socket-w2 {
  @apply w-24;
}
.socket-w3 {
  @apply w-36;
}

.socket-h1 {
  @apply top-[7.5px];
}

.socket-grid {
  @apply grid gap-1;
}
.socket-cols-1 {
  @apply grid-cols-1;
}
.socket-cols-2 {
  @apply grid-cols-2;
}
.socket-cols-3 {
  @apply grid-cols-3;
}

.t-rune-empty {
  @apply bg-[url('/images/augments/empty-socket.png')];
}
.t-rune-rune {
  @apply bg-[url('/images/augments/rune.png')];
}
.t-rune-soulcore {
  @apply bg-[url('/images/augments/soulcore.png')];
}
.t-rune-sacredtalisman {
  @apply bg-[url('/images/augments/sacredtalisman.png')];
}
.t-rune-primaltalisman {
  @apply bg-[url('/images/augments/primaltalisman.png')];
}
.t-rune-vividtalisman {
  @apply bg-[url('/images/augments/vividtalisman.png')];
}
.t-rune-wildtalisman {
  @apply bg-[url('/images/augments/wildtalisman.png')];
}
.t-jewel-empty {
  @apply bg-[url('/images/augments/empty-socket.png')];
}
.t-jewel-blue {
  @apply bg-[url('/images/augments/blue.png')];
}
.t-jewel-red {
  @apply bg-[url('/images/augments/red.png')];
}
.t-jewel-green {
  @apply bg-[url('/images/augments/green.png')];
}
</style>
