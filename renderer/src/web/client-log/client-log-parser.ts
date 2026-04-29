import { CLIENT_STRINGS as _$ } from "@/assets/data";
import { ClientLogEvent } from "@ipc/types";

export enum ClientLogInfoType {
  Log = "log",
  GameStart = "game-start",
  Login = "login",
  LoadZone = "load-zone",
  LevelUp = "level-up",
  GameVersion = "game-version",
  AltTab = "alt-tab",
  Npc = "npc",
  PlayerDeath = "player-death",
  PassiveTree = "passive-tree",
  PermanentBonus = "permanent-bonus",
  SkillPoint = "skill-point",
}

enum LogNamespace {
  None,
  Startup = "STARTUP",
  Http2 = "HTTP2",
  Window = "WINDOW",
}

const GAME_VERSION_LINE = "User agent: PoE poe2_production/tags/";
const KNOWN_NPC_NAMES = new Set([
  "Renly",
  "Ghostly Voice",
  "The Rust King",
  "Beira of the Rotten Pack",
  "The Bloated Miller",
  "Mortimer",
  "Wounded Man",
]);
const SLAIN_REGEX = /(?<char_name>.+) has been slain./;
const PASSIVE_SKILL_REGEX_REF =
  /Successfully (?<direction>(un)?allocated) passive skill id: (?<node_id>.+), name: (?<node_name>.+)/;
const PERMANENT_BONUS_REGEX = /(?<char_name>.+) has received (?<bonus>.+)/;
const SKILL_POINT_REGEX =
  /You have received (?<points>\d+) Passive Skill Point\./;

function parseLogVersion0(
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

  let namespace: LogNamespace = LogNamespace.None;
  if (text.startsWith("[")) {
    const endNamespaceIndex = text.indexOf("]");
    if (endNamespaceIndex !== -1) {
      namespace = text.slice(1, endNamespaceIndex) as LogNamespace;
      text = text.slice(endNamespaceIndex + 1).trim();
    }
  }

  if (namespace === LogNamespace.Startup) {
    if (text === "Game Start") {
      // game start

      data.type = ClientLogInfoType.GameStart;
    }
  } else if (namespace === LogNamespace.Http2) {
    if (text.startsWith(GAME_VERSION_LINE)) {
      // game version

      const sliceA = text.slice(GAME_VERSION_LINE.length);
      const version = sliceA.split(" ", 1)[0];

      data = {
        ...data,
        type: ClientLogInfoType.GameVersion,
        version,
      };
    }
  } else if (namespace === LogNamespace.Window) {
    if (text === "Gained focus") {
      data = {
        ...data,
        type: ClientLogInfoType.AltTab,
        gameFocused: true,
      };
    } else if (text === "Lost focus") {
      data = {
        ...data,
        type: ClientLogInfoType.AltTab,
        gameFocused: false,
      };
    }
  } else if (namespace === LogNamespace.None) {
    if (text[0] === ":") {
      // we are an info(local??) message shown to the player in chat
      const colonLess = text.slice(1).trim();

      if ((match = colonLess.match(_$.LOG_LEVEL_UP))) {
        // level up

        data = {
          ...data,
          type: ClientLogInfoType.LevelUp,
          level: Number.parseInt(match.groups!.level, 10),
          charName: match.groups!.char_name,
          charClass: match.groups!.char_class,
        };
      } else if ((match = colonLess.match(PERMANENT_BONUS_REGEX))) {
        // permanent bonus
        data = {
          ...data,
          type: ClientLogInfoType.PermanentBonus,
          permanentBonus: match.groups!.bonus,
          charName: match.groups!.char_name,
        };
      } else if ((match = colonLess.match(SKILL_POINT_REGEX))) {
        // permanent bonus
        data = {
          ...data,
          type: ClientLogInfoType.SkillPoint,
          points: Number.parseInt(match.groups!.points, 10),
        };
      }
    } else if (text[0] === "#") {
      // some global message
    } else if (text[0] === "@") {
      // some whisper
    } else if (text[0] === "&") {
      // some guild message
    } else if (text[0] === "$") {
      // some trade message
    } else if ((match = text.match(_$.LOG_ZONE_GEN))) {
      // zone load

      const zone = match.groups!.zone.toLowerCase();

      data = {
        ...data,
        type: ClientLogInfoType.LoadZone,
        zone: zone,
        areaLevel: Number.parseInt(match.groups!.area_level, 10),
        seed: Number.parseInt(match.groups!.seed, 10),
      };
    } else if ((match = text.match(SLAIN_REGEX))) {
      // ded

      data = {
        ...data,
        type: ClientLogInfoType.PlayerDeath,
        charName: match.groups!.char_name,
      };
    } else if ((match = text.match(PASSIVE_SKILL_REGEX_REF))) {
      // passive point spend/refund

      data = {
        ...data,
        type: ClientLogInfoType.PassiveTree,
        allocate: match.groups!.direction === "allocated",
        nodeId: match.groups!.node_id,
        nodeName: match.groups!.node_name,
      };
    } else {
      // either normal log with no namespace, or some npc/local chat message
      const firstColonIndex = text.indexOf(":");
      if (firstColonIndex !== -1) {
        const possibleName = text.slice(0, firstColonIndex).trim();
        const message = text.slice(firstColonIndex + 1).trim();
        if (KNOWN_NPC_NAMES.has(possibleName)) {
          // npc event

          data = {
            ...data,
            type: ClientLogInfoType.Npc,
            npcName: possibleName,
            message,
          };
        }
      }
    }
  }
  return data;
}

export function parseClientLogText(
  text: string,
  datetime: string,
  millis: number,
  logParseVersion: number,
): ClientLogEvent {
  if (logParseVersion === 0) {
    return parseLogVersion0(text, datetime, millis);
  }

  return parseLogVersion0(text, datetime, millis);
}

export function getClientLogParseVersion(version: string) {
  if (lessThanVersion(version, "0.4.0j")) {
    return 0;
  }

  return 0;
}

function lessThanVersion(vLeft: string, vRight: string): boolean {
  const [leftMajor, leftMinor, leftPatch] = vLeft.split(".");
  const [rightMajor, rightMinor, rightPatch] = vRight.split(".");

  if (leftMajor !== rightMajor) {
    return Number.parseInt(leftMajor, 10) < Number.parseInt(rightMajor, 10);
  } else if (leftMinor !== rightMinor) {
    return Number.parseInt(leftMinor, 10) < Number.parseInt(rightMinor, 10);
  } else {
    const leftPatchNum = Number.parseInt(
      leftPatch.slice(0, leftPatch.length - 1),
      10,
    );
    const leftPatchSuffix = leftPatch.slice(leftPatch.length - 1);
    const rightPatchNum = Number.parseInt(
      rightPatch.slice(0, leftPatch.length - 1),
      10,
    );
    const rightPatchSuffix = rightPatch.slice(rightPatch.length - 1);

    if (leftPatchNum !== rightPatchNum) {
      return leftPatchSuffix < rightPatchSuffix;
    } else {
      return leftPatchSuffix < rightPatchSuffix;
    }
  }
}
