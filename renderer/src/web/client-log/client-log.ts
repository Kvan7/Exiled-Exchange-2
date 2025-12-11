/* eslint-disable camelcase */
import { CLIENT_STRINGS as _$ } from "@/assets/data";
import { createGlobalState } from "@vueuse/core";
import { readonly, shallowRef } from "vue";

export const useClientLog = createGlobalState(() => {
  const areaLevel = shallowRef<number>(1);
  const zone = shallowRef<string>("G1_1"); // default to riverbank
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
      console.log(
        `Created Zone Level: ${match.groups!.area_level} of type ${match.groups!.zone}`,
      );
    } else if ((match = text.match(_$.LOG_LEVEL_UP))) {
      console.log(`Level up: ${match.groups!.level}`);
    }
  }

  function setPlayerLevel(level: number) {
    playerLevel.value = level;
  }

  return {
    handleLine,
    playerLevel: readonly(playerLevel),
    areaLevel: readonly(areaLevel),
    zone: readonly(zone),
    setPlayerLevel,
  };
});
