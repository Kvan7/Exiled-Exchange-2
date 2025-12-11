/* eslint-disable camelcase */
import { CLIENT_STRINGS as _$ } from "@/assets/data";
import { createGlobalState } from "@vueuse/core";
import { readonly, shallowRef } from "vue";

export const useClientLog = createGlobalState(() => {
  const areaLevel = shallowRef<number>(1);
  const zoneName = shallowRef<string>("G1_1"); // default to riverbank
  const playerLevel = shallowRef<number>(1);

  function handleLine(line: string) {
    const text = line.split("] ").slice(1).join("] ");
    if (!text) return;

    let match: RegExpMatchArray | null;
    if ((match = text.match(_$.LOG_ZONE_GEN))) {
      const zone = match.groups!.zone.toLowerCase();
      if (zone.includes("town") || zone.includes("hideout")) {
        return;
      }

      if (zone === "g1_1") {
        // can only be on riverbank if new character
        playerLevel.value = 1;
      }

      areaLevel.value = Number.parseInt(match.groups!.area_level, 10);
      zoneName.value = match.groups!.zone;
    } else if ((match = text.match(_$.LOG_LEVEL_UP))) {
      playerLevel.value = Number.parseInt(match.groups!.level, 10);
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
