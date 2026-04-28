import { CLIENT_STRINGS as _$ } from "@/assets/data";
import { ClientLogEvent } from "@ipc/types";

export enum ClientLogInfoType {
  Log = "log",
  GameStart = "game-start",
  Login = "login",
  LoadZone = "load-zone",
  LevelUp = "level-up",
}

export function parseClientLogText(
  text: string,
  datetime: string,
  millis: number,
): ClientLogEvent {
  let match: RegExpMatchArray | null;
  let data: ClientLogEvent = {
    ts: Date.parse(datetime),
    ms: millis,
    type: ClientLogInfoType.Log,
  };

  if (text === "[STARTUP] Game Start") {
    data.type = ClientLogInfoType.GameStart;
  } else if ((match = text.match(_$.LOG_ZONE_GEN))) {
    const zone = match.groups!.zone.toLowerCase();
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
      // create output data
      data = {
        ...data,
        level: Number.parseInt(match.groups!.level, 10),
        charName: match.groups!.char_name,
        charClass: match.groups!.char_class,
        type: ClientLogInfoType.LevelUp,
      };
    }
  }

  return data;
}
