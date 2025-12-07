from typing import Literal

MOD_TYPE = Literal[
    "explicit",
    "implicit",
    "fractured",
    "enchant",
    "rune",
    "desecrated",
    "sanctum",
    "skill",
    "pseudo",
]

EXPLICIT: MOD_TYPE = "explicit"
IMPLICIT: MOD_TYPE = "implicit"
FRACTURED: MOD_TYPE = "fractured"
ENCHANT: MOD_TYPE = "enchant"
RUNE: MOD_TYPE = "rune"
DESECRATED: MOD_TYPE = "desecrated"
SANCTUM: MOD_TYPE = "sanctum"
SKILL: MOD_TYPE = "skill"
PSEUDO: MOD_TYPE = "pseudo"

MOD_TYPES: list[MOD_TYPE] = [
    EXPLICIT,
    IMPLICIT,
    FRACTURED,
    ENCHANT,
    RUNE,
    DESECRATED,
    SANCTUM,
    SKILL,
    PSEUDO,
]

MOD_TYPES_SET: set[MOD_TYPE] = set(MOD_TYPES)
