from constants.lang import KOREAN, LANG, RUSSIAN

REDUCED_ATTRIBUTE_REQUIREMENTS = 3639275092
SANCTUM_REDUCED_GOLD_MERCHANT_COST = 3096446459
REDUCED_CHARGES_PER_USE = 388617051
FLASK_CHARGES_USED = 644456512
CHARM_CHARGES_USED = 1570770415
SLOWING_POTENCY_ON_YOU = 924253255
BLEED_WHEN_YOU_ARE_HIT = 3423694372
BLEED_WHEN_YOU_ARE_HIT_BY_ATTACK = 2155467472
DAMAGE_TAKEN_WHEN_NOT_HIT_RECENTLY = 67637087
MANA_COST_OF_SKILLS = 474294393
IGNITE_EFFECT_ON_YOU = 1269971728
RITUAL_TABLET_REROLL_COST = 2282052746
RECOVERY_APPLIED_INSTANTLY = 2503377690
INSTANT_RECOVERY = 1526933524
FEWER_ENEMIES_SURROUNDED = 2267564181
SKILL_COOLDOWN_SECONDS = 396200591
MOVEMENT_SPEED_PENALTY = 2590797182
TAKE_PERCENT_BLOCKED_DAMAGE = 2905515354
INCREASED_DAMAGE_TAKEN = 3691641145
BLEED_DURATION_ON_YOU = 1692879867
CURSE_DURATION_ON_YOU = 2920970371

GEAR_RARITY = 3917489142
TABLET_OR_MAP_RARITY = 2306002879
WEAPON_LIFE_LEECH = 55876295
GEAR_LIFE_LEECH = 2557965901
WEAPON_MANA_LEECH = 669069897
GEAR_MANA_LEECH = 707457662

# value stats
JEWEL_RADIUS_CHANGE = 3891355829
JEWEL_RING_RADIUS = 3642528642
ALLOCATES_NOTABLE = 2954116742
ULTIMATUM_WAGER_TYPE = 3076483222
UNIQUE_JEWEL_PLUS_LEVEL = 448592698
DISCONNECTED_PASSIVES_AROUND_KEYSTONE = 2422708892
TIME_LOST_HISTORIC_JEWEL = 3418580811

# =============================================================================
#
#
#
# =============================================================================

"""For stats where we want lower/negative values"""
BETTER_LOOKUP: dict[int, int] = {
    REDUCED_ATTRIBUTE_REQUIREMENTS: -1,
    SANCTUM_REDUCED_GOLD_MERCHANT_COST: -1,
    REDUCED_CHARGES_PER_USE: -1,
    SLOWING_POTENCY_ON_YOU: -1,
    BLEED_WHEN_YOU_ARE_HIT: -1,
    BLEED_WHEN_YOU_ARE_HIT_BY_ATTACK: -1,
    DAMAGE_TAKEN_WHEN_NOT_HIT_RECENTLY: -1,
    FLASK_CHARGES_USED: -1,
    CHARM_CHARGES_USED: -1,
    IGNITE_EFFECT_ON_YOU: -1,
    JEWEL_RING_RADIUS: 0,
    ALLOCATES_NOTABLE: 0,
    TIME_LOST_HISTORIC_JEWEL: 0,
    RITUAL_TABLET_REROLL_COST: -1,
    FEWER_ENEMIES_SURROUNDED: -1,
    SKILL_COOLDOWN_SECONDS: -1,
    MOVEMENT_SPEED_PENALTY: -1,
    TAKE_PERCENT_BLOCKED_DAMAGE: -1,
    INCREASED_DAMAGE_TAKEN: -1,
    BLEED_DURATION_ON_YOU: -1,
    CURSE_DURATION_ON_YOU: -1,
}

"""
For stats where we want lower/negative values
BUT the trade site shows the 'better' version of the string
ex:
    trade site shows                  , positive negative better on trade site
    #% increased Attribute Requirements, negative better -> so it is in BETTER_LOOKUP
    #% increased Charges per Use      , negative better -> so it is in BETTER_LOOKUP
    #% reduced Charm Charges Used     , positive better -> so it is in FLIPPED_NEGATE
                                    Trade site shows the negated version, and wants positive numbers
"""
TRADE_INVERTED: set[int] = {
    FLASK_CHARGES_USED,
    CHARM_CHARGES_USED,
    # MANA_COST_OF_SKILLS, # Already flipped in descriptions
    IGNITE_EFFECT_ON_YOU,
}

VALUE_TO_DESCRIPTION_ID: dict[int, str] = {
    JEWEL_RADIUS_CHANGE: "local_jewel_display_radius_change",
    JEWEL_RING_RADIUS: "local_jewel_variable_ring_radius_value",
    ALLOCATES_NOTABLE: "mod_granted_passive_hash",
    ULTIMATUM_WAGER_TYPE: "ultimatum_wager_type_hash",
    UNIQUE_JEWEL_PLUS_LEVEL: "unique_jewel_specific_skill_level_+_level",
    DISCONNECTED_PASSIVES_AROUND_KEYSTONE: "local_unique_jewel_disconnected_passives_can_be_allocated_around_keystone_hash",
    TIME_LOST_HISTORIC_JEWEL: "local_unique_jewel_alternate_tree_seed",
}

VALUE_TO_REF: dict[int, str] = {
    JEWEL_RADIUS_CHANGE: "Upgrades Radius to #",
    JEWEL_RING_RADIUS: "Only affects Passives in # Ring",
    ALLOCATES_NOTABLE: "Allocates #",
    ULTIMATUM_WAGER_TYPE: "Sacrifice up to # to receive double on Trial completion",
    UNIQUE_JEWEL_PLUS_LEVEL: "# to Level of all # Skills",
    DISCONNECTED_PASSIVES_AROUND_KEYSTONE: "Passives in Radius of # can be Allocated\nwithout being connected to your tree",
    TIME_LOST_HISTORIC_JEWEL: "Remembrancing # songworthy deeds by the line of #\nPassives in radius are Conquered by the Kalguur",
}

SUPPORTED_VALUES: set[int] = {
    JEWEL_RADIUS_CHANGE,
    JEWEL_RING_RADIUS,
    ALLOCATES_NOTABLE,
    TIME_LOST_HISTORIC_JEWEL,
    DISCONNECTED_PASSIVES_AROUND_KEYSTONE,
    UNIQUE_JEWEL_PLUS_LEVEL,
}

UNIQUE_ITEMS_FIXED_STATS: dict[str, list[str]] = {
    "Darkness Enthroned": ["#% increased effect of Socketed Items", "Has # Charm Slot"],
    "Cursecarver": [
        "#% increased Spell Damage",
        "#% increased Cast Speed",
        "#% increased Mana Regeneration Rate",
        "Gain # Life per Enemy Killed",
    ],
    "The Unborn Lich": ["#% increased Desecrated Modifier magnitudes"],
    "Morior Invictus": ["#% increased Armour, Evasion and Energy Shield"],
    "Rite of Passage": ["Used when you Kill a Rare or Unique Enemy"],
    "Grip of Kulemak": [
        "Inflict Abyssal Wasting on Hit",
        "#% increased Presence Area of Effect",
        "#% increased Light Radius",
    ],
    "Heroic Tragedy": ["Historic"],
    "Undying Hate": ["Historic"],
    "Megalomaniac": [],
    "From Nothing": [],
    "Prism of Belief": [],
    "Heart of the Well": [],
    "Against the Darkness": [],
}

SAME_TRANSLATIONS_DIFFERENT_STATS: dict[LANG, dict[str, list[str]]] = {
    RUSSIAN: {
        f"explicit.stat_{GEAR_RARITY}": [f"explicit.stat_{TABLET_OR_MAP_RARITY}"],
        f"explicit.stat_{TABLET_OR_MAP_RARITY}": [f"explicit.stat_{GEAR_RARITY}"],
    },
    KOREAN: {
        f"explicit.stat_{WEAPON_LIFE_LEECH}": [f"explicit.stat_{GEAR_LIFE_LEECH}"],
        f"explicit.stat_{GEAR_LIFE_LEECH}": [f"explicit.stat_{WEAPON_LIFE_LEECH}"],
        f"explicit.stat_{WEAPON_MANA_LEECH}": [f"explicit.stat_{GEAR_MANA_LEECH}"],
        f"explicit.stat_{GEAR_MANA_LEECH}": [f"explicit.stat_{WEAPON_MANA_LEECH}"],
    },
}
