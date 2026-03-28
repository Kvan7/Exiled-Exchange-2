from typing import Literal

LOCAL_SUFFIX = " (Local)"

GENDER_CLIENT_STRINGS_ORDER = [
    "NS",
    "MS",
    "FS",
    "NP",
    "O",
    "ANY",
    "M",
    "F",
]


TAG = Literal[
    "life",
    "mana",
    "fire",
    "cold",
    "lightning",
    "chaos",
    "speed",
    "critical",
    "physical",
    "attribute",
    "ailment",
    "aura",
    "bleed",
    "caster",
    "minion",
    "defences",
    "poison",
    "gem",
    "elemental",
    "resistance",
    "strength",
    "dexterity",
    "intelligence",
    "attack",
    "damage",
    "maximum",
    "curse",
    "bonded",
]

LIFE_TAG: TAG = "life"
MANA_TAG: TAG = "mana"
FIRE_TAG: TAG = "fire"
COLD_TAG: TAG = "cold"
LIGHTNING_TAG: TAG = "lightning"
CHAOS_TAG: TAG = "chaos"
SPEED_TAG: TAG = "speed"
CRITICAL_TAG: TAG = "critical"
PHYSICAL_TAG: TAG = "physical"
ATTRIBUTE_TAG: TAG = "attribute"
AILMENT_TAG: TAG = "ailment"
AURA_TAG: TAG = "aura"
BLEED_TAG: TAG = "bleed"
CASTER_TAG: TAG = "caster"
MINION_TAG: TAG = "minion"
DEFENCES_TAG: TAG = "defences"
POISON_TAG: TAG = "poison"
GEM_TAG: TAG = "gem"
ELEMENTAL_TAG: TAG = "elemental"
RESISTANCE_TAG: TAG = "resistance"
STR_TAG: TAG = "strength"
DEX_TAG: TAG = "dexterity"
INT_TAG: TAG = "intelligence"
ATTACK_TAG: TAG = "attack"
DAMAGE_TAG: TAG = "damage"
MAXIMUM_TAG: TAG = "maximum"
CURSE_TAG: TAG = "curse"
BONDED_TAG: TAG = "bonded"
