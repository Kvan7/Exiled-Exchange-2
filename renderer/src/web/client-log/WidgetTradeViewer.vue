<template>
  <Widget :config="config" move-handles="corners" readonly :inline-edit="false">
    <div
      class="widget-default-style p-1 flex flex-col overflow-y-auto min-h-0 w-72"
      v-if="!isMinimized || activeTrades.length"
      style="min-width: 5rem"
    >
      <div class="text-gray-100 p-1 pb-0 flex items-center justify-between gap-2">
        <span class="truncate">{{ t("trade_viewer.name") }}</span>
      </div>
      <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0">
        <div
          v-for="trade in activeTrades"
          :key="trade.id"
          class="rounded p-2 text-gray-100 border-b-gray-800 border-b-2 last:border-b-0"
        >
          <div class="text-base leading-4">{{ trade.item }}</div>
          <div class="relative pl-3 pr-6">
            <div class="leading-5">{{ t("trade_viewer.price") }} {{ trade.priceAmount }}x {{ trade.priceName }}</div>
            <div class="leading-5" v-if="!isMinimized">{{ t("trade_viewer.tab") }}: {{ trade.stashName }} ({{ t("trade_viewer.left") }}: {{ trade.stashLeft }}, {{ t("trade_viewer.top") }}: {{ trade.stashTop }})</div>
            <button
              class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800 absolute bottom-0 right-0 leading-4"
              v-if="!isMinimized"
              @click="ignoreTrade(trade)"
            >
              <i class="fas fa-times text-gray-400 w-4 h-4" />
            </button>
          </div>

          <div
            v-for="(buyer, buyerIdx) in trade.buyers.filter((_, idx) => idx < 4)"
            v-if="!isMinimized"
            class="flex flex-row gap-1 items-center mt-1 leading-4"
          >
            <div
              class="flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap h-6 leading-6">{{
                (buyerIdx !== 3 || trade.buyers.length <= 4) ? buyer : `and ${trade.buyers.length - 3} more`
            }}</div>

            <button
              class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800"
              v-if="buyerIdx !== 4 || trade.buyers.length <= 5"
              @click="messagePlayer(buyer)"
            >
              <i class="fas fa-paper-plane text-gray-400 w-4 h-4" />
            </button>
            <button
              class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800"
              v-if="buyerIdx !== 4 || trade.buyers.length <= 5"
              @click="invitePlayer(buyer)"
            >
              <i class="fas fa-user-plus text-gray-400 w-4 h-4" />
            </button>
            <button
              class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800"
              v-if="buyerIdx !== 4 || trade.buyers.length <= 5"
              @click="sendThanks(buyer, trade)"
            >
              <i class="fas fa-thumbs-up text-gray-400 w-4 h-4" />
            </button>
            <button
              class="flex-grow-0 rounded p-1 pt-1.5 pb-0.5 text-gray-100 bg-gray-800"
              v-if="buyerIdx !== 4 || trade.buyers.length <= 5"
              @click="ignorePlayer(buyer, trade)"
            >
              <i class="fas fa-times text-gray-400 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { TradeViewerWidget } from "./widget"

export default {
  widget: {
    type: "trade-viewer",
    instances: "single",
    initInstance: (): TradeViewerWidget => ({
      wmId: 0,
      wmType: "trade-viewer",
      wmTitle: "{icon=fa-sack-dollar}",
      wmWants: "hide",
      wmZorder: 106,
      wmFlags: [],
      anchor: {
        pos: "tl",
        x: 88,
        y: 26,
      },
    })
  }
}
</script>

<script setup lang="ts">
import { inject, ref, type Ref } from "vue";
import Widget from "../overlay/Widget.vue";
import { useI18n } from "vue-i18n";
import {Host, MainProcess} from "@/web/background/IPC";
import type { WidgetManager } from "../overlay/interfaces.js";
import { parseLine } from "./client-log";

const props = defineProps<{
  config: TradeViewerWidget;
}>();

interface TradeRequest {
  id: string;
  item: string;
  priceName: string;
  priceAmount: number;
  stashName?: string;
  stashLeft?: number;
  stashTop?: number;
  buyers: string[];
}

const wm = inject<WidgetManager>("wm")!;
const { t } = useI18n();
const isMinimized: Ref<boolean> = ref(true);
const activeTrades: Ref<Array<TradeRequest>> = ref([]);

if (props.config.wmFlags[0] === "uninitialized") {
  props.config.wmFlags = ["invisible-on-blur"];
  props.config.anchor = {
    pos: "tl",
    x: Math.random() * (40 - 20) + 20,
    y: Math.random() * (40 - 20) + 20,
  };
  wm.show(props.config.wmId);
}

Host.onEvent("MAIN->OVERLAY::focus-change", (state) => {
  isMinimized.value = !state.overlay;
});

Host.onEvent("MAIN->CLIENT::game-log", (e) => {
  for (const line of e.lines) {
    const message = parseLine(line);

    if (!message?.charName || !message?.trade) {
      continue;
    }

    const tradeId = [
      message.trade.item.name.toLowerCase().replaceAll(/[\s,]+/g, "-"),
      (message.trade.tab?.name ?? 'bulk').toLowerCase().replaceAll(/[\s,]+/g, "-"),
      message.trade.tab?.left,
      message.trade.tab?.top,
    ]
      .filter(e => e)
      .join('-');

    const existingTrade = activeTrades.value.find(trade => trade.id === tradeId);

  if (existingTrade) {
    existingTrade.buyers = [...new Set([...existingTrade.buyers, message.charName])];
  } else {
    activeTrades.value.push({
      id: tradeId,
      item: message.trade.item.name,
      priceName: message.trade.price.name,
      priceAmount: message.trade.price.amount,
      stashName: message.trade.tab?.name,
      stashLeft: message.trade.tab?.left,
      stashTop: message.trade.tab?.top,
      buyers: [
        message.charName
      ],
    });
  }
  }
});

function sendChatEvent(text: string, send: boolean) {
  MainProcess.sendEvent({
    name: "CLIENT->MAIN::user-action",
    payload: {
      action: "paste-in-chat",
      text,
      send,
    },
  });
}

function messagePlayer(player: string) {
  sendChatEvent(`@${player} `, false);
}

function invitePlayer(player: string) {
  sendChatEvent(`/invite ${player} `, true);
}

function sendThanks(player: string, trade: TradeRequest) {
  sendChatEvent(`@${player} ${t("trade_viewer.thanks")}`, true);
  ignoreTrade(trade);
}

function ignorePlayer(player: string, trade: TradeRequest) {
  trade.buyers = trade.buyers.filter(buyer => buyer !== player);
  if (trade.buyers.length === 0) {
    activeTrades.value = activeTrades.value.filter(el => el.id !== trade.id);
  }
}

function ignoreTrade(trade: TradeRequest) {
  activeTrades.value = activeTrades.value.filter((el: TradeRequest) => el.id !== trade.id);
}
</script>
