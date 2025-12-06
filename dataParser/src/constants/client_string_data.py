from collections.abc import Sequence
from typing import Callable

from contracts.models.base_client_string import BaseClientString
from contracts.models.regex_client_string import RegexClientString
from models.array_client_string import ArrayClientString
from models.capture_placeholder_client_string import CapturePlaceholderClientString
from models.client_string import ClientString
from models.const_client_string import ConstClientString
from models.const_regex_client_string import ConstRegexClientString

CLIENT_STRING_JS_HEADER = """
// @ts-check
/** @type{import('../../../src/assets/data/interfaces').TranslationDict} */
export default {
"""
CLIENT_STRING_JS_FOOTER = """
}
"""


def on_character(char: str, secondary_char: str | None = None) -> Callable[[str], int]:
    def inner(value: str) -> int:
        try:
            return value.index(char)
        except ValueError:
            if secondary_char is None:
                raise
            return value.index(secondary_char)

    return inner


def modifier_type(value: str) -> int:
    return value.replace("\\", "").index("{") - 1


CLIENT_STRING_KEY_VALUES: Sequence[BaseClientString] = [
    ClientString("RARITY_NORMAL", ["ItemDisplayStringNormal"]),
    ClientString("RARITY_MAGIC", ["ItemDisplayStringMagic"]),
    ClientString("RARITY_RARE", ["ItemDisplayStringRare"]),
    ClientString("RARITY_UNIQUE", ["ItemDisplayStringUnique"]),
    ClientString("RARITY_GEM", ["ItemDisplayStringGem"]),
    ClientString("RARITY_CURRENCY", ["ItemDisplayStringCurrency"]),
    ClientString("RARITY_DIVCARD", ["ItemDisplayStringDivinationCard"]),
    ClientString("RARITY_QUEST", ["ItemDisplayStringQuest"]),
    ClientString("MAP_TIER", ["UIOptionsSectionTitleMap", "Tier"], "{0} {1}: "),
    ClientString("RARITY", ["ItemDisplayStringRarity"], "{0}: "),
    ClientString("ITEM_CLASS", ["ItemDisplayStringClass"], "{0}: "),
    ClientString("ITEM_LEVEL", ["ItemDisplayStringItemLevel"], "{0}: "),
    ClientString(
        "CORPSE_LEVEL",
        ["CorpseSuffix", "Level"],
        "{0} {1}: ",
        [(2, -1), None],
    ),
    ClientString("TALISMAN_TIER", ["ItemDisplayStringTalismanTier"], "{0}: "),
    ClientString("GEM_LEVEL", ["Level"], "{0}: "),
    ClientString("STACK_SIZE", ["ItemDisplayStackSize"], "{0}: "),
    ClientString("SOCKETS", ["ItemDisplayStringSockets"], "{0}: "),
    ClientString("QUALITY", ["Quality"], "{0}: "),
    ClientString("PHYSICAL_DAMAGE", ["ItemDisplayWeaponPhysicalDamage"], "{0}: "),
    ClientString("ELEMENTAL_DAMAGE", ["ItemDisplayWeaponElementalDamage"], "{0}: "),
    ClientString("LIGHTNING_DAMAGE", ["ItemDisplayWeaponLightningDamage"], "{0}: "),
    ClientString("COLD_DAMAGE", ["ItemDisplayWeaponColdDamage"], "{0}: "),
    ClientString("FIRE_DAMAGE", ["ItemDisplayWeaponFireDamage"], "{0}: "),
    ClientString("CRIT_CHANCE", ["ItemDisplayWeaponCriticalStrikeChance"], "{0}: "),
    ClientString("ATTACK_SPEED", ["ItemDisplayWeaponAttacksPerSecond"], "{0}: "),
    ClientString("ARMOUR", ["ItemDisplayArmourArmour"], "{0}: "),
    ClientString("EVASION", ["ItemDisplayArmourEvasionRating"], "{0}: "),
    ClientString("ENERGY_SHIELD", ["ItemDisplayArmourEnergyShield"], "{0}: "),
    ClientString("BLOCK_CHANCE", ["ItemDisplayShieldBlockChance"], "{0}: "),
    ClientString("CORRUPTED", ["ItemPopupCorrupted"]),
    ClientString("UNIDENTIFIED", ["ItemPopupUnidentified"]),
    # skip regex ones
    ClientString("INFLUENCE_SHAPER", ["ItemPopupShaperItem"]),
    ClientString("INFLUENCE_ELDER", ["ItemPopupElderItem"]),
    ClientString("INFLUENCE_CRUSADER", ["ItemPopupCrusaderItem"]),
    ClientString("INFLUENCE_HUNTER", ["ItemPopupHunterItem"]),
    ClientString("INFLUENCE_REDEEMER", ["ItemPopupRedeemerItem"]),
    ClientString("INFLUENCE_WARLORD", ["ItemPopupWarlordItem"]),
    ClientString("SECTION_SYNTHESISED", ["ItemPopupSynthesisedItem"]),
    # skip regex
    ClientString("VEILED_PREFIX", ["ItemDisplayVeiledPrefix"]),
    ClientString("VEILED_SUFFIX", ["ItemDisplayVeiledSuffix"]),
    # regex
    ClientString("METAMORPH_HELP", ["MetamorphosisItemisedMapBoss"]),
    ClientString("BEAST_HELP", ["ItemDescriptionItemisedCapturedMonster"]),
    ClientString("VOIDSTONE_HELP", ["PrimordialWatchstoneDescriptionText"]),
    # regex (metamorph)
    ClientString("CANNOT_USE_ITEM", ["ItemPopupCannotUseItem"]),
    # regex (gems)
    ClientString("AREA_LEVEL", ["ItemDisplayHeistContractLevel"], "{0}: "),
    ClientString("HEIST_WINGS_REVEALED", ["ItemDisplayHeistBlueprintWings"], "{0}: "),
    ClientString("HEIST_TARGET", ["ItemDisplayHeistContractObjective"]),
    ClientString("HEIST_BLUEPRINT_ENCHANTS", ["HeistBlueprintRewardBunker"]),
    ClientString("HEIST_BLUEPRINT_TRINKETS", ["HeistBlueprintRewardMines"]),
    ClientString("HEIST_BLUEPRINT_GEMS", ["HeistBlueprintRewardReliquary"]),
    ClientString("HEIST_BLUEPRINT_REPLICAS", ["HeistBlueprintRewardLibrary"]),
    ClientString("MIRRORED", ["ItemPopupMirrored"]),
    # regex (mod description)
    ClientString(
        "PREFIX_MODIFIER",
        ["ModDescriptionLinePrefix"],
        substring=[(0, modifier_type)],
        keep_format_option=True,
        trim=True,
    ),
    ClientString(
        "SUFFIX_MODIFIER",
        ["ModDescriptionLineSuffix"],
        substring=[(0, modifier_type)],
        keep_format_option=True,
        trim=True,
    ),
    ClientString(
        "CRAFTED_PREFIX",
        ["ModDescriptionLineCraftedPrefix"],
        substring=[(0, modifier_type)],
        keep_format_option=True,
        trim=True,
    ),
    ClientString(
        "CRAFTED_SUFFIX",
        ["ModDescriptionLineCraftedSuffix"],
        substring=[(0, modifier_type)],
        keep_format_option=True,
        trim=True,
    ),
    ClientString(
        "UNSCALABLE_VALUE",
        ["DescriptionLabelFixedValueStat"],
        substring=[(28, on_character("}"))],
        keep_format_option=True,
    ),
    ClientString("CORRUPTED_IMPLICIT", ["ModDescriptionLineCorruptedImplicit"]),
    ClientString("INCURSION_OPEN", ["ItemDescriptionIncursionAccessibleRooms"]),
    ClientString("INCURSION_OBSTRUCTED", ["ItemDescriptionIncursionInaccessibleRooms"]),
    # regex eater exarch implicit
    ClientString("ELDRITCH_MOD_R1", ["EldritchCurrencyTier1"]),
    ClientString("ELDRITCH_MOD_R2", ["EldritchCurrencyTier2"]),
    ClientString("ELDRITCH_MOD_R3", ["EldritchCurrencyTier3"]),
    ClientString("ELDRITCH_MOD_R4", ["EldritchCurrencyTier4"]),
    ClientString("ELDRITCH_MOD_R5", ["EldritchCurrencyTier5"]),
    ClientString("ELDRITCH_MOD_R6", ["EldritchCurrencyTier6"]),
    ClientString("SENTINEL_CHARGE", ["ItemDisplaySentinelDroneDurability"], "{0}: "),
    # Arrays for influence mod prefix suffixes
    ClientString(
        "FOIL_UNIQUE",
        ["ItemPopupFoilUniqueVariant"],
        substring=[(0, on_character(" ("))],
        trim=True,
    ),
    ClientString("UNMODIFIABLE", ["ItemPopupUnmodifiable"]),
    # regex (chat)
    ClientString("REQUIREMENTS", ["ItemPopupRequirements"]),
    ClientString("CHARM_SLOTS", ["ItemDisplayBeltCharmSlots"], "{0}: "),
    ClientString("BASE_SPIRIT", ["ItemDisplaySpiritValue"], "{0}: "),
    ClientString("QUIVER_HELP_TEXT", ["ItemDescriptionQuiver"]),
    ClientString("FLASK_HELP_TEXT", ["ItemDescriptionFlask"]),
    ClientString("CHARM_HELP_TEXT", ["ItemDescriptionFlaskUtility1"]),
    ClientString("PRICE_NOTE", ["ItemDisplayStringNote"], "{0}: "),
    ClientString("WAYSTONE_TIER", ["ItemDisplayMapTier"], "{0}: "),
    ClientString("WAYSTONE_HELP", ["ItemDescriptionMap"]),
    ClientString("JEWEL_HELP", ["ItemDescriptionPassiveJewel"]),
    ClientString("SANCTUM_HELP", ["ItemDescriptionSanctumRelic"]),
    ClientString("TIMELESS_RADIUS", ["JewelRadiusLabel"], "{0}: "),
    ClientString("PRECURSOR_TABLET_HELP", ["ItemDescriptionPrecursorTablet"]),
    ClientString("LOGBOOK_HELP", ["ItemDescriptionExpeditionLogbook"]),
    ClientString("REQUIRES", ["ItemRequirementsLabel"]),
    ClientString(
        "TIMELESS_SMALL_PASSIVES",
        ["ModStatJewelAddToSmall"],
        keep_format_option=True,
    ),
    ClientString(
        "TIMELESS_NOTABLE_PASSIVES",
        ["ModStatJewelAddToNotable"],
        keep_format_option=True,
    ),
    ClientString("GRANTS_SKILL", ["ItemDisplayGrantsSkill"], "{0}: "),
    ClientString("RELOAD_SPEED", ["SkillPopupReloadTime"], "{0}: "),
    ClientString("FRACTURED_ITEM", ["ItemPopupFracturedItem"]),
    ClientString("SANCTIFIED", ["ItemPopupSanctified"]),
    ClientString("HYPHEN", ["ItemDisplayWeaponDamageRange"]),
    ClientString("WAYSTONE_REVIVES", ["NumberOfPortalsPerWaystone"], "{0}: "),
    ClientString("WAYSTONE_PACK_SIZE", ["ItemDisplayMapPackSizeIncrease"], "{0}: "),
    ClientString(
        "WAYSTONE_MAGIC_MONSTERS", ["ItemDisplayMapMagicMonsterQuantityBonus"], "{0}: "
    ),
    ClientString(
        "WAYSTONE_RARE_MONSTERS", ["ItemDisplayMapRareMonsterQuantityBonus"], "{0}: "
    ),
    ClientString(
        "WAYSTONE_DROP_CHANCE", ["ItemDisplayMapMapItemDropChanceIncrease"], "{0}: "
    ),
    ClientString("WAYSTONE_RARITY", ["ItemDisplayMapRarityIncrease"], "{0}: "),
]

CLIENT_STRING_ARRAYS: list[ArrayClientString] = [
    ArrayClientString(
        [
            ConstClientString("SHAPER_MODS", "of Shaping"),
            ConstClientString("SHAPER_MODS", "The Shaper's"),
        ]
    ),
    ArrayClientString(
        [
            ConstClientString("ELDER_MODS", "of the Elder"),
            ConstClientString("ELDER_MODS", "The Elder's"),
        ]
    ),
    ArrayClientString(
        [
            ConstClientString("CRUSADER_MODS", "Crusader's"),
            ConstClientString("CRUSADER_MODS", "of the Crusade"),
        ]
    ),
    ArrayClientString(
        [
            ConstClientString("HUNTER_MODS", "Hunter's"),
            ConstClientString("HUNTER_MODS", "of the Hunt"),
        ]
    ),
    ArrayClientString(
        [
            ConstClientString("REDEEMER_MODS", "Redeemer's"),
            ConstClientString("REDEEMER_MODS", "of Redemption"),
        ]
    ),
    ArrayClientString(
        [
            ConstClientString("WARLORD_MODS", "Warlord's"),
            ConstClientString("WARLORD_MODS", "of the Conquest"),
        ]
    ),
    ArrayClientString(
        [
            ConstClientString("DELVE_MODS", "Subterranean"),
            ConstClientString("DELVE_MODS", "of the Underground"),
        ]
    ),
    ArrayClientString(
        [
            ConstClientString("VEILED_MODS", "Chosen"),
            ConstClientString("VEILED_MODS", "of the Order"),
        ]
    ),
    ArrayClientString(
        [
            ConstClientString("INCURSION_MODS", "Guatelitzi's"),
            ConstClientString("INCURSION_MODS", "Xopec's"),
            ConstClientString("INCURSION_MODS", "Topotante's"),
            ConstClientString("INCURSION_MODS", "Tacati's"),
            ConstClientString("INCURSION_MODS", "Matatl's"),
            ConstClientString("INCURSION_MODS", "of Matatl"),
            ConstClientString("INCURSION_MODS", "Citaqualotl's"),
            ConstClientString("INCURSION_MODS", "of Citaqualotl"),
            ConstClientString("INCURSION_MODS", "of Tacati"),
            ConstClientString("INCURSION_MODS", "of Guatelitzi"),
            ConstClientString("INCURSION_MODS", "of Puhuarte"),
        ]
    ),
]

CLIENT_STRING_REGEX: list[RegexClientString] = [
    CapturePlaceholderClientString("ITEM_SUPERIOR", ["QualityItem"]),
    CapturePlaceholderClientString("ITEM_EXCEPTIONAL", ["ExceptionalItem"]),
    CapturePlaceholderClientString("MAP_BLIGHTED", ["InfectedMap"]),
    CapturePlaceholderClientString("MAP_BLIGHT_RAVAGED", ["UberInfectedMap"]),
    CapturePlaceholderClientString("ITEM_SYNTHESISED", ["SynthesisedItem"]),
    CapturePlaceholderClientString(
        "FLASK_CHARGES", ["ItemDisplayChargesNCharges"], capture_str="\\\\d+"
    ),
    ConstRegexClientString("METAMORPH_BRAIN", ".* Brain"),
    ConstRegexClientString("METAMORPH_EYE", ".* Eye"),
    ConstRegexClientString("METAMORPH_LUNG", ".* Lung"),
    ConstRegexClientString("METAMORPH_HEART", ".* Heart"),
    ConstRegexClientString("METAMORPH_LIVER", ".* Liver"),
    CapturePlaceholderClientString("QUALITY_ANOMALOUS", ["GemAlternateQuality1Affix"]),
    CapturePlaceholderClientString("QUALITY_DIVERGENT", ["GemAlternateQuality2Affix"]),
    CapturePlaceholderClientString("QUALITY_PHANTASMAL", ["GemAlternateQuality3Affix"]),
    CapturePlaceholderClientString(
        "MODIFIER_LINE",
        ["ModDescriptionLineTier", "ModDescriptionLineRank"],
        '(?<type>[^"]+)(?:\\s+"(?<name>[^"]*)")?(?:\\s+\\({0}: (?<tier>\\d+)\\))?(?:\\s+\\({1}: (?<rank>\\d+)\\))?',
        [(3, on_character(":", "：")), (3, on_character(":", "："))],
    ),
    CapturePlaceholderClientString(
        "MODIFIER_INCREASED",
        ["AlternateQualityModIncreaseText"],
        substring=[(3, None)],
    ),
    CapturePlaceholderClientString(
        "EATER_IMPLICIT",
        ["ModDescriptionLineGreatTangleImplicit"],
        capture_str="(?<rank>.+)",
    ),
    CapturePlaceholderClientString(
        "EXARCH_IMPLICIT",
        ["ModDescriptionLineCleansingFireImplicit"],
        capture_str="(?<rank>.+)",
    ),
    ConstRegexClientString("CHAT_SYSTEM", ": (?<body>.+)"),
    ConstRegexClientString(
        "CHAT_TRADE", "\\$(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)"
    ),
    ConstRegexClientString(
        "CHAT_GLOBAL", "#(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)"
    ),
    ConstRegexClientString(
        "CHAT_PARTY", "%(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)"
    ),
    ConstRegexClientString(
        "CHAT_GUILD", "&(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)"
    ),
    CapturePlaceholderClientString(
        "CHAT_WHISPER_TO", ["ChatBoxTo"], "@{0} (?<char_name>.+?): (?<body>.+)"
    ),
    CapturePlaceholderClientString(
        "CHAT_WHISPER_FROM",
        ["ChatBoxFrom"],
        "@{0} (?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)",
    ),
    ConstRegexClientString(
        "CHAT_WEBTRADE_GEM", "level (?<gem_lvl>\\d+) (?<gem_qual>\\d+)% (?<gem_name>.+)"
    ),
]
