/* eslint-disable camelcase */
import { CLIENT_STRINGS as _$ } from "@/assets/data";

export function handleLine(line: string) {
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
