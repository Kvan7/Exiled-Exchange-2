"""Names of various files that are generated/constant"""

from typing import Literal

# Trade API files
ITEMS_JSON = "items.json"
FILTERS_JSON = "filters.json"
STATS_JSON = "stats.json"
STATIC_JSON = "static.json"

TRADE_API_FILES = (
    ITEMS_JSON,
    FILTERS_JSON,
    STATS_JSON,
    STATIC_JSON,
)

# Game API tables
GAME_API_TABLES_TYPE = Literal[
    "ArmourTypes.json",
    "BaseItemTypes.json",
    "BlightCraftingItems.json",
    "BlightCraftingRecipes.json",
    "BlightCraftingResults.json",
    "ClientStrings.json",
    "ExpeditionFactions.json",
    "GoldModPrices.json",
    "ItemClassCategories.json",
    "ItemClasses.json",
    "ItemVisualIdentity.json",
    "Mods.json",
    "PassiveSkills.json",
    "SkillGemInfo.json",
    "SkillGems.json",
    "SoulCores.json",
    "SoulCoresPerClass.json",
    "Stats.json",
    "Tags.json",
    "UniqueStashLayout.json",
    "WeaponTypes.json",
    "Words.json",
]

ARMOUR_TYPES = "ArmourTypes.json"
BASE_ITEM_TYPES = "BaseItemTypes.json"
BLIGHT_CRAFTING_ITEMS = "BlightCraftingItems.json"
BLIGHT_CRAFTING_RECIPES = "BlightCraftingRecipes.json"
BLIGHT_CRAFTING_RESULTS = "BlightCraftingResults.json"
CLIENT_STRINGS = "ClientStrings.json"
EXPEDITION_FACTIONS = "ExpeditionFactions.json"
GOLD_MOD_PRICES = "GoldModPrices.json"
ITEM_CLASS_CATEGORIES = "ItemClassCategories.json"
ITEM_CLASSES = "ItemClasses.json"
ITEM_VISUAL_IDENTITY = "ItemVisualIdentity.json"
MODS = "Mods.json"
PASSIVE_SKILLS = "PassiveSkills.json"
SKILL_GEM_INFO = "SkillGemInfo.json"
SKILL_GEMS = "SkillGems.json"
SOUL_CORES = "SoulCores.json"
SOUL_CORES_PER_CLASS = "SoulCoresPerClass.json"
STATS = "Stats.json"
TAGS = "Tags.json"
UNIQUE_STASH_LAYOUT = "UniqueStashLayout.json"
WEAPON_TYPES = "WeaponTypes.json"
WORDS = "Words.json"

GAME_API_TABLES = (
    ARMOUR_TYPES,
    BASE_ITEM_TYPES,
    BLIGHT_CRAFTING_ITEMS,
    BLIGHT_CRAFTING_RECIPES,
    BLIGHT_CRAFTING_RESULTS,
    CLIENT_STRINGS,
    EXPEDITION_FACTIONS,
    GOLD_MOD_PRICES,
    ITEM_CLASS_CATEGORIES,
    ITEM_CLASSES,
    ITEM_VISUAL_IDENTITY,
    MODS,
    PASSIVE_SKILLS,
    SKILL_GEM_INFO,
    SKILL_GEMS,
    SOUL_CORES,
    SOUL_CORES_PER_CLASS,
    STATS,
    TAGS,
    UNIQUE_STASH_LAYOUT,
    WEAPON_TYPES,
    WORDS,
)


# Stat Description Files
STAT_DESCRIPTION_FILES_TYPE = Literal[
    "Metadata@StatDescriptions@active_skill_gem_stat_descriptions.csd",
    "Metadata@StatDescriptions@advanced_mod_stat_descriptions.csd",
    "Metadata@StatDescriptions@atlas_stat_descriptions.csd",
    "Metadata@StatDescriptions@character_panel_gamepad_stat_descriptions.csd",
    "Metadata@StatDescriptions@character_panel_stat_descriptions.csd",
    "Metadata@StatDescriptions@chest_stat_descriptions.csd",
    "Metadata@StatDescriptions@endgame_map_stat_descriptions.csd",
    "Metadata@StatDescriptions@expedition_relic_stat_descriptions.csd",
    "Metadata@StatDescriptions@gem_stat_descriptions.csd",
    "Metadata@StatDescriptions@heist_equipment_stat_descriptions.csd",
    "Metadata@StatDescriptions@leaguestone_stat_descriptions.csd",
    "Metadata@StatDescriptions@map_stat_descriptions.csd",
    "Metadata@StatDescriptions@meta_gem_stat_descriptions.csd",
    "Metadata@StatDescriptions@monster_stat_descriptions.csd",
    "Metadata@StatDescriptions@passive_skill_aura_stat_descriptions.csd",
    "Metadata@StatDescriptions@passive_skill_stat_descriptions.csd",
    "Metadata@StatDescriptions@primordial_altar_stat_descriptions.csd",
    "Metadata@StatDescriptions@sanctum_relic_stat_descriptions.csd",
    "Metadata@StatDescriptions@sentinel_stat_descriptions.csd",
    "Metadata@StatDescriptions@skill_stat_descriptions.csd",
    "Metadata@StatDescriptions@stat_descriptions.csd",
    "Metadata@StatDescriptions@tablet_stat_descriptions.csd",
    "Metadata@StatDescriptions@utility_flask_buff_stat_descriptions.csd",
]

ACTIVE_SKILL_GEM_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@active_skill_gem_stat_descriptions.csd"
)
ADVANCED_MOD_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@advanced_mod_stat_descriptions.csd"
)
ATLAS_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@atlas_stat_descriptions.csd"
)
CHARACTER_PANEL_GAMEPAD_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@character_panel_gamepad_stat_descriptions.csd"
)
CHARACTER_PANEL_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@character_panel_stat_descriptions.csd"
)
CHEST_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@chest_stat_descriptions.csd"
)
ENDGAME_MAP_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@endgame_map_stat_descriptions.csd"
)
EXPEDITION_RELIC_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@expedition_relic_stat_descriptions.csd"
)
GEM_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@gem_stat_descriptions.csd"
)
HEIST_EQUIPMENT_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@heist_equipment_stat_descriptions.csd"
)
LEAGUESTONE_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@leaguestone_stat_descriptions.csd"
)
MAP_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@map_stat_descriptions.csd"
)
META_GEM_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@meta_gem_stat_descriptions.csd"
)
MONSTER_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@monster_stat_descriptions.csd"
)
PASSIVE_SKILL_AURA_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@passive_skill_aura_stat_descriptions.csd"
)
PASSIVE_SKILL_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@passive_skill_stat_descriptions.csd"
)
PRIMORDIAL_ALTAR_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@primordial_altar_stat_descriptions.csd"
)
SANCTUM_RELIC_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@sanctum_relic_stat_descriptions.csd"
)
SENTINEL_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@sentinel_stat_descriptions.csd"
)
SKILL_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@skill_stat_descriptions.csd"
)
STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@stat_descriptions.csd"
)
TABLET_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@tablet_stat_descriptions.csd"
)
UTILITY_FLASK_BUFF_STAT_DESCRIPTIONS: STAT_DESCRIPTION_FILES_TYPE = (
    "Metadata@StatDescriptions@utility_flask_buff_stat_descriptions.csd"
)

STAT_DESCRIPTION_FILES = (
    ACTIVE_SKILL_GEM_STAT_DESCRIPTIONS,
    ADVANCED_MOD_STAT_DESCRIPTIONS,
    ATLAS_STAT_DESCRIPTIONS,
    CHARACTER_PANEL_GAMEPAD_STAT_DESCRIPTIONS,
    CHARACTER_PANEL_STAT_DESCRIPTIONS,
    CHEST_STAT_DESCRIPTIONS,
    ENDGAME_MAP_STAT_DESCRIPTIONS,
    EXPEDITION_RELIC_STAT_DESCRIPTIONS,
    GEM_STAT_DESCRIPTIONS,
    HEIST_EQUIPMENT_STAT_DESCRIPTIONS,
    LEAGUESTONE_STAT_DESCRIPTIONS,
    MAP_STAT_DESCRIPTIONS,
    META_GEM_STAT_DESCRIPTIONS,
    MONSTER_STAT_DESCRIPTIONS,
    PASSIVE_SKILL_AURA_STAT_DESCRIPTIONS,
    PASSIVE_SKILL_STAT_DESCRIPTIONS,
    PRIMORDIAL_ALTAR_STAT_DESCRIPTIONS,
    SANCTUM_RELIC_STAT_DESCRIPTIONS,
    SENTINEL_STAT_DESCRIPTIONS,
    SKILL_STAT_DESCRIPTIONS,
    STAT_DESCRIPTIONS,
    TABLET_STAT_DESCRIPTIONS,
    UTILITY_FLASK_BUFF_STAT_DESCRIPTIONS,
)

ITEM_IMAGE_CACHE = "itemImageCache.json"
OLD_ITEM_IMAGE_CACHE = "itemImageCache.old.json"
