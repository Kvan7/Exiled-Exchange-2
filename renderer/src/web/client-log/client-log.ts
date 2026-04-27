import { CLIENT_STRINGS as _$ } from "@/assets/data";
import { createGlobalState } from "@vueuse/core";
import { readonly, shallowRef } from "vue";
import { Host } from "@/web/background/IPC";
import { GeneralLogEvent, LevelUpEvent, LoadZoneEvent } from "@ipc/types";

const LogRegex =
  /^(?<datetime>\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) (?<millis>\d+) (?<source>[a-f0-9]+) \[.+ .+ .+\] (?<text>.*)$/;

export enum ClientLogInfoType {
  Log = "log",
  GameStart = "game-start",
  Login = "login",
  LoadZone = "load-zone",
  LevelUp = "level-up",
}

export const useClientLog = createGlobalState(() => {
  const areaLevel = shallowRef<number>(1);
  const zoneName = shallowRef<string>("G1_1"); // default to riverbank
  const playerLevel = shallowRef<number>(1);
  const lastCharacter = shallowRef<string>("");
  let gameStartMillis = 0;

  function handleLine(line: string) {
    const wholeLineMatch = line.match(LogRegex);
    if (!wholeLineMatch) return;
    const { text, datetime, millis } = wholeLineMatch.groups!;
    const millisNum = Number.parseInt(millis, 10);

    let match: RegExpMatchArray | null;
    let data: GeneralLogEvent | LoadZoneEvent | LevelUpEvent = {
      ts: Date.parse(datetime),
      ms: millisNum,
      type: ClientLogInfoType.Log,
    };

    if (text === "[STARTUP] Game Start") {
      gameStartMillis = millisNum;
      data.type = ClientLogInfoType.GameStart;
    } else if ((match = text.match(_$.LOG_ZONE_GEN))) {
      const zone = match.groups!.zone.toLowerCase();

      // ignore town/hideout for purpose of level tracking
      if (!(zone.includes("town") || zone.includes("hideout"))) {
        if (zone === "g1_1") {
          // can only be on riverbank if new character
          playerLevel.value = 1;
        }

        areaLevel.value = Number.parseInt(match.groups!.area_level, 10);
        zoneName.value = zone;
      }

      // create output data
      data = {
        ...data,
        zone: zone,
        areaLevel: Number.parseInt(match.groups!.area_level, 10),
        seed: Number.parseInt(match.groups!.seed, 10),
        type: ClientLogInfoType.LoadZone,
      };
    } else if (text.startsWith(":")) {
      // we are an info message shown to the player in chat
      const colonLess = text.slice(1).trim();
      if ((match = colonLess.match(_$.LOG_LEVEL_UP))) {
        playerLevel.value = Number.parseInt(match.groups!.level, 10);
        lastCharacter.value = match.groups!.char_name;

        // create output data
        data = {
          ...data,
          level: playerLevel.value,
          charName: lastCharacter.value,
          charClass: match.groups!.char_class,
          type: ClientLogInfoType.LevelUp,
        };
      }
    }

    if (millisNum < gameStartMillis) {
      console.warn("Millis rolled over");
    }

    if (data.type !== ClientLogInfoType.Log) {
      // skip everything we dont care about
      Host.sendEvent({
        name: "CLIENT->MAIN::write-data",
        payload: {
          action: "client-log-event",
          data,
          close: false,
        },
      });
    }
  }

  function setPlayerLevel(level: number | "") {
    if (level === "") {
      return;
    }
    playerLevel.value = level;
  }

  return {
    handleLine,
    playerLevel: readonly(playerLevel),
    areaLevel: readonly(areaLevel),
    zoneName: readonly(zoneName),
    setPlayerLevel,
  };
});
