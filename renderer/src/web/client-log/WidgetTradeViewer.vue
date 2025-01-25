<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div
      class="widget-default-style p-1 flex flex-col overflow-y-auto min-h-0 w-72"
      style="min-width: 5rem"
    >
      <div class="text-gray-100 p-1 flex items-center justify-between gap-4">
        <span class="truncate">{{ config.wmTitle || "Untitled" }}</span>
      </div>
      <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0">
        <div
          v-for="trade in activeTrades"
          :key="trade.id"
          class="rounded p-2 leading-4 text-gray-100 border-b-gray-800 border-b-2 last:border-b-0"
        >
          <div>{{ trade.item }} ({{ trade.priceAmount }}x {{ trade.priceName }})</div>
          <div>Tab: {{ trade.stashName }} (left: {{ trade.stashLeft }}, top: {{ trade.stashTop }})</div>
          <div v-for="buyer in trade.buyers" class="flex flex-row gap-1 items-center mt-1">
            <div class="flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap">{{ buyer }}</div>

            <button class="flex-grow-0 rounded p-1 text-gray-100 bg-gray-800" @click="messagePlayer(buyer)">
              <i class="fas fa-paper-plane text-gray-400 w-4 h-4" /></button>
            <button class="flex-grow-0 rounded p-1 text-gray-100 bg-gray-800" @click="teleportToPlayer(buyer)">
              <i class="fas fa-map-marker-alt text-gray-400 w-4 h-4" /></button>
            <button class="flex-grow-0 rounded p-1 text-gray-100 bg-gray-800" @click="invitePlayer(buyer)">
              <i class="fas fa-user-plus text-gray-400 w-4 h-4" /></button>
            <button class="flex-grow-0 rounded p-1 text-gray-100 bg-gray-800" @click="sendThanks(buyer)">
              <i class="fas fa-thumbs-up text-gray-400 w-4 h-4" /></button>
            <button class="flex-grow-0 rounded p-1 text-gray-100 bg-gray-800" @click="ignore(buyer, trade)">
              <i class="fas fa-times text-gray-400 w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { Widget } from "../overlay/widgets"

export default {
  widget: {
    type: "trade-viewer",
    instances: "{icon=fa-filter}",
    initInstance: (): Widget => ({
      wmId: 105,
      wmType: "trade-viewer",
      wmTitle: "Trade Viewer",
      wmWants: "show",
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
import { inject, ref } from "vue";
import { useI18n } from "vue-i18n";
import {Host, MainProcess} from "@/web/background/IPC";
import type { WidgetManager } from "../overlay/interfaces.js";
import Widget from "../overlay/Widget.vue";
import { parseLine } from "./client-log";

const props = defineProps<{
  config: Widget;
}>();

interface TradeRequest {
  id: string;
  item: string;
  priceName: string;
  priceAmount: number;
  stashName: string;
  stashLeft: number;
  stashTop: number;
  buyers: string[];
}

const wm = inject<WidgetManager>("wm")!;
const { t } = useI18n();
const activeTrades: Array<TradeRequest> = ref([
  {
    id: "server-test-0-from-ego",
    item: "Astramentalis Stellar Amulet",
    priceName: "Divine Orb",
    priceAmount: 1,
    stashName: "sale",
    stashLeft: "1",
    stashTop: "1",
    buyers: [
      "ego-2513",
      "ego-1514",
      "ego-101c",
      "ego-a8e with a very long name to test it",
      "ego-1e18"
    ]
  },
  {
    id: "server-test-1-from-ego",
    item: "Ingenuity, Utility Belt",
    priceName: "Divine Orb",
    priceAmount: 1,
    stashName: "sale",
    stashLeft: "1",
    stashTop: "1",
    buyers: [
      "ego-26bd",
      // "ego-1c51"
    ]
  }
]);

if (props.config.wmFlags[0] === "uninitialized") {
  props.config.wmFlags = ["invisible-on-blur"];
  props.config.anchor = {
    pos: "tl",
    x: Math.random() * (40 - 20) + 20,
    y: Math.random() * (40 - 20) + 20,
  };
  props.config.entries = [];
  wm.show(props.config.wmId);
}

Host.onEvent("MAIN->CLIENT::game-log", (e) => {
  console.log('e', e);
  for (const line of e.lines) {
    const message = parseLine(line);

    console.log('message', message)

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
    existingTrade.buyers = [...new Set([...existingTrade.buyers, message.charName])]
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

function teleportToPlayer(player: string) {
  sendChatEvent(`/hideout ${player} `, true);
}

function invitePlayer(player: string) {
  sendChatEvent(`/invite ${player} `, true);
}

function sendThanks(player: string) {
  sendChatEvent(`@${player} Thanks for the trade!`, true);
}

function ignore(player: string, trade: TradeRequest) {
  trade.buyers = trade.buyers.filter(buyer => buyer !== player);
  if (trade.buyers.length === 0) {
    activeTrades.value = activeTrades.value.filter(el => el.id !== trade.id);
  }
}
</script>
