import {
  calculatedStatToFilter,
  FiltersCreationContext,
  shortRollToFilter,
} from "../create-stat-filters";
import {
  calcPropBounds,
  propAt20Quality,
  QUALITY_STATS,
} from "@/parser/calc-q20";
import { stat, StatBetter } from "@/assets/data";
import { ARMOUR, WEAPON, ItemCategory } from "@/parser/meta";
import { ParsedItem } from "@/parser";
import { ModifierType, StatRoll, StatSource } from "@/parser/modifiers";
import {
  FilterTag,
  INTERNAL_TRADE_IDS,
  InternalTradeId,
  ItemIsElementalModifier,
  StatFilter,
  StatFilterRoll,
} from "../interfaces";

export function filterItemProp(ctx: FiltersCreationContext) {
  if (ARMOUR.has(ctx.item.category!)) {
    armourProps(ctx);
  }
  if (WEAPON.has(ctx.item.category!)) {
    weaponProps(ctx);
  }
  if (ctx.item.category === ItemCategory.Map) {
    mapProps(ctx);
  }
}

export function filterBasePercentile(ctx: FiltersCreationContext) {
  if (ctx.item.basePercentile != null) {
    ctx.filters.push(
      propToFilter(
        {
          ref: "Base Percentile: #%",
          tradeId: "item.base_percentile",
          roll: { min: 0, max: 100, value: ctx.item.basePercentile },
          sources: [],
          disabled: ctx.item.basePercentile < 50,
        },
        ctx,
      ),
    );
  }
}

export const ARMOUR_STATS = new Set<string>([
  ...QUALITY_STATS.ARMOUR.flat,
  ...QUALITY_STATS.EVASION.flat,
  ...QUALITY_STATS.ENERGY_SHIELD.flat,
  ...QUALITY_STATS.ARMOUR.incr,
  ...QUALITY_STATS.EVASION.incr,
  ...QUALITY_STATS.ENERGY_SHIELD.incr,
  stat("#% increased Block chance"),
]);

function armourProps(ctx: FiltersCreationContext) {
  const { item } = ctx;

  if (item.armourAR) {
    const totalQ20 = propAt20Quality(item.armourAR, QUALITY_STATS.ARMOUR, item);

    ctx.filters.push(
      propToFilter(
        {
          ref: "Armour: #",
          tradeId: "item.armour",
          roll: totalQ20.roll,
          sources: totalQ20.sources,
          disabled: !isSingleAttrArmour(item),
        },
        ctx,
      ),
    );
  }

  if (item.armourEV) {
    const totalQ20 = propAt20Quality(
      item.armourEV,
      QUALITY_STATS.EVASION,
      item,
    );

    ctx.filters.push(
      propToFilter(
        {
          ref: "Evasion Rating: #",
          tradeId: "item.evasion_rating",
          roll: totalQ20.roll,
          sources: totalQ20.sources,
          disabled: !isSingleAttrArmour(item),
        },
        ctx,
      ),
    );
  }

  if (item.armourES) {
    const totalQ20 = propAt20Quality(
      item.armourES,
      QUALITY_STATS.ENERGY_SHIELD,
      item,
    );

    ctx.filters.push(
      propToFilter(
        {
          ref: "Energy Shield: #",
          tradeId: "item.energy_shield",
          roll: totalQ20.roll,
          sources: totalQ20.sources,
          disabled: !isSingleAttrArmour(item),
        },
        ctx,
      ),
    );
  }

  if (item.armourBLOCK) {
    const block = calcPropBounds(
      item.armourBLOCK,
      { flat: [], incr: ["#% increased Block chance"] },
      item,
    );

    ctx.filters.push(
      propToFilter(
        {
          ref: "Block: #%",
          tradeId: "item.block",
          roll: block.roll,
          sources: block.sources,
          disabled: true,
        },
        ctx,
      ),
    );
  }

  if (item.armourAR || item.armourEV || item.armourES || item.armourBLOCK) {
    removeUsedStats(ctx, ARMOUR_STATS);
  }
}

export const WEAPON_STATS = new Set<string>([
  ...QUALITY_STATS.PHYSICAL_DAMAGE.flat,
  ...QUALITY_STATS.PHYSICAL_DAMAGE.incr,
  stat("#% increased Attack Speed"),
  stat("#% to Critical Hit Chance"),

  // stat('Adds # to # Chaos Damage'),
  stat("Adds # to # Lightning Damage"),
  stat("Adds # to # Cold Damage"),
  stat("Adds # to # Fire Damage"),
]);

function weaponProps(ctx: FiltersCreationContext) {
  const { item } = ctx;

  const attackSpeed = calcPropBounds(
    item.weaponAS ?? 0,
    { incr: ["#% increased Attack Speed"], flat: [] },
    item,
  );
  const physQ20 = propAt20Quality(
    item.weaponPHYSICAL ?? 0,
    QUALITY_STATS.PHYSICAL_DAMAGE,
    item,
  );
  const pdpsQ20: StatRoll = {
    value: physQ20.roll.value * attackSpeed.roll.value,
    min: physQ20.roll.min * attackSpeed.roll.min,
    max: physQ20.roll.max * attackSpeed.roll.max,
  };

  const eleDmg = calcPropBounds(
    item.weaponELEMENTAL ?? 0,
    {
      flat: [
        "Adds # to # Lightning Damage",
        "Adds # to # Cold Damage",
        "Adds # to # Fire Damage",
      ],
      incr: [],
    },
    item,
  );

  const fireDmg = calcPropBounds(
    item.weaponFIRE ?? 0,
    {
      flat: ["Adds # to # Fire Damage"],
      incr: [],
    },
    item,
  );
  const coldDmg = calcPropBounds(
    item.weaponCOLD ?? 0,
    {
      flat: ["Adds # to # Cold Damage"],
      incr: [],
    },
    item,
  );
  const lightningDmg = calcPropBounds(
    item.weaponLIGHTNING ?? 0,
    {
      flat: ["Adds # to # Lightning Damage"],
      incr: [],
    },
    item,
  );

  const edps: StatRoll = {
    value: eleDmg.roll.value * attackSpeed.roll.value,
    min: eleDmg.roll.min * attackSpeed.roll.min,
    max: eleDmg.roll.max * attackSpeed.roll.max,
  };
  const dps: StatRoll = {
    value: pdpsQ20.value + edps.value,
    min: pdpsQ20.min + edps.min,
    max: pdpsQ20.max + edps.max,
  };
  const fireDps: StatRoll = {
    value: fireDmg.roll.value * attackSpeed.roll.value,
    min: fireDmg.roll.min * attackSpeed.roll.min,
    max: fireDmg.roll.max * attackSpeed.roll.max,
  };
  const coldDps: StatRoll = {
    value: coldDmg.roll.value * attackSpeed.roll.value,
    min: coldDmg.roll.min * attackSpeed.roll.min,
    max: coldDmg.roll.max * attackSpeed.roll.max,
  };
  const lightningDps: StatRoll = {
    value: lightningDmg.roll.value * attackSpeed.roll.value,
    min: lightningDmg.roll.min * attackSpeed.roll.min,
    max: lightningDmg.roll.max * attackSpeed.roll.max,
  };

  if (item.weaponELEMENTAL) {
    const elementalInfo: Record<string, StatFilterRoll> = {};
    if (fireDps.value !== 0)
      elementalInfo[INTERNAL_TRADE_IDS[13]] = shortRollToFilter(
        fireDps,
        ctx.searchInRange,
        item,
      );
    if (coldDps.value !== 0)
      elementalInfo[INTERNAL_TRADE_IDS[14]] = shortRollToFilter(
        coldDps,
        ctx.searchInRange,
        item,
      );
    if (lightningDps.value !== 0)
      elementalInfo[INTERNAL_TRADE_IDS[15]] = shortRollToFilter(
        lightningDps,
        ctx.searchInRange,
        item,
      );
    ctx.filters.push(
      propToFilter(
        {
          ref: "Total DPS: #",
          tradeId: "item.total_dps",
          roll: dps,
          sources: [eleDmg.sources, physQ20.sources].flat(),
          disabled: false,
        },
        ctx,
      ),
    );

    const elementalFilter = propToFilter(
      {
        ref: "Elemental DPS: #",
        tradeId: "item.elemental_dps",
        roll: edps,
        sources: eleDmg.sources,
        disabled: edps.value / dps.value < 0.15,
        hidden:
          edps.value / dps.value < 0.15 ? "filters.hide_ele_dps" : undefined,
        option: {
          value: ItemIsElementalModifier.Any,
        },
      },
      ctx,
    );

    if (Object.keys(elementalInfo).length) {
      elementalInfo[INTERNAL_TRADE_IDS[12]] = elementalFilter.roll!;
      elementalFilter.additionalInfo = {
        elementalInfo,
      };
    }

    ctx.filters.push(elementalFilter);
  }

  if (item.weaponPHYSICAL) {
    ctx.filters.push(
      propToFilter(
        {
          ref: "Physical DPS: #",
          tradeId: "item.physical_dps",
          roll: pdpsQ20,
          sources: physQ20.sources,
          disabled: !isPdpsImportant(item) || pdpsQ20.value / dps.value < 0.67,
          hidden:
            pdpsQ20.value / dps.value < 0.67
              ? "filters.hide_phys_dps"
              : undefined,
        },
        ctx,
      ),
    );
  }

  if (item.weaponAS) {
    ctx.filters.push(
      propToFilter(
        {
          ref: "Attacks per Second: #",
          tradeId: "item.aps",
          roll: attackSpeed.roll,
          sources: attackSpeed.sources,
          dp: true,
          disabled: true,
        },
        ctx,
      ),
    );
  }

  if (item.weaponCRIT) {
    const critChance = calcPropBounds(
      item.weaponCRIT,
      {
        incr: ["#% increased Critical Hit Chance"],
        flat: ["#% to Critical Hit Chance"],
      },
      item,
    );

    ctx.filters.push(
      propToFilter(
        {
          ref: "Critical Hit Chance: #%",
          tradeId: "item.crit",
          roll: critChance.roll,
          sources: critChance.sources,
          dp: true,
          disabled: true,
        },
        ctx,
      ),
    );
  }

  if (item.weaponReload) {
    const reloadTime = calcPropBounds(
      item.weaponReload,
      {
        incr: ["#% increased Attack Speed"],
        flat: [],
      },
      item,
      // Inverted since lower is better for reload time
      true,
    );
    ctx.filters.push(
      propToFilter(
        {
          ref: "Reload Time: #",
          tradeId: "item.reload_time",
          roll: reloadTime.roll,
          sources: reloadTime.sources,
          dp: true,
          disabled: true,
        },
        ctx,
      ),
    );
  }

  if (
    item.weaponAS ||
    item.weaponCRIT ||
    item.weaponELEMENTAL ||
    item.weaponPHYSICAL
  ) {
    removeUsedStats(ctx, WEAPON_STATS);
  }
}

function mapProps(ctx: FiltersCreationContext) {
  const { item } = ctx;

  if (item.mapRevives) {
    const revives = calcPropBounds(
      item.mapRevives,
      { flat: [], incr: [] },
      item,
    );
    ctx.filters.push(
      propToFilter(
        {
          ref: "Revives Available: #",
          tradeId: "item.map_revives",
          roll: revives.roll,
          sources: revives.sources,
          disabled: true,
          hidden: "filters.hide_revives",
        },
        ctx,
      ),
    );
  }

  if (item.mapPackSize) {
    const packSize = calcPropBounds(
      item.mapPackSize,
      { flat: [], incr: [] },
      item,
    );
    ctx.filters.push(
      propToFilter(
        {
          ref: "Monster Pack Size: #",
          tradeId: "item.map_pack_size",
          roll: packSize.roll,
          sources: packSize.sources,
          disabled: true,
        },
        ctx,
      ),
    );
  }

  if (item.mapMagicMonsters) {
    const magicMonsters = calcPropBounds(
      item.mapMagicMonsters,
      { flat: [], incr: [] },
      item,
    );
    ctx.filters.push(
      propToFilter(
        {
          ref: "Magic Monsters: #",
          tradeId: "item.map_magic_monsters",
          roll: magicMonsters.roll,
          sources: magicMonsters.sources,
          disabled: true,
        },
        ctx,
      ),
    );
  }

  if (item.mapRareMonsters) {
    const rareMonsters = calcPropBounds(
      item.mapRareMonsters,
      { flat: [], incr: [] },
      item,
    );
    ctx.filters.push(
      propToFilter(
        {
          ref: "Rare Monsters: #",
          tradeId: "item.map_rare_monsters",
          roll: rareMonsters.roll,
          sources: rareMonsters.sources,
          disabled: true,
        },
        ctx,
      ),
    );
  }

  if (item.mapDropChance) {
    const dropChance = calcPropBounds(
      item.mapDropChance,
      { flat: [], incr: [] },
      item,
    );
    ctx.filters.push(
      propToFilter(
        {
          ref: "Waystone Drop Chance: #%",
          tradeId: "item.map_drop_chance",
          roll: dropChance.roll,
          sources: dropChance.sources,
          disabled: true,
        },
        ctx,
      ),
    );
  }

  if (item.mapItemRarity) {
    const itemRarity = calcPropBounds(
      item.mapItemRarity,
      { flat: [], incr: [] },
      item,
    );
    ctx.filters.push(
      propToFilter(
        {
          ref: "Item Rarity: #%",
          tradeId: "item.map_item_rarity",
          roll: itemRarity.roll,
          sources: itemRarity.sources,
          disabled: true,
        },
        ctx,
      ),
    );
  }

  if (item.mapGold) {
    const gold = calcPropBounds(item.mapGold, { flat: [], incr: [] }, item);
    ctx.filters.push(
      propToFilter(
        {
          ref: "Gold Found: #%",
          tradeId: "item.map_gold",
          roll: gold.roll,
          sources: gold.sources,
          disabled: true,
        },
        ctx,
      ),
    );
  }
}

function removeUsedStats(ctx: FiltersCreationContext, stats: Set<string>) {
  ctx.statsByType = ctx.statsByType.filter((m) => !stats.has(m.stat.ref));
}

function isSingleAttrArmour(item: ParsedItem) {
  return true;
  // return (
  //   [item.armourAR, item.armourEV, item.armourES].filter(
  //     (value) => value != null,
  //   ).length === 1
  // );
}

function isPdpsImportant(item: ParsedItem) {
  switch (item.category) {
    case ItemCategory.OneHandedAxe:
    case ItemCategory.TwoHandedAxe:
    case ItemCategory.OneHandedSword:
    case ItemCategory.TwoHandedSword:
    case ItemCategory.OneHandedMace:
    case ItemCategory.TwoHandedMace:
    case ItemCategory.Bow:
    case ItemCategory.Warstaff:
    case ItemCategory.Crossbow:
    case ItemCategory.Spear:
    case ItemCategory.Flail:
      return true;
    default:
      return false;
  }
}

function propToFilter(
  opts: {
    ref: string;
    tradeId: InternalTradeId;
    roll: StatRoll;
    sources: StatSource[];
    dp?: boolean;
    disabled?: StatFilter["disabled"];
    hidden?: StatFilter["hidden"];
    option?: StatFilter["option"];
  },
  ctx: FiltersCreationContext,
): StatFilter {
  const stat = {
    ref: opts.ref,
    matchers: [{ string: opts.ref }],
    trade: { ids: { pseudo: [opts.tradeId] } },
    better: StatBetter.PositiveRoll,
  };
  const filter = calculatedStatToFilter(
    {
      stat,
      type: ModifierType.Pseudo,
      sources: [
        {
          modifier: {
            info: { type: ModifierType.Pseudo, tags: [] },
            stats: [],
          },
          stat: {
            stat,
            translation: stat.matchers[0],
            roll: {
              dp: opts.dp ?? false,
              unscalable: false,
              ...opts.roll,
            },
          },
          contributes: opts.roll,
        },
      ],
    },
    ctx.searchInRange,
    ctx.item,
  );

  filter.tag = FilterTag.Property;
  filter.sources = opts.sources;
  if (opts.disabled != null) filter.disabled = opts.disabled;
  if (opts.hidden != null) filter.hidden = opts.hidden;
  if (opts.option != null) filter.option = opts.option;

  return filter;
}
