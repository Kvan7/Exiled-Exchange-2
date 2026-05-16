---
title: Client Log Parser
---

Parses the game's log file (`Client.txt`) and puts the useful portion of its contents into a standardized `jsonl|ndjson` format, each line is a JSON object. Each line will **always** contain 3 standardized fields and a selection of additional fields depending on the type of log entry. This file currently (`0.15.0`) should be treated as an **UNORDERED** collection of log entries. It is most likely to be chronologically ordered, but this is not guaranteed.

## Example

```jsonl
{"ts": 1697000000000, "ms": 12347, "type": "load-zone", "zone": "G1_4", "areaLevel": 4, "seed": 3044246516}
{"ts": 1697000001000, "ms": 13584, "type": "player-death", "charName": "CharacterNameHere"}
{"ts": 1697000002000, "ms": 14488, "type": "permanent-bonus", "charName": "CharacterNameHere", "permanentBonus": "+10% to [Resistances|Cold Resistance]"}
```

## API Reference

### Standard Fields

| Key    | Type     | Extra Information                            |
| ------ | -------- | -------------------------------------------- |
| `ts`   | `number` | Timestamp in milliseconds                    |
| `ms`   | `number` | Computer power on time in milliseconds       |
| `type` | `string` | The type of log entry, see below for options |

### Log Entry Types

#### `log`

All not denoted log entries. These are filtered out by the parser so should never be seen.

| Key    | Type     | Extra Information                      |
| ------ | -------- | -------------------------------------- |
| `ts`   | `number` | Timestamp in milliseconds              |
| `ms`   | `number` | Computer power on time in milliseconds |
| `type` | `log`    | The type of log entry                  |

#### `game-start`

When the game has been launched.

| Key    | Type         | Extra Information                      |
| ------ | ------------ | -------------------------------------- |
| `ts`   | `number`     | Timestamp in milliseconds              |
| `ms`   | `number`     | Computer power on time in milliseconds |
| `type` | `game-start` | The type of log entry                  |

#### `login`

When a player logs into a character.

| Key    | Type     | Extra Information                      |
| ------ | -------- | -------------------------------------- |
| `ts`   | `number` | Timestamp in milliseconds              |
| `ms`   | `number` | Computer power on time in milliseconds |
| `type` | `login`  | The type of log entry                  |

#### `load-zone`

When a player loads into a zone.

| Key         | Type        | Extra Information                      |
| ----------- | ----------- | -------------------------------------- |
| `ts`        | `number`    | Timestamp in milliseconds              |
| `ms`        | `number`    | Computer power on time in milliseconds |
| `type`      | `load-zone` | The type of log entry                  |
| `zone`      | `string`    | Zone Id                                |
| `areaLevel` | `number`    | The area level of the zone             |
| `seed`      | `number`    | The seed of the zone                   |

```jsonl
{"ts": 1697000000000, "ms": 12347, "type": "load-zone", "zone": "G1_4", "areaLevel": 4, "seed": 3044246516}
```

#### `level-up`

When a character levels up.

| Key         | Type       | Extra Information                      |
| ----------- | ---------- | -------------------------------------- |
| `ts`        | `number`   | Timestamp in milliseconds              |
| `ms`        | `number`   | Computer power on time in milliseconds |
| `type`      | `level-up` | The type of log entry                  |
| `charName`  | `string`   | The name of the character              |
| `charClass` | `string`   | The class of the character             |
| `level`     | `number`   | The new level of the character         |

```jsonl
{"ts": 1697000000000, "ms": 12347, "type": "level-up", "charName": "CharacterNameHere", "charClass": "Warrior", "level": 85}
```

#### `game-version`

Game version, helpful for switching routing or log parsing logic

| Key       | Type           | Extra Information                                |
| --------- | -------------- | ------------------------------------------------ |
| `ts`      | `number`       | Timestamp in milliseconds                        |
| `ms`      | `number`       | Computer power on time in milliseconds           |
| `type`    | `game-version` | The type of log entry                            |
| `version` | `string`       | The game version string, poe2 is prefixed by 4.* |

```jsonl
{"ts": 1697000000000, "ms": 12347, "type": "game-version", "version": "4.5.0a"}
```

#### `alt-tab`

| Key           | Type      | Extra Information                                         |
| ------------- | --------- | --------------------------------------------------------- |
| `ts`          | `number`  | Timestamp in milliseconds                                 |
| `ms`          | `number`  | Computer power on time in milliseconds                    |
| `type`        | `alt-tab` | The type of log entry                                     |
| `gameFocused` | `boolean` | false when the game lost focus, true when it gained focus |

```jsonl
{"ts": 1697000000000, "ms": 12347, "type": "alt-tab", "gameFocused": false}
```

#### `npc`

Npc dialog lines, must be ones that show up in client chat window. So quest states are usually not included in this.

| Key       | Type     | Extra Information                      |
| --------- | -------- | -------------------------------------- |
| `ts`      | `number` | Timestamp in milliseconds              |
| `ms`      | `number` | Computer power on time in milliseconds |
| `type`    | `npc`    | The type of log entry                  |
| `npcName` | `string` | The name of the NPC                    |
| `message` | `string` | The NPC's message                      |

```jsonl
{"ts": 1697000000000, "ms": 12347, "type": "npc", "npcName": "NpcNameHere", "message": "Message here"}
```

#### `player-death`

Entries for non-hardcore viable characters

| Key        | Type           | Extra Information                      |
| ---------- | -------------- | -------------------------------------- |
| `ts`       | `number`       | Timestamp in milliseconds              |
| `ms`       | `number`       | Computer power on time in milliseconds |
| `type`     | `player-death` | The type of log entry                  |
| `charName` | `string`       | The name of the character              |

```jsonl
{"ts": 1697000001000, "ms": 13584, "type": "player-death", "charName": "CharacterNameHere"}
```

#### `passive-tree`

Timestamps for when allocating nodes on passive tree

| Key        | Type           | Extra Information                             |
| ---------- | -------------- | --------------------------------------------- |
| `ts`       | `number`       | Timestamp in milliseconds                     |
| `ms`       | `number`       | Computer power on time in milliseconds        |
| `type`     | `passive-tree` | The type of log entry                         |
| `allocate` | `boolean`      | Whether the node was allocated or deallocated |
| `nodeId`   | `string`       | The id of the passive node                    |
| `nodeName` | `string`       | The name of the passive node                  |

```jsonl
{"ts": 1697000000000, "ms": 12347, "type": "passive-tree", "allocate": true, "nodeId": "duelist_mercenary_notable2", "nodeName": "Remorseless"}
```

#### `permanent-bonus`

Campaign granted permanent bonuses, such as from Beira, Candlemass, or clicking objectives.

| Key              | Type              | Extra Information                      |
| ---------------- | ----------------- | -------------------------------------- |
| `ts`             | `number`          | Timestamp in milliseconds              |
| `ms`             | `number`          | Computer power on time in milliseconds |
| `type`           | `permanent-bonus` | The type of log entry                  |
| `charName`       | `string`          | The name of the character              |
| `permanentBonus` | `string`          | The bonus string                       |

```jsonl
{"ts": 1697000002000, "ms": 14488, "type": "permanent-bonus", "charName": "CharacterNameHere", "permanentBonus": "+10% to [Resistances|Cold Resistance]"}
```

#### `skill-point`

Specific type of permanent bonus for skill points, Mighty Silverfist or completing areas of corruption on the atlas

| Key         | Type                                                                                              | Extra Information                      |
| ----------- | ------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `ts`        | `number`                                                                                          | Timestamp in milliseconds              |
| `ms`        | `number`                                                                                          | Computer power on time in milliseconds |
| `type`      | `skill-point`                                                                                     | The type of log entry                  |
| `points`    | `number`                                                                                          | Number of points, mostly 1 or 2        |
| `pointType` | `passive\|weapon-set\|atlas\|map-boss\|arbiter-boss\|abyss\|ritual\|delirium\|expedition\|breach` | type of passive point                  |

```jsonl
{"ts": 1697000000000, "ms": 12347, "type": "skill-point", "points": 1, "pointType": "passive"}
```

#### `map-nav`

What the foreground scene is changed to, may indicate loading or map/atlas opening

| Key       | Type      | Extra Information                                                                                                                                       |
| --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ts`      | `number`  | Timestamp in milliseconds                                                                                                                               |
| `ms`      | `number`  | Computer power on time in milliseconds                                                                                                                  |
| `type`    | `map-nav` | The type of log entry                                                                                                                                   |
| `mapName` | `string`  | The name of the map navigated to, or `(null)` for loading screen, `(unknown)` for main menu, `Act X` for fullscreen map, `Atlas` for opening map device |

```jsonl
{"ts": 1697000000000, "ms": 12347, "type": "map-nav", "mapName": "Act 1"}
```

#### `afk`

Entry for when the player becomes afk, or stops being afk, time of afk can be assumed to be ~`15 minutes + isAfk:false - isAfk:true` time

| Key     | Type      | Extra Information                                |
| ------- | --------- | ------------------------------------------------ |
| `ts`    | `number`  | Timestamp in milliseconds                        |
| `ms`    | `number`  | Computer power on time in milliseconds           |
| `type`  | `afk`     | The type of log entry                            |
| `isAfk` | `boolean` | Whether player is starting or stopping being afk |

```jsonl
{"ts": 1697000000000, "ms": 12347, "type": "afk", "isAfk": true}
```
