import { ItemCategory, ParsedItem, ItemRarity } from "@/parser";
import {
  ItemFilters,
  StatFilter,
  INTERNAL_TRADE_IDS,
  InternalTradeId,
  ItemIsElementalModifier,
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
import { STAT_BY_REF } from "@/assets/data";
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

const TABLET_USES_STATS = [
  "Adds Irradiated to a Map \n# use remaining",
  "Adds Ritual Altars to a Map \n# use remaining",
  "Adds a Kalguuran Expedition to a Map \n# use remaining",
  "Adds a Mirror of Delirium to a Map \n# use remaining",
  "Adds an Otherworldy Breach to a Map \n# use remaining",
  "Empowers the Map Boss of a Map \n# use remaining",
  "Adds Abysses to a Map \n# use remaining",
];

interface FilterBoolean {
  option?: "true" | "false";
}
interface FilterRange {
  min?: number;
  max?: number;
}

interface TradeRequest {
  /* eslint-disable camelcase */
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
          // Rune Slots
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

interface FetchResult {
  id: string;
  item: {
    ilvl?: number;
    stackSize?: number;
    corrupted?: boolean;
    gemSockets?: string[];
    properties?: Array<{
      values: [[string, number]];
      type:
        | 78 // Corpse Level (Filled Coffin)
        | 30 // Spawns a Level %0 Monster when Harvested
        | 6 // Quality
        | 5; // Level
    }>;
    note?: string;
    implicitMods?: string[];
    explicitMods?: string[];
    enchantMods?: string[];
    runeMods?: string[];
    extended?: {
      dps?: number;
      pdps?: number;
      edps?: number;
      ar?: number;
      ev?: number;
      es?: number;
    };
    pseudoMods?: string[];
    desecratedMods?: string[];
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

export interface DisplayItem {
  runeMods?: string[];
  implicitMods?: string[];
  explicitMods?: string[];
  enchantMods?: string[];
  pseudoMods?: string[];
  extended?: Array<{ text: string; value: number }>;
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

  if (filters.runeSockets && !filters.runeSockets.disabled) {
    propSet(
      query.filters,
      "equipment_filters.filters.rune_sockets.min",
      filters.runeSockets.value,
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
    propSet(
      query.filters,
      "misc_filters.filters.area_level.min",
      filters.areaLevel.value,
    );
  }

  if (filters.unidentified && !filters.unidentified.disabled) {
    propSet(
      query.filters,
      "misc_filters.filters.identified.option",
      String(false),
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

  // Custom fake pseudo filter for uses remaining
  if (filters.usesRemaining) {
    query.stats.push({
      type: "count",
      value: { min: 1 },
      disabled: filters.usesRemaining.disabled,
      filters: TABLET_USES_STATS.map((ref) => {
        const stat = STAT_BY_REF(ref)!;
        return {
          id: stat.trade.ids[ModifierType.Implicit][0],
          value: { min: filters.usesRemaining!.value },
          disabled: false,
        };
      }),
    });
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

  stats = stats.filter(
    (stat) => !INTERNAL_TRADE_IDS.includes(stat.tradeId[0] as any),
  );
  if (filters.veiled && !filters.veiled.disabled) {
    propSet(query.filters, "misc_filters.filters.veiled.option", String(true));
  }

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
    const runeMods = result.item.runeMods?.map((s) => parseAffixStrings(s));
    const implicitMods = result.item.implicitMods?.map((s) =>
      parseAffixStrings(s),
    );
    const explicitMods = result.item.explicitMods?.map((s) =>
      parseAffixStrings(s),
    );
    const enchantMods = result.item.enchantMods?.map((s) =>
      parseAffixStrings(s),
    );
    const desecratedMods = result.item.desecratedMods?.map((s) =>
      parseAffixStrings(s),
    );
    const pseudoMods = result.item.pseudoMods?.map((s) => {
      if (s.startsWith("Sum: ")) {
        const pseudoRes = +s.slice(5);
        if (!isNaN(pseudoRes)) {
          return `+${pseudoRes}% total Elemental Resistance`;
        }
      }
      return s;
    });
    const extended = result.item.extended
      ? Object.entries(result.item.extended)
          .filter(([key, value]) => value !== undefined) // Include only keys with defined values
          .filter(([key]) =>
            ["ar", "ev", "es", "dps", "pdps", "edps"].includes(key),
          ) // Exclude mods
          .map(([key, value]) => {
            const labels: Record<string, string> = {
              ar: "Armour: ",
              ev: "Evasion Rating: ",
              es: "Energy Shield: ",
              dps: "Total DPS: ",
              pdps: "Physical DPS: ",
              edps: "Elemental DPS: ",
            };

            return {
              text: labels[key] || `${key}: `,
              value: Math.round(value),
            };
          })
      : undefined;

    const displayItem: PricingResult["displayItem"] = {
      runeMods,
      implicitMods,
      // HACK: fix the implementation at some point
      explicitMods: (explicitMods ?? []).concat(desecratedMods ?? []),
      enchantMods,
      pseudoMods,
      extended,
    };

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
