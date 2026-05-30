import { ItemCategory, ParsedItem, ItemRarity } from "@/parser";
import {
  ItemFilters,
  StatFilter,
  INTERNAL_TRADE_IDS,
  InternalTradeId,
  ItemIsElementalModifier,
  FilterTag,
} from "../filters/interfaces";
import { setProperty as propSet } from "dot-prop";
import { DateTime } from "luxon";
import { Host } from "@/web/background/IPC";
import {
  TradeResponse,
  Account,
  getTradeEndpoint,
  adjustRateLimits,
  RATE_LIMIT_RULES,
  preventQueueCreation,
} from "./common";
import { STAT_BY_REF, CLIENT_STRINGS as _$ } from "@/assets/data";
import { RateLimiter } from "./RateLimiter";
import { ModifierType } from "@/parser/modifiers";
import { Cache } from "./Cache";
import { parseAffixStrings } from "@/parser/Parser";
import {
  CoreCurrency,
  displayRounding,
  DivCurrency,
  usePoeninja,
} from "@/web/background/Prices";
import { getCurrencyDetailsId } from "../trends/getDetailsId";
import { areaLevelByAscendancyPoints } from "../filters/create-item-filters";

export const CATEGORY_TO_TRADE_ID = new Map([
  [ItemCategory.Map, "map"],
  [ItemCategory.AbyssJewel, "jewel.abyss"],
  [ItemCategory.Amulet, "accessory.amulet"],
  [ItemCategory.Belt, "accessory.belt"],
  [ItemCategory.BodyArmour, "armour.chest"],
  [ItemCategory.Boots, "armour.boots"],
  [ItemCategory.Bow, "weapon.bow"],
  [ItemCategory.Claw, "weapon.claw"],
  [ItemCategory.Dagger, "weapon.dagger"],
  [ItemCategory.FishingRod, "weapon.rod"],
  [ItemCategory.Flask, "flask"],
  [ItemCategory.Gloves, "armour.gloves"],
  [ItemCategory.Helmet, "armour.helmet"],
  [ItemCategory.Jewel, "jewel"],
  [ItemCategory.OneHandedAxe, "weapon.oneaxe"],
  [ItemCategory.OneHandedMace, "weapon.onemace"],
  [ItemCategory.OneHandedSword, "weapon.onesword"],
  [ItemCategory.Quiver, "armour.quiver"],
  [ItemCategory.Ring, "accessory.ring"],
  [ItemCategory.RuneDagger, "weapon.runedagger"],
  [ItemCategory.Sceptre, "weapon.sceptre"],
  [ItemCategory.Shield, "armour.shield"],
  [ItemCategory.Staff, "weapon.staff"],
  [ItemCategory.TwoHandedAxe, "weapon.twoaxe"],
  [ItemCategory.TwoHandedMace, "weapon.twomace"],
  [ItemCategory.TwoHandedSword, "weapon.twosword"],
  [ItemCategory.Wand, "weapon.wand"],
  [ItemCategory.Warstaff, "weapon.warstaff"],
  [ItemCategory.ClusterJewel, "jewel.cluster"],
  [ItemCategory.HeistBlueprint, "heistmission.blueprint"],
  [ItemCategory.HeistContract, "heistmission.contract"],
  [ItemCategory.HeistTool, "heistequipment.heisttool"],
  [ItemCategory.HeistBrooch, "heistequipment.heistreward"],
  [ItemCategory.HeistGear, "heistequipment.heistweapon"],
  [ItemCategory.HeistCloak, "heistequipment.heistutility"],
  [ItemCategory.Trinket, "accessory.trinket"],
  [ItemCategory.SanctumRelic, "sanctum.relic"],
  [ItemCategory.Tincture, "tincture"],
  [ItemCategory.Charm, "azmeri.charm"],
  [ItemCategory.Crossbow, "weapon.crossbow"],
  [ItemCategory.SkillGem, "gem.activegem"],
  [ItemCategory.SupportGem, "gem.supportgem"],
  [ItemCategory.MetaGem, "gem.metagem"],
  [ItemCategory.Focus, "armour.focus"],
  [ItemCategory.Spear, "weapon.spear"],
  [ItemCategory.Flail, "weapon.flail"],
  [ItemCategory.Buckler, "armour.buckler"],
  [ItemCategory.Tablet, "map.tablet"],
  [ItemCategory.MapFragment, "map.fragment"],
  [ItemCategory.Talisman, "weapon.talisman"],
  [ItemCategory.Waystone, "map.waystone"],
]);

const TOTAL_MODS_TEXT = {
  EMPTY_MODIFIERS: [
    "# Empty Modifiers",
    "# Empty Prefix Modifiers",
    "# Empty Suffix Modifiers",
  ],
  TOTAL_MODIFIERS: ["# Modifiers", "# Prefix Modifiers", "# Suffix Modifiers"],
};

// const INFLUENCE_PSEUDO_TEXT = {
//   [ItemInfluence.Shaper]: 'Has Shaper Influence',
//   [ItemInfluence.Crusader]: 'Has Crusader Influence',
//   [ItemInfluence.Hunter]: 'Has Hunter Influence',
//   [ItemInfluence.Elder]: 'Has Elder Influence',
//   [ItemInfluence.Redeemer]: 'Has Redeemer Influence',
//   [ItemInfluence.Warlord]: 'Has Warlord Influence'
// }

const CONVERT_CURRENCY: Record<string, string> = {
  "greater-orb-of-transmutation": "G. transmute",
  "perfect-orb-of-transmutation": "P. transmute",
  "greater-orb-of-augmentation": "G. aug",
  "perfect-orb-of-augmentation": "P. aug",
  "greater-chaos-orb": "G. chaos",
  "perfect-chaos-orb": "P. chaos",
  "greater-regal-orb": "G. regal",
  "perfect-regal-orb": "P. regal",
  "greater-exalted-orb": "G. exalted",
  "perfect-exalted-orb": "P. exalted",
};

enum TradePropType {
  Unused,
  MapTier,
  MapQuantityBonus,
  MapRarityBonus,
  MapPackSizeBonus,
  GemLevel,
  Quality,
  QualityItemBonus,
  QualitySupportBonus,
  WeaponPhysicalDamage,
  WeaponElementalDamage,
  WeaponChaosDamage,
  WeaponCriticalChance,
  WeaponSpeed,
  WeaponRange,
  ShieldBlock,
  ArmourReduction,
  ArmourEvasion,
  ArmourEnergyShield,
  NetTier,
  GemLevelProgress,
  BestiaryGenus,
  BestiaryGroup,
  BestiaryFamily,
  JewelRadius,
  Spirit,
  SanctumFloors,
  UltimatumRooms,
  Notable,
  HarvestGrowth,
  MonsterLevel,
  StoredExperience,
  StackSize,
  Durability,
  AreaLevel,
  HeistWings,
  HeistEscapeRoutes,
  HeistRewardRooms,
  HeistJobLockpicking,
  HeistJobBruteForce,
  HeistJobPerception,
  HeistJobDemolition,
  HeistJobCounterThaumaturgy,
  HeistJobTrapDisarmament,
  HeistJobAgility,
  HeistJobDeception,
  HeistJobEngineering,
  HeistContractObjective,
  RitualStoneWorldArea,
  IncursionTempleRoom,
  MavenCollectedMaps,
  UltimatumTrialItemRequirement,
  UltimatumTrialReward,
  UltimatumTrialDifficulty,
  ArmourWard,
  ArmourAdaptation,
  QualityGlobalStatsBonus,
  ClassRequirement,
  SentinelDroneUses,
  SentinelDuration,
  SentinelTagLimit,
  SentinelEmpowerment,
  LevelRequirement,
  StrengthRequirement,
  DexterityRequirement,
  IntelligenceRequirement,
  MapMapItemDropChanceBonus,
  MapItemsDropCorruptedChance,
  SanctumResolve,
  SanctumInspiration,
  SanctumGold,
  SanctumMinorBoons,
  SanctumMajorBoons,
  SanctumMinorCurses,
  SanctumMajorCurses,
  SanctumPacts,
  CompletionReward,
  MapConversion,
  ItemLevel,
  CorpseTag,
  MapConversionShaper,
  MapConversionElder,
  MapConversionConqueror,
  MapConversionUnique,
  MapConversionChargedCompass,
  MapConversionMavenInvite,
  MapConversionMemoryLine,
  ScarabUseLimit, // ScrabUseLimit?
  MapMapDropBonus,
  MapScarabDropBonus,
  MapCurrencyDropBonus,
  MapDivinationCardDropBonus,
  ShieldDeflect,
  TrapToolDamage,
  TrapToolSpeed,
  TrapToolDetonationType,
  WeaponRequirement,
  WeaponReloadTime,
  MapPortals,
  ZanaInfluence,
  MapGoldQuantityBonus,
  MapExperienceBonus,
  MapMagicMonstersQuantityBonus,
  MapRareMonstersQuantityBonus,
  ReservationCost,
  MapKeyWorldArea,
  RitualStoneUniqueMonsters,
  RitualStoneOtherMonsters,
}

enum TradeNumberColors {
  White = 0,
  Augmented = 1,
  Unmet = 2,
  Physical = 3,
  Fire = 4,
  Cold = 5,
  Lightning = 6,
  Chaos = 7,
  Unique = 8,
  Unreachable = 9,
  Currency = 10,
  Reward = 11,
  Divination = 12,
  SanctumBoon = 13,
  SanctumCurse = 14,
  SanctumPact = 15,
  GrantedSkill = 25,
  Enchant = 8729,
  Fractured = 8730,
  Desecrated = 8731,
  Sanctified = 8732,
  Mutated = 8733,
}

interface FilterBoolean {
  option?: "true" | "false";
}
interface FilterRange {
  min?: number;
  max?: number;
}

interface TradeRequest {
  query: {
    status: { option: "available" | "securable" | "online" | "any" };
    name?: string | { discriminator: string; option: string };
    type?: string | { discriminator: string; option: string };
    stats: Array<{
      type: "and" | "if" | "count" | "not";
      value?: FilterRange;
      filters: Array<{
        id: string;
        value?: {
          min?: number;
          max?: number;
          option?: number | string;
        };
        disabled?: boolean;
      }>;
      disabled?: boolean;
    }>;
    filters: {
      type_filters?: {
        filters: {
          rarity?: {
            option?: "nonunique" | "uniquefoil";
          };
          category?: {
            option?: string;
          };
          ilvl?: FilterRange;
          quality?: FilterRange;
        };
      };
      equipment_filters?: {
        filters: {
          // Attacks per Second
          aps?: FilterRange;
          // Armor Rating
          ar?: FilterRange;
          // Block
          block?: FilterRange;
          // Critical Strike Chance
          crit?: FilterRange;
          // Damage (not used)
          // damage?: FilterRange
          // Damage per Second
          dps?: FilterRange;
          // Elemental Damage per Second
          edps?: FilterRange;
          // Energy Shield
          es?: FilterRange;
          // Evasion Rating
          ev?: FilterRange;
          // Physical Damage per Second
          pdps?: FilterRange;
          // Augment Slots (still called rune on trade site)
          rune_sockets?: FilterRange;
          // Spirit
          spirit?: FilterRange;
          // reload time
          reload_time?: FilterRange;
        };
      };
      req_filters?: {
        filters: {
          dex?: FilterRange;
          int?: FilterRange;
          lvl?: FilterRange;
          str?: FilterRange;
        };
      };
      map_filters?: {
        filters: {
          map_tier?: FilterRange;
          map_revives?: FilterRange;
          map_packsize?: FilterRange;
          map_magic_monsters?: FilterRange;
          map_rare_monsters?: FilterRange;
          map_bonus?: FilterRange;
          map_iir?: FilterRange;
          ultimatum_hint?: {
            option?: "Victorious" | "Cowardly" | "Deadly";
          };
        };
      };
      misc_filters?: {
        filters: {
          alternate_art?: FilterBoolean;
          area_level?: FilterRange;
          corrupted?: FilterBoolean;
          gem_level?: FilterRange;
          gem_sockets?: FilterRange;
          identified?: FilterBoolean;
          mirrored?: FilterBoolean;
          sanctified?: FilterBoolean;
          sanctum_gold?: FilterRange;
          unidentified_tier?: FilterRange;
          veiled?: FilterBoolean;
          fractured_item?: FilterBoolean;
        };
      };
      trade_filters?: {
        filters: {
          collapse?: FilterBoolean;
          indexed?: { option?: string };
          price?: FilterRange | { option?: string };
        };
      };
    };
  };
  sort: {
    price: "asc";
  };
}

export interface SearchResult {
  id: string;
  result: string[];
  total: number;
  inexact?: boolean;
}

interface TradeModMetadata {
  name: string;
  tier: number;
  level: number;
  magnitudes: Array<{ hash: string; min: string; max: string }>;
}

interface TradeDataRichLine {
  name: string;
  values: Array<[string, TradeNumberColors]>;
  displayMode: number;
  type?: TradePropType;
  icon?: string;
}

interface FetchResult {
  id: string;
  item: {
    w: 2;
    h: 3;
    icon: string;
    sockets: Array<{
      group: number;
      type: string;
      // sacred:orange, primal:blue,vivid:yellow, wild:purple
      item?:
        | "rune"
        | "soulcore"
        | "sacredtalisman"
        | "primaltalisman"
        | "vividtalisman"
        | "wildtalisman"
        | "jewel";
    }>;
    fractured?: true;
    name: string;
    typeLine: string;
    baseType: string;
    rarity: ItemRarity;
    frameType?: DisplayFrameType;
    ilvl?: number;
    identified: boolean;
    unidentifiedTier?: number;
    note?: string;
    sanctified?: true;
    duplicated?: true;
    stackSize?: number;
    corrupted?: true;
    doubleCorrupted?: true;
    gemSockets?: string[];
    properties?: TradeDataRichLine[];
    requirements?: TradeDataRichLine[];
    grantedSkills?: TradeDataRichLine[];
    implicitMods?: string[];
    explicitMods?: string[];
    mutatedMods?: string[];
    enchantMods?: string[];
    runeMods?: string[];
    extended?: {
      dps?: number;
      pdps?: number;
      edps?: number;
      ar?: number;
      ev?: number;
      es?: number;
      ward?: number;
      dps_aug?: boolean;
      pdps_aug?: boolean;
      edps_aug?: boolean;
      ar_aug?: boolean;
      ev_aug?: boolean;
      es_aug?: boolean;
      ward_aug?: boolean;
      mods?: Record<string, TradeModMetadata[]>;
      hashes?: Record<string, Array<Array<string | number[] | null>>>;
    };
    pseudoMods?: string[];
    desecratedMods?: string[];
    fracturedMods?: string[];
  };
  listing: {
    indexed: string;
    fee?: number;
    price?: {
      amount: number;
      currency: string;
      type: "~price";
    };
    account: Account;
    in_demand?: boolean;
  };
  gone?: boolean;
}

export interface DisplayItemLine {
  // text should include colon if required...
  text: string;
  value?: string | number;
  color: TradeNumberColors;
}
export enum DisplayFrameType {
  Normal = 0,
  Magic = 1,
  Rare = 2,
  Unique = 3,
  RunicMagic = 12,
  RunicRare = 13,
  RunicUnique = 14,
}

export interface DisplayItem {
  title: string[];
  rarity: ItemRarity;
  frameType?: DisplayFrameType;
  nameBlock?: DisplayItemLine[];
  itemProps?: DisplayItemLine[];
  grantSkill?: DisplayItemLine[];
  enchantMods?: DisplayItemLine[];
  runeMods?: DisplayItemLine[];
  implicitMods?: DisplayItemLine[];
  fracturedMods?: DisplayItemLine[];
  explicitMods?: DisplayItemLine[];
  mutatedMods?: DisplayItemLine[];
  desecratedMods?: DisplayItemLine[];
  pseudoMods?: DisplayItemLine[];
  extended?: Array<{ text: string; value: number }>;
  itemTags?: DisplayItemLine[];
  sockets: Array<{ group: number; type: string; item?: string }>;
  icon?: {
    url: string;
    w: number;
    h: number;
  };
}

export interface PricingResult {
  id: string;
  itemLevel?: string;
  stackSize?: number;
  corrupted?: boolean;
  quality?: string;
  level?: string;
  gemSockets?: number;
  relativeDate: string;
  priceAmount: number;
  priceCurrency: string;
  priceCurrencyRank?: number;
  normalizedPrice?: string;
  normalizedPriceCurrency?: CoreCurrency;
  isMine: boolean;
  hasNote: boolean;
  isInstantBuyout: boolean;
  accountName: string;
  accountStatus: "offline" | "online" | "afk";
  ign: string;
  displayItem: DisplayItem;
  inDemand?: boolean;
  gone?: boolean;
}

export function createTradeRequest(
  filters: ItemFilters,
  stats: StatFilter[],
  item: ParsedItem,
) {
  if (filters.trade.listingType === "onlineleague") {
    console.error(
      "onlineleague is not supported for trade, you shouldn't ever see this",
    );
    filters.trade.listingType = "securable";
  }

  const body: TradeRequest = {
    query: {
      status: {
        option: filters.trade.listingType,
      },
      stats: [{ type: "and", filters: [] }],
      filters: {},
    },
    sort: {
      price: "asc",
    },
  };
  const { query } = body;

  if (filters.trade.currency) {
    propSet(
      query.filters,
      "trade_filters.filters.price.option",
      filters.trade.currency,
    );
  }

  if (filters.trade.collapseListings === "api") {
    propSet(
      query.filters,
      "trade_filters.filters.collapse.option",
      String(true),
    );
  }

  if (filters.trade.listed) {
    propSet(
      query.filters,
      "trade_filters.filters.indexed.option",
      filters.trade.listed,
    );
  }

  // Search by category not base type?
  const activeSearch =
    filters.searchRelaxed && !filters.searchRelaxed.disabled
      ? filters.searchRelaxed
      : filters.searchExact;

  if (activeSearch.nameTrade) {
    query.name = nameToQuery(activeSearch.nameTrade, filters);
  } else if (activeSearch.name) {
    query.name = nameToQuery(activeSearch.name, filters);
  }

  if (activeSearch.baseTypeTrade) {
    query.type = nameToQuery(activeSearch.baseTypeTrade, filters);
  } else if (activeSearch.baseType) {
    query.type = nameToQuery(activeSearch.baseType, filters);
  }

  // TYPE FILTERS
  if (activeSearch.category) {
    const id = CATEGORY_TO_TRADE_ID.get(activeSearch.category);
    if (id) {
      propSet(query.filters, "type_filters.filters.category.option", id);
    } else {
      throw new Error(`Invalid category: ${activeSearch.category}`);
    }
  }

  if (filters.foil && !filters.foil.disabled) {
    propSet(query.filters, "type_filters.filters.rarity.option", "uniquefoil");
  } else if (filters.rarity) {
    propSet(
      query.filters,
      "type_filters.filters.rarity.option",
      filters.rarity.value,
    );
  }

  if (filters.itemLevel && !filters.itemLevel.disabled) {
    propSet(
      query.filters,
      "type_filters.filters.ilvl.min",
      filters.itemLevel.value,
    );
    if (filters.itemLevel.max) {
      propSet(
        query.filters,
        "type_filters.filters.ilvl.max",
        filters.itemLevel.max,
      );
    }
  }

  if (
    filters.requires &&
    filters.requires.level &&
    !filters.requires.level.disabled
  ) {
    propSet(
      query.filters,
      "req_filters.filters.lvl.max",
      filters.requires.level.value,
    );
  }

  if (filters.quality && !filters.quality.disabled) {
    propSet(
      query.filters,
      "type_filters.filters.quality.min",
      filters.quality.value,
    );
  }

  // EQUIPMENT FILTERS

  if (filters.augmentSockets && !filters.augmentSockets.disabled) {
    propSet(
      query.filters,
      "equipment_filters.filters.rune_sockets.min",
      filters.augmentSockets.value,
    );
  }

  // REQ FILTERS

  // MAP (WAYSTONE) FILTERS

  if (filters.mapTier && !filters.mapTier.disabled) {
    propSet(
      query.filters,
      "map_filters.filters.map_tier.min",
      filters.mapTier.value,
    );
    propSet(
      query.filters,
      "map_filters.filters.map_tier.max",
      filters.mapTier.value,
    );
  }

  if (filters.ultimatumHint && !filters.ultimatumHint.disabled) {
    propSet(
      query.filters,
      "map_filters.filters.ultimatum_hint.option",
      filters.ultimatumHint.value,
    );
  }

  // MISC FILTERS
  if (filters.gemLevel && !filters.gemLevel.disabled) {
    propSet(
      query.filters,
      "misc_filters.filters.gem_level.min",
      filters.gemLevel.value,
    );
    if (filters.gemLevel.max) {
      propSet(
        query.filters,
        "misc_filters.filters.gem_level.max",
        filters.gemLevel.max,
      );
    }
  }

  if (filters.socketNumber && !filters.socketNumber.disabled) {
    propSet(
      query.filters,
      "misc_filters.filters.gem_sockets.min",
      filters.socketNumber.value,
    );
  }

  if (filters.areaLevel && !filters.areaLevel.disabled) {
    if (filters.awardedAscendancyPoints) {
      // set max, lower has higher value, so exclude worse(higher area level) items
      propSet(
        query.filters,
        "misc_filters.filters.area_level.max",
        filters.areaLevel.value,
      );
    } else {
      propSet(
        query.filters,
        "misc_filters.filters.area_level.min",
        filters.areaLevel.value,
      );
    }
  }

  if (
    filters.awardedAscendancyPoints &&
    !filters.awardedAscendancyPoints.disabled
  ) {
    propSet(
      query.filters,
      "misc_filters.filters.area_level.min",
      areaLevelByAscendancyPoints(
        item.info.refName,
        filters.awardedAscendancyPoints.value,
      ),
    );
  }

  if (filters.unidentified && !filters.unidentified.disabled) {
    propSet(
      query.filters,
      "misc_filters.filters.identified.option",
      String(false),
    );
  }

  if (filters.unidentifiedTier && !filters.unidentifiedTier.disabled) {
    propSet(
      query.filters,
      "misc_filters.filters.unidentified_tier.min",
      filters.unidentifiedTier.value,
    );
  }

  if (
    (filters.corrupted?.value === false || filters.corrupted?.exact) &&
    filters.corrupted &&
    (!filters.sanctified || (filters.sanctified && filters.sanctified.disabled))
  ) {
    propSet(
      query.filters,
      "misc_filters.filters.corrupted.option",
      String(filters.corrupted.value),
    );
  }

  if (filters.fractured?.value === false) {
    propSet(
      query.filters,
      "misc_filters.filters.fractured_item.option",
      String(false),
    );
  }

  if (filters.mirrored) {
    if (filters.mirrored.disabled) {
      propSet(
        query.filters,
        "misc_filters.filters.mirrored.option",
        String(false),
      );
    }
  } else if (
    item.rarity === ItemRarity.Normal ||
    item.rarity === ItemRarity.Magic ||
    item.rarity === ItemRarity.Rare
  ) {
    propSet(
      query.filters,
      "misc_filters.filters.mirrored.option",
      String(false),
    );
  }

  if (
    filters.sanctified ||
    (filters.corrupted?.value === true && !filters.corrupted?.exact)
  ) {
    if (filters.sanctified?.disabled) {
      propSet(
        query.filters,
        "misc_filters.filters.sanctified.option",
        String(false),
      );
    }
  } else if (
    item.rarity === ItemRarity.Normal ||
    item.rarity === ItemRarity.Magic ||
    item.rarity === ItemRarity.Rare
  ) {
    propSet(
      query.filters,
      "misc_filters.filters.sanctified.option",
      String(false),
    );
  }

  // TRADE FILTERS

  // BREAK ==============================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================

  // Meta internal stuff, crafting as empty and setting dps/pdps/edps
  for (const stat of stats) {
    if (stat.tradeId[0] === "item.has_empty_modifier") {
      const TARGET_ID = {
        EMPTY_MODIFIERS: STAT_BY_REF(
          TOTAL_MODS_TEXT.EMPTY_MODIFIERS[stat.option!.value],
        )!.trade.ids[ModifierType.Pseudo][0],
      };
      const emptyRoll = stat.roll!;
      query.stats.push({
        type: "count",
        value: { min: 1, max: 1 },
        disabled: stat.disabled,
        filters: [
          {
            id: TARGET_ID.EMPTY_MODIFIERS,
            value: { ...getMinMax(emptyRoll) },
            disabled: stat.disabled,
          },
        ],
      });
    } else if (
      // https://github.com/SnosMe/awakened-poe-trade/issues/758
      item.category === ItemCategory.Flask &&
      stat.statRef === "#% increased Charge Recovery" &&
      !stats.some((s) => s.statRef === "#% increased effect")
    ) {
      const reducedEffectId = STAT_BY_REF("#% increased effect")!.trade.ids[
        ModifierType.Explicit
      ][0];
      query.stats.push({
        type: "not",
        disabled: stat.disabled,
        filters: [{ id: reducedEffectId, disabled: stat.disabled }],
      });
    }

    if (stat.disabled) continue;

    function applyElementalDamageLogicalFilter() {
      if (stat.tradeId[0] !== "item.elemental_dps") {
        console.error("Elemental damage filter applied to non-elemental dps");
        return;
      }
      const mapIds = (ids: { [type: string]: string[] }) =>
        Object.values(ids)
          .flat()
          .map((id) => ({ id }));
      const fireIds = mapIds(STAT_BY_REF("Adds # to # Fire Damage")!.trade.ids);
      const coldIds = mapIds(STAT_BY_REF("Adds # to # Cold Damage")!.trade.ids);
      const lightningIds = mapIds(
        STAT_BY_REF("Adds # to # Lightning Damage")!.trade.ids,
      );

      const selectedType = stat.option!.value as ItemIsElementalModifier;
      const notGroup: Array<{ id: string }> = [];
      switch (selectedType) {
        case ItemIsElementalModifier.Any:
          break;
        case ItemIsElementalModifier.Fire:
          notGroup.push(...coldIds);
          notGroup.push(...lightningIds);
          break;
        case ItemIsElementalModifier.Cold:
          notGroup.push(...fireIds);
          notGroup.push(...lightningIds);
          break;
        case ItemIsElementalModifier.Lightning:
          notGroup.push(...fireIds);
          notGroup.push(...coldIds);
          break;
      }
      if (notGroup.length) {
        query.stats.push({
          type: "not",
          filters: notGroup,
        });
      }
    }

    const input = stat.roll!;
    switch (stat.tradeId[0] as InternalTradeId) {
      // case 'item.base_percentile':
      //   propSet(
      //     query.filters,
      //     'equipment_filters.filters.base_defence_percentile.min',
      //     typeof input.min === 'number' ? input.min : undefined
      //   )
      //   propSet(
      //     query.filters,
      //     'equipment_filters.filters.base_defence_percentile.max',
      //     typeof input.max === 'number' ? input.max : undefined
      //   )
      //   break
      case "item.armour":
        propSet(
          query.filters,
          "equipment_filters.filters.ar.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.ar.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.evasion_rating":
        propSet(
          query.filters,
          "equipment_filters.filters.ev.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.ev.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.energy_shield":
        propSet(
          query.filters,
          "equipment_filters.filters.es.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.es.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.runic_ward":
        propSet(
          query.filters,
          "equipment_filters.filters.ward.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.ward.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.block":
        propSet(
          query.filters,
          "equipment_filters.filters.block.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.block.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.total_dps":
        propSet(
          query.filters,
          "equipment_filters.filters.dps.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.dps.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.physical_dps":
        propSet(
          query.filters,
          "equipment_filters.filters.pdps.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.pdps.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.elemental_dps":
        propSet(
          query.filters,
          "equipment_filters.filters.edps.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.edps.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        applyElementalDamageLogicalFilter();
        break;
      case "item.crit":
        propSet(
          query.filters,
          "equipment_filters.filters.crit.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.crit.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.aps":
        propSet(
          query.filters,
          "equipment_filters.filters.aps.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.aps.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.spirit":
        propSet(
          query.filters,
          "equipment_filters.filters.spirit.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.spirit.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.reload_time":
        propSet(
          query.filters,
          "equipment_filters.filters.reload_time.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        propSet(
          query.filters,
          "equipment_filters.filters.reload_time.max",
          typeof input.max === "number" ? input.max : undefined,
        );
        break;
      case "item.rarity_magic":
        propSet(query.filters, "type_filters.filters.rarity.option", "magic");
        break;
      case "item.map_revives":
        propSet(
          query.filters,
          "map_filters.filters.map_revives.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        break;
      case "item.map_pack_size":
        propSet(
          query.filters,
          "map_filters.filters.map_packsize.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        break;
      case "item.map_magic_monsters":
        propSet(
          query.filters,
          "map_filters.filters.map_magic_monsters.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        break;
      case "item.map_rare_monsters":
        propSet(
          query.filters,
          "map_filters.filters.map_rare_monsters.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        break;
      case "item.map_drop_chance":
        propSet(
          query.filters,
          "map_filters.filters.map_bonus.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        break;
      case "item.map_item_rarity":
        propSet(
          query.filters,
          "map_filters.filters.map_iir.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        break;
      case "item.map_gold":
        propSet(
          query.filters,
          "map_filters.filters.map_gold.min",
          typeof input.min === "number" ? input.min : undefined,
        );
        break;
    }
  }

  stats = stats.filter((stat) => !INTERNAL_TRADE_IDS.includes(stat.tradeId[0]));

  // if (filters.influences) {
  //   for (const influence of filters.influences) {
  //     stats.push({
  //       disabled: influence.disabled,
  //       statRef: undefined!,
  //       text: undefined!,
  //       tag: undefined!,
  //       sources: undefined!,
  //       tradeId: STAT_BY_REF(INFLUENCE_PSEUDO_TEXT[influence.value])!.trade.ids[
  //         ModifierType.Pseudo
  //       ]
  //     })
  //   }
  // }

  const qAnd = query.stats[0];
  for (const stat of stats) {
    if (stat.statRef === "Only affects Passives in # Ring") {
      const metaSource = stat.roll!;
      const metamorphosisCount = metaSource.bounds!.max;
      const metamorphosisCurrent = metaSource.min as number;
      const builtTradeFilter = Array.from(
        { length: metamorphosisCount },
        (_, index) => ({
          id: `${stat.tradeId[0]}|${index + 1}`,
          disabled: index + 1 !== metamorphosisCurrent,
        }),
      );
      query.stats.push({
        type: "count",
        value: { min: 1 },
        disabled: stat.disabled,
        filters: builtTradeFilter,
      });
      continue;
    }

    if (stat.tradeId.length === 1) {
      qAnd.filters.push(tradeIdToQuery(stat.tradeId[0], stat));
    } else {
      query.stats.push({
        type: "count",
        value: { min: 1 },
        disabled: stat.disabled,
        filters: stat.tradeId.map((id) => tradeIdToQuery(id, stat)),
      });
    }
  }

  if (filters.veiled && !filters.veiled.disabled) {
    propSet(query.filters, "misc_filters.filters.veiled.option", String(true));
    const veiledCount = filters.veiled.veiledCount;

    // HACK: add pseudo stat for veiled count(dont want on my ui though)
    qAnd.filters.push(
      tradeIdToQuery("pseudo.pseudo_number_of_unrevealed_mods", {
        tradeId: ["pseudo.pseudo_number_of_unrevealed_mods"],
        statRef: "# Unrevealed Modifiers",
        text: "Unrevealed Modifiers",
        tag: FilterTag.Pseudo,
        sources: [],
        roll: {
          value: veiledCount,
          min: veiledCount,
          max: undefined,
          default: { min: veiledCount, max: veiledCount },
          dp: false,
          isNegated: false,
        },
        disabled: false,
      }),
    );
  }

  return body;
}

const cache = new Cache();

export async function requestTradeResultList(
  body: TradeRequest,
  leagueId: string,
): Promise<SearchResult> {
  let data = cache.get<SearchResult>([body, leagueId]);

  if (!data) {
    preventQueueCreation([
      { count: 1, limiters: RATE_LIMIT_RULES.SEARCH },
      { count: 1, limiters: RATE_LIMIT_RULES.FETCH },
    ]);

    await RateLimiter.waitMulti(RATE_LIMIT_RULES.SEARCH);

    const response = await Host.proxy(
      `${getTradeEndpoint()}/api/trade2/search/${leagueId}`,
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    adjustRateLimits(RATE_LIMIT_RULES.SEARCH, response.headers);

    const _data = (await response.json()) as TradeResponse<SearchResult>;
    if (_data.error) {
      throw new Error(_data.error.message);
    } else {
      data = _data;
    }

    cache.set<SearchResult>(
      [body, leagueId],
      data,
      Cache.deriveTtl(...RATE_LIMIT_RULES.SEARCH, ...RATE_LIMIT_RULES.FETCH),
    );
  }

  return data;
}

export async function requestResults(
  queryId: string,
  resultIds: string[],
  opts: { accountName: string },
): Promise<PricingResult[]> {
  const { cachedCurrencyByQuery, xchgRateCurrency } = usePoeninja();
  // Solves cached results showing random incorrect values
  cache.purgeIfDifferentCurrency(xchgRateCurrency.value?.id);

  let data = cache.get<FetchResult[]>(resultIds);

  if (!data) {
    await RateLimiter.waitMulti(RATE_LIMIT_RULES.FETCH);

    const response = await Host.proxy(
      `${getTradeEndpoint()}/api/trade2/fetch/${resultIds.join(",")}?query=${queryId}`,
    );
    adjustRateLimits(RATE_LIMIT_RULES.FETCH, response.headers);

    const _data = (await response.json()) as TradeResponse<{
      result: Array<FetchResult | null>;
    }>;
    if (_data.error) {
      throw new Error(_data.error.message);
    } else {
      data = _data.result.filter((res) => res != null);
    }

    cache.set<FetchResult[]>(
      resultIds,
      data,
      Cache.deriveTtl(...RATE_LIMIT_RULES.SEARCH, ...RATE_LIMIT_RULES.FETCH),
    );
  }

  return data.map<PricingResult>((result) => {
    const displayItem: DisplayItem = parseFetchResult(result);

    let priceCurrencyRank: PricingResult["priceCurrencyRank"];
    if (
      result.listing.price?.currency &&
      result.listing.price.currency in CONVERT_CURRENCY
    ) {
      result.listing.price.currency =
        CONVERT_CURRENCY[result.listing.price.currency];
      if (result.listing.price.currency[0] === "G") {
        priceCurrencyRank = 2;
      } else if (result.listing.price.currency[0] === "P") {
        priceCurrencyRank = 3;
      }
    }

    const query = getCurrencyDetailsId(
      result.listing.price?.currency ?? "no price",
    );
    const normalizedCurrency = cachedCurrencyByQuery(
      query,
      result.listing.price?.amount ?? 0,
    );
    const normalizedPrice =
      normalizedCurrency !== undefined
        ? displayRounding(normalizedCurrency.min)
        : undefined;
    const normalizedPriceCurrency =
      normalizedCurrency?.currency !== "div"
        ? xchgRateCurrency.value
        : DivCurrency;

    return {
      id: result.id,
      itemLevel:
        result.item.properties?.find((prop) => prop.type === 78)
          ?.values[0][0] ?? String(result.item.ilvl),
      stackSize: result.item.stackSize,
      corrupted: result.item.corrupted,
      quality: result.item.properties?.find((prop) => prop.type === 6)
        ?.values[0][0],
      level: result.item.properties?.find((prop) => prop.type === 5)
        ?.values[0][0],
      gemSockets: result.item.gemSockets?.length,
      relativeDate:
        DateTime.fromISO(result.listing.indexed).toRelative({
          style: "short",
        }) ?? "",
      priceAmount: result.listing.price?.amount ?? 0,
      priceCurrency: result.listing.price?.currency ?? "no price",
      priceCurrencyRank,
      normalizedPrice,
      normalizedPriceCurrency,
      hasNote: result.item.note != null,
      isMine: result.listing.account.name === opts.accountName,
      isInstantBuyout: result.listing.fee != null,
      ign: result.listing.account.lastCharacterName,
      accountName: result.listing.account.name,
      accountStatus: result.listing.account.online
        ? result.listing.account.online.status === "afk"
          ? "afk"
          : "online"
        : "offline",
      displayItem,
      inDemand: result.listing.in_demand,
      gone: result.gone,
    };
  });
}

function getMinMax(roll: StatFilter["roll"]) {
  if (!roll) {
    return { min: undefined, max: undefined };
  }

  const sign = roll.tradeInvert ? -1 : 1;
  const a = typeof roll.min === "number" ? roll.min * sign : undefined;
  const b = typeof roll.max === "number" ? roll.max * sign : undefined;

  return !roll.tradeInvert ? { min: a, max: b } : { min: b, max: a };
}

function tradeIdToQuery(id: string, stat: StatFilter) {
  // NOTE: if there will be too many overrides in the future,
  //       consider moving them to stats.ndjson

  const roll = stat.roll;
  let tradeId = id;
  if (stat.option != null) {
    tradeId += `|${stat.option.value}`;
  }

  // NOTE: poe1 overrides, leaving until any for poe2 are added
  // fixes Corrupted Implicit "Bleeding cannot be inflicted on you"
  // if (id === "implicit.stat_1901158930") {
  //   if (stat.roll?.value === 100) {
  //     roll = undefined; // stat semantic type is flag
  //   }
  //   // fixes "Cannot be Poisoned" from Essence
  // } else if (id === "explicit.stat_3835551335") {
  //   if (stat.roll?.value === 100) {
  //     roll = undefined; // stat semantic type is flag
  //   }
  //   // fixes "Instant Recovery" on Flasks
  // } else if (id.endsWith("stat_1526933524")) {
  //   if (stat.roll?.value === 100) {
  //     roll = undefined; // stat semantic type is flag
  //   }
  //   // fixes Delve "Reservation Efficiency of Skills"
  // } else if (id.endsWith("stat_1269219558")) {
  //   roll = { ...roll!, tradeInvert: !roll!.tradeInvert };
  // }

  return {
    id: tradeId,
    value: {
      ...getMinMax(roll),
      // option: stat.option != null ? stat.option.value : undefined,
    },
    disabled: stat.disabled,
  };
}

function nameToQuery(name: string, filters: ItemFilters) {
  if (!filters.discriminator) {
    return name;
  } else {
    return {
      discriminator: filters.discriminator.trade,
      option: name,
    };
  }
}

/**
 * Parse out all the components from a fetch result into something easier to display on the ui
 * @param result fetch result json from the trade site
 * @returns item to display on ui
 */
function parseFetchResult(result: FetchResult): PricingResult["displayItem"] {
  /* Components on the trade site:
  Name block
  ------
  Item props
  ------
  Enchant mods
  ------
  Rune mods
  ------
  Implicit mods
  ------
  Explicit mods (+ fractured + desecrated)
  ------
  item tags
  */

  const title: string[] = [];
  if (result.item.name && result.item.name.length > 0) {
    title.push(result.item.name);
  }
  if (result.item.typeLine) {
    title.push(result.item.typeLine);
  }

  const itemTags = [];

  // Should be exclusive to all other tags(except corrupted)
  if (result.item.identified === false) {
    if (result.item.unidentifiedTier) {
      itemTags.push({
        text: `Unidentified (Tier ${result.item.unidentifiedTier})`,
        color: TradeNumberColors.Unmet,
      });
    } else {
      itemTags.push({
        text: "item.unidentified",
        color: TradeNumberColors.Unmet,
      });
    }
  }

  // remaining _should_ be exclusive
  if (result.item.doubleCorrupted) {
    itemTags.push({
      text: _$.DOUBLE_CORRUPTED,
      color: TradeNumberColors.Unmet,
    });
  } else if (result.item.corrupted) {
    itemTags.push({ text: _$.CORRUPTED, color: TradeNumberColors.Unmet });
  }
  if (result.item.duplicated) {
    itemTags.push({ text: _$.MIRRORED, color: TradeNumberColors.Augmented });
  }
  if (result.item.sanctified) {
    itemTags.push({ text: _$.SANCTIFIED, color: TradeNumberColors.Sanctified });
  }

  const displayItem: PricingResult["displayItem"] = {
    title,
    rarity: result.item.rarity,
    frameType: result.item.frameType,
    nameBlock: buildNameBlock(result.item.extended, result.item.properties),
    itemProps: buildItemProps(result.item.ilvl, result.item.requirements),
    grantSkill: buildGrantSkillBlock(result.item.grantedSkills),
    ...parseMods(result),
    sockets: result.item.sockets,
    itemTags,
    icon: {
      url: result.item.icon,
      w: result.item.w,
      h: result.item.h,
    },
  };

  return displayItem;
}

function parseMods(result: FetchResult): {
  enchantMods?: DisplayItemLine[] | undefined;
  runeMods?: DisplayItemLine[] | undefined;
  implicitMods?: DisplayItemLine[] | undefined;
  explicitMods?: DisplayItemLine[] | undefined;
  desecratedMods?: DisplayItemLine[] | undefined;
  mutatedMods?: DisplayItemLine[] | undefined;
  fracturedMods?: DisplayItemLine[] | undefined;
  pseudoMods?: DisplayItemLine[] | undefined;
} {
  /*

  */
  return {
    enchantMods: parseModBlock(
      result.item.enchantMods,
      TradeNumberColors.Enchant,
    ),
    runeMods: parseModBlock(result.item.runeMods, TradeNumberColors.Enchant),
    implicitMods: parseModBlock(result.item.implicitMods),
    fracturedMods: parseModBlock(
      result.item.fracturedMods,
      TradeNumberColors.Fractured,
    ),
    explicitMods: parseModBlock(result.item.explicitMods),
    desecratedMods: parseModBlock(
      result.item.desecratedMods,
      TradeNumberColors.Desecrated,
    ),
    mutatedMods: parseModBlock(
      result.item.mutatedMods,
      TradeNumberColors.Mutated,
    ),
    pseudoMods: parseModBlock(result.item.pseudoMods),
  };
}

function parseModBlock(
  translated: string[] | undefined,
  color: TradeNumberColors = TradeNumberColors.Augmented,
  // mods: TradeModMetadata[] | undefined,
  // hashes: Array<Array<string | number[] | null>> | undefined,
): DisplayItemLine[] | undefined {
  // separate function, allow doing complex parsing later if needed
  if (!translated) return undefined;
  return translated.map((s) => {
    return { text: parseAffixStrings(s), color };
  });
}

function buildNameBlock(
  extended: FetchResult["item"]["extended"],
  props: FetchResult["item"]["properties"],
): DisplayItem["nameBlock"] {
  const block: Array<{
    text: string;
    value: string | number;
    color: TradeNumberColors;
  }> = [];
  if (!props || !extended) return block;

  // put everything from props in the block, but replace certain ones
  if (props) {
    let hasDamage = false;
    for (const prop of props) {
      const { name, values, type } = prop;
      let text: string | undefined;
      switch (type) {
        // TODO: swap to dps from extended
        case TradePropType.WeaponPhysicalDamage:
          block.push({
            text: "item.physical_dps",
            value: extended.pdps!,
            color: useColor(extended.pdps_aug),
          });
          hasDamage = true;
          continue;
        case TradePropType.WeaponElementalDamage:
          block.push({
            text: "item.elemental_dps",
            value: extended.edps!,
            color: useColor(extended.edps_aug),
          });
          hasDamage = true;
          continue;

        case TradePropType.ArmourReduction:
          block.push({
            text: "item.armour",
            value: extended.ar!,
            color: useColor(extended.ar_aug) || values[0][1],
          });
          continue;
        case TradePropType.ArmourEvasion:
          block.push({
            text: "item.evasion_rating",
            value: extended.ev!,
            color: useColor(extended.ev_aug) || values[0][1],
          });
          continue;
        case TradePropType.ArmourEnergyShield:
          block.push({
            text: "item.energy_shield",
            value: extended.es!,
            color: useColor(extended.es_aug) || values[0][1],
          });
          continue;

        case TradePropType.ArmourWard:
          block.push({
            text: "item.runic_ward",
            value: extended.ward!,
            color: useColor(extended.ward_aug) || values[0][1],
          });
          continue;

        case TradePropType.Quality:
          text = "item.quality";
          break;

        case TradePropType.WeaponSpeed:
          text = "item.aps";
          break;
        case TradePropType.WeaponCriticalChance:
          text = "item.crit";
          break;
        case TradePropType.WeaponReloadTime:
          text = "item.reload_time";
          break;
        case TradePropType.ShieldBlock:
          text = "item.block";
          break;
        case TradePropType.Spirit:
          text = "item.spirit";
          break;

        // map stuffs
        case TradePropType.MapTier:
          text = "item.map_tier";
          break;
        case TradePropType.MapPortals:
          text = "item.map_revives";
          break;
        case TradePropType.MapPackSizeBonus:
          text = "item.map_pack_size";
          break;
        case TradePropType.MapMagicMonstersQuantityBonus:
          text = "item.map_magic_monsters";
          break;
        case TradePropType.MapRareMonstersQuantityBonus:
          text = "item.map_rare_monsters";
          break;
        case TradePropType.MapMapItemDropChanceBonus:
          text = "item.map_drop_chance";
          break;
        case TradePropType.MapRarityBonus:
          text = "item.map_item_rarity";
          break;
        case TradePropType.MapGoldQuantityBonus:
          text = "item.map_gold";
          break;
        case TradePropType.MapQuantityBonus:
          // text = "item.map_item_quantity";
          break;
      }

      block.push({
        text: text ?? `${parseAffixStrings(name)} `,
        // if we have a value, there should only be one probably...
        value: values.length ? values[0][0] : "",
        color: values.length ? values[0][1] : TradeNumberColors.White,
      });
    }
    if (hasDamage) {
      const dpsIndex = block.findIndex((line) => line.text.includes("dps"));
      block.splice(dpsIndex, 0, {
        text: "item.total_dps",
        value: extended.dps!,
        color: useColor(extended.dps_aug),
      });
    }

    return block;
  }

  function useColor(use: boolean | undefined) {
    return use ? TradeNumberColors.Augmented : TradeNumberColors.White;
  }
}

function buildItemProps(
  ilvl: number | undefined,
  requirements: TradeDataRichLine[] | undefined,
): DisplayItem["itemProps"] {
  if (!ilvl && !requirements) return;

  const block: Array<{
    text: string;
    value: string | number;
    color: TradeNumberColors;
  }> = [];
  if (ilvl) {
    block.push({
      text: "item.item_level",
      value: ilvl,
      color: TradeNumberColors.White,
    });
  }
  if (requirements && requirements.length) {
    let value = requirements[0].values[0][0];

    if (requirements.length > 1) {
      value = parseAffixStrings(
        `${value}, ${requirements
          .slice(1)
          .map((r) => `${r.values[0][0]} ${r.name}`)
          .join(", ")}`,
      );
    }

    // do i actually care about this?
    block.push({
      // no colon for req
      text: `${parseAffixStrings(requirements[0].name)} `,
      value,
      color: TradeNumberColors.White,
    });
  }
  return block;
}

function buildGrantSkillBlock(
  skills: TradeDataRichLine[] | undefined,
): DisplayItemLine[] {
  if (!skills || skills.length === 0) return [];
  const block: DisplayItemLine[] = [];
  for (const skill of skills) {
    block.push({
      text: `${parseAffixStrings(skill.name)}: `,
      value: parseAffixStrings(skill.values[0][0]),
      color: skill.values[0][1],
    });
  }

  return block;
}

// Disable since this is export for tests
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __testExports = {
  parseFetchResult,
};
