import {
  ParsedItem,
  ItemRarity,
  ItemCategory,
  itemIsModifiable,
} from "@/parser";
import {
  ModifierType,
  StatCalculated,
  StatRoll,
  statSourcesTotal,
  translateStatWithRoll,
} from "@/parser/modifiers";
import { percentRoll, percentRollDelta, roundRoll } from "./util";
import {
  FilterTag,
  ItemHasEmptyModifier,
  StatFilter,
  StatFilterRoll,
} from "./interfaces";
import { filterPseudo } from "./pseudo";
import { applyRules as applyAtzoatlRules } from "./pseudo/atzoatl-rules";
import { applyRules as applyMirroredTabletRules } from "./pseudo/reflection-rules";
import { filterItemProp, filterBasePercentile } from "./pseudo/item-property";
import { decodeOils, applyAnointmentRules } from "./pseudo/anointments";
import { StatBetter, CLIENT_STRINGS } from "@/assets/data";
import { explicitModifierCount, maxUsefulItemLevel } from "./common";
import { getMaxSockets } from "@/parser/Parser";

export interface FiltersCreationContext {
  readonly item: ParsedItem;
  readonly searchInRange: number;
  filters: StatFilter[];
  statsByType: StatCalculated[];
}

export function createExactStatFilters(
  item: ParsedItem,
  statsByType: StatCalculated[],
  opts: { searchStatRange: number; defaultAllSelected: boolean },
): StatFilter[] {
  if (item.mapBlighted || item.category === ItemCategory.Invitation) return [];
  if (
    item.isUnidentified &&
    item.rarity === ItemRarity.Unique &&
    !item.isSynthesised
  )
    return [];

  const keepByType = [
    ModifierType.Pseudo,
    ModifierType.Fractured,
    ModifierType.Enchant,
    ModifierType.Necropolis,
    ModifierType.Sanctum,
  ];

  if (
    !item.influences.length &&
    !item.isFractured &&
    item.category !== ItemCategory.Tincture
  ) {
    keepByType.push(ModifierType.Implicit);
  }

  if (
    (item.rarity === ItemRarity.Magic ||
      (item.rarity === ItemRarity.Rare &&
        explicitModifierCount(item).total < 5)) &&
    item.category !== ItemCategory.ClusterJewel &&
    item.category !== ItemCategory.Map &&
    item.category !== ItemCategory.HeistContract &&
    item.category !== ItemCategory.HeistBlueprint &&
    item.category !== ItemCategory.Sentinel
  ) {
    keepByType.push(ModifierType.Explicit);
  }

  if (item.category === ItemCategory.Flask) {
    keepByType.push(ModifierType.Crafted);
  }
  let searchInRange = Math.min(2, opts.searchStatRange);
  if (item.category === ItemCategory.Tablet) {
    searchInRange = 0;
  }

  const ctx: FiltersCreationContext = {
    item,
    searchInRange,
    filters: [],
    statsByType: statsByType.filter((calc) => keepByType.includes(calc.type)),
  };

  // filterBasePercentile(ctx);

  ctx.filters.push(
    ...ctx.statsByType.map((mod) =>
      calculatedStatToFilter(mod, ctx.searchInRange, item),
    ),
  );

  if (item.info.refName === "Chronicle of Atzoatl") {
    applyAtzoatlRules(ctx.filters);
    return ctx.filters;
  }
  if (item.info.refName === "Mirrored Tablet") {
    applyMirroredTabletRules(ctx.filters);
    return ctx.filters;
  }

  for (const filter of ctx.filters) {
    filter.hidden = undefined;
    if (item.category === ItemCategory.Tablet) {
      if (filter.tag === FilterTag.Explicit) {
        filter.disabled = false;
      }
    } else if (filter.tag === FilterTag.Explicit) {
      filter.disabled = !filter.sources.some(
        (source) =>
          source.modifier.info.tier != null && source.modifier.info.tier <= 2,
      );
    } else if (filter.tag !== FilterTag.Property) {
      filter.disabled = false;
    }

    if (filter.statRef === "# uses remaining") {
      filter.roll!.min = filter.roll!.value;
      filter.roll!.default.min = filter.roll!.value;
      filter.roll!.default.max = filter.roll!.value;
    }
  }

  const hasEmptyModifier = showHasEmptyModifier(ctx);
  if (hasEmptyModifier !== false) {
    const roll = hasEmptyModifier.counts[hasEmptyModifier.empty];
    ctx.filters.push({
      tradeId: ["item.has_empty_modifier"],
      text: "# Empty Modifier",
      statRef: "# Empty Modifier",
      disabled: false,
      tag: FilterTag.Pseudo,
      sources: [],
      option: {
        value: hasEmptyModifier.empty,
      },
      additionalInfo: {
        emptyModifierInfo: hasEmptyModifier.counts,
      },
      roll: {
        value: roll,
        min: roll,
        max: undefined,
        default: { min: roll, max: roll },
        dp: false,
        isNegated: false,
      },
    });
  }

  if (item.category === ItemCategory.ClusterJewel) {
    applyClusterJewelRules(ctx.filters);
  } else if (item.category === ItemCategory.Flask) {
    applyFlaskRules(ctx.filters);
  } else if (
    item.category === ItemCategory.MemoryLine ||
    item.category === ItemCategory.SanctumRelic ||
    item.category === ItemCategory.Charm ||
    item.category === ItemCategory.Relic
  ) {
    enableAllFilters(ctx.filters);
  }

  if (opts.defaultAllSelected) {
    enableAllFilters(ctx.filters);
  }

  return ctx.filters;
}

export function initUiModFilters(
  item: ParsedItem,
  opts: {
    searchStatRange: number;
    defaultAllSelected: boolean;
  },
): StatFilter[] {
  const ctx: FiltersCreationContext = {
    item,
    filters: [],
    searchInRange:
      item.rarity === ItemRarity.Normal ? 100 : opts.searchStatRange,
    statsByType: item.statsByType.map((calc) => {
      if (
        (calc.type === ModifierType.Fractured ||
          calc.type === ModifierType.Desecrated) &&
        calc.stat.trade.ids[ModifierType.Explicit]
      ) {
        return { ...calc, type: ModifierType.Explicit };
      } else {
        return calc;
      }
    }),
  };

  if (item.info.refName !== "Split Personality") {
    filterItemProp(ctx);
    // TODO: see if there are other options here, don't want to include trade site uniques with random runes
    if (item.rarity !== ItemRarity.Unique || !getMaxSockets(item)) {
      filterPseudo(ctx);
    }
    if (item.info.refName === "Emperor's Vigilance") {
      filterBasePercentile(ctx);
    }
  }

  if (itemIsModifiable(item)) {
    ctx.statsByType = ctx.statsByType.filter(
      (mod) =>
        mod.type !== ModifierType.Fractured &&
        mod.type !== ModifierType.Desecrated,
    );
    ctx.statsByType.push(
      ...item.statsByType.filter(
        (mod) =>
          mod.type === ModifierType.Fractured ||
          mod.type === ModifierType.Desecrated,
      ),
    );
  }

  if (item.isVeiled) {
    ctx.statsByType = ctx.statsByType.filter(
      (mod) => mod.type !== ModifierType.Veiled,
    );
  }

  ctx.filters.push(
    ...ctx.statsByType.map((mod) =>
      calculatedStatToFilter(mod, ctx.searchInRange, item),
    ),
  );

  if (item.isVeiled) {
    ctx.filters.forEach((filter) => {
      filter.disabled = true;
    });
  }

  finalFilterTweaks(ctx);

  if (opts.defaultAllSelected) {
    enableAllFilters(ctx.filters);
  }

  return ctx.filters;
}

export function shortRollToFilter(
  roll: StatRoll,
  percent: number,
  item: ParsedItem,
): StatFilterRoll {
  // NOTE: assuming no dp since currently only for ele rolls
  const dp = false;
  const filterBounds = {
    min: percentRoll(roll.min, -0, Math.floor, dp),
    max: percentRoll(roll.max, +0, Math.ceil, dp),
  };
  const filterDefault = {
    min: percentRoll(roll.value, -percent, Math.floor, dp),
    max: percentRoll(roll.value, +percent, Math.ceil, dp),
  };

  filterDefault.min = Math.max(filterDefault.min, filterBounds.min);
  filterDefault.max = Math.min(filterDefault.max, filterBounds.max);

  const filterRoll = {
    value: roundRoll(roll.value, dp),
    min: undefined,
    max: undefined,
    default: filterDefault,
    bounds:
      item.rarity === ItemRarity.Unique && roll.min !== roll.max
        ? filterBounds
        : undefined,
    dp,
    // NOTE: currently only for ele rolls so we know it's not negated
    isNegated: false,
    tradeInvert: false,
  };
  // NOTE: currently only for ele rolls so we know better is 1
  filterFillMinMax(filterRoll, 1);
  return filterRoll;
}

export function calculatedStatToFilter(
  calc: StatCalculated,
  percent: number,
  item: ParsedItem,
  disabled: boolean = true,
): StatFilter {
  const { stat, sources, type } = calc;
  let filter: StatFilter;

  const roll = statSourcesTotal(
    calc.sources,
    item.info.refName === "Mirrored Tablet" ? "max" : "sum",
  );
  const translation = translateStatWithRoll(calc, roll);

  if (stat.trade.option) {
    filter = {
      tradeId:
        stat.trade.ids[
          type === ModifierType.AddedRune ? ModifierType.Rune : type
        ],
      statRef: stat.ref,
      text:
        roll?.option === roll?.value
          ? sources[0].stat.translation.string
          : translation.string,
      tag:
        type === ModifierType.Enchant ? FilterTag.Enchant : FilterTag.Variant,
      oils: decodeOils(calc),
      sources,
      option: {
        value: sources[0].contributes!.option!,
      },
      disabled: false,
    };
  }

  filter ??= {
    tradeId:
      stat.trade.ids[
        type === ModifierType.AddedRune ? ModifierType.Rune : type
      ],
    statRef: stat.ref,
    text: translation.string,
    tag: type as unknown as FilterTag,
    oils: decodeOils(calc),
    sources,
    roll: undefined,
    disabled,
  };

  if (type === ModifierType.Implicit) {
    if (sources.some((s) => s.modifier.info.generation === "eldritch")) {
      filter.tag = FilterTag.Eldritch;
    } else if (item.isSynthesised) {
      filter.tag = FilterTag.Synthesised;
    }
  } else if (type === ModifierType.Explicit) {
    if (item.info.unique?.fixedStats) {
      const fixedStats = item.info.unique.fixedStats;
      if (!fixedStats.includes(filter.statRef)) {
        filter.tag = FilterTag.Variant;
      }
    } else if (
      sources.some((s) =>
        CLIENT_STRINGS.DELVE_MODS.includes(s.modifier.info.name!),
      )
    ) {
      filter.tag = FilterTag.Delve;
    } else if (
      sources.some((s) =>
        CLIENT_STRINGS.VEILED_MODS.includes(s.modifier.info.name!),
      )
    ) {
      // can't drop from ground, so don't show
      // filter.tag = FilterTag.Unveiled
    } else if (
      sources.some((s) =>
        CLIENT_STRINGS.INCURSION_MODS.includes(s.modifier.info.name!),
      )
    ) {
      filter.tag = FilterTag.Incursion;
    }
  } else if (type === ModifierType.Enchant) {
    if (
      (item.isCorrupted &&
        sources.filter((s) => !s.stat.stat.ref.includes("Allocates")).length &&
        item.category !== ItemCategory.Map &&
        item.category !== ItemCategory.Waystone) ||
      sources.some((s) => s.modifier.info.generation === "corrupted")
    ) {
      filter.tag = FilterTag.Corrupted;
    }
  }

  if (roll && (!filter.option || roll.option !== roll.value)) {
    // Determine goodness first
    let goodness: number | undefined;
    if (calc.stat.better !== StatBetter.NotComparable) {
      if (roll.min === roll.max) {
        goodness = 1;
      } else {
        goodness = (roll.value - roll.min) / (roll.max - roll.min);
        if (calc.stat.better === StatBetter.NegativeRoll) {
          goodness = 1 - goodness;
        }
      }
    }

    if (
      (item.rarity === ItemRarity.Magic &&
        (item.isUnmodifiable || !itemIsModifiable(item))) ||
      stat.ref === "Has # Charm Slot"
    ) {
      percent = 0;
    } else if (
      item.rarity === ItemRarity.Unique ||
      (item.rarity === ItemRarity.Magic &&
        (item.category === ItemCategory.Jewel ||
          item.category === ItemCategory.Tablet)) ||
      calc.sources.some(
        ({ modifier }) =>
          modifier.info.tier === 1 &&
          modifier.info.type === ModifierType.Fractured,
      )
    ) {
      const perfectRoll =
        (calc.stat.better === StatBetter.PositiveRoll &&
          roll.value >= roll.max) ||
        (calc.stat.better === StatBetter.NegativeRoll &&
          roll.value <= roll.min);
      if (perfectRoll) {
        percent = 0;
      }
    }

    const dp =
      calc.stat.dp ||
      calc.sources.some(
        (s) => s.stat.stat.ref === calc.stat.ref && s.stat.roll!.dp,
      );

    const filterBounds = {
      min: percentRoll(roll.min, -0, Math.floor, dp),
      max: percentRoll(roll.max, +0, Math.ceil, dp),
    };

    const filterDefault =
      calc.stat.better === StatBetter.NotComparable
        ? { min: roll.value, max: roll.value }
        : item.rarity === ItemRarity.Unique
          ? {
              min: percentRollDelta(
                roll.value,
                roll.max - roll.min,
                -percent,
                Math.floor,
                dp,
              ),
              max: percentRollDelta(
                roll.value,
                roll.max - roll.min,
                +percent,
                Math.ceil,
                dp,
              ),
            }
          : {
              min: percentRoll(roll.value, -percent, Math.floor, dp),
              max: percentRoll(roll.value, +percent, Math.ceil, dp),
            };

    filterDefault.min = Math.max(filterDefault.min, filterBounds.min);
    filterDefault.max = Math.min(filterDefault.max, filterBounds.max);

    filter.roll = {
      value: roundRoll(roll.value, dp),
      min: undefined,
      max: undefined,
      default: filterDefault,
      bounds:
        item.rarity === ItemRarity.Unique &&
        roll.min !== roll.max &&
        calc.stat.better !== StatBetter.NotComparable
          ? filterBounds
          : undefined,
      dp,
      isNegated: false,
      tradeInvert: calc.stat.trade.inverted,
      goodness,
    };

    let usedBetter = calc.stat.better;
    if (
      stat.trade.ids.pseudo?.length === 1 &&
      stat.trade.ids.pseudo[0] === "item.reload_time"
    ) {
      usedBetter = StatBetter.NegativeRoll;
    }

    filterFillMinMax(filter.roll, usedBetter);

    if (translation.negate) {
      filterAdjustmentForNegate(filter.roll);
    }
  }

  hideNotVariableStat(filter, item);

  return filter;
}

function hideNotVariableStat(filter: StatFilter, item: ParsedItem) {
  if (item.rarity !== ItemRarity.Unique) return;
  if (filter.tag === FilterTag.Implicit && item.category === ItemCategory.Jewel)
    return;
  if (
    (filter.tag !== FilterTag.Implicit &&
      filter.tag !== FilterTag.Explicit &&
      filter.tag !== FilterTag.Pseudo) ||
    (filter.tag === FilterTag.Pseudo &&
      filter.sources.some((s) => s.modifier.info.type === ModifierType.Enchant))
  )
    return;

  if (!filter.roll) {
    filter.hidden = "filters.hide_const_roll";
  } else if (!filter.roll.bounds && item.rarity === ItemRarity.Unique) {
    filter.roll.min = undefined;
    filter.roll.max = undefined;
    filter.hidden = "filters.hide_const_roll";
  }
}

function filterFillMinMax(
  roll: NonNullable<StatFilter["roll"]>,
  better: StatBetter,
) {
  switch (better) {
    case StatBetter.PositiveRoll:
      roll.min = roll.default.min;
      break;
    case StatBetter.NegativeRoll:
      roll.max = roll.default.max;
      break;
    case StatBetter.NotComparable:
      roll.min = roll.default.min;
      roll.max = roll.default.max;
      break;
  }
}

function filterAdjustmentForNegate(roll: NonNullable<StatFilter["roll"]>) {
  roll.tradeInvert = !roll.tradeInvert;
  roll.isNegated = true;
  const swap = JSON.parse(JSON.stringify(roll)) as typeof roll;

  if (swap.bounds && roll.bounds) {
    roll.bounds.min = -1 * swap.bounds.max;
    roll.bounds.max = -1 * swap.bounds.min;
  }

  roll.default.min = -1 * swap.default.max;
  roll.default.max = -1 * swap.default.min;

  roll.value = -1 * swap.value;
  roll.min = typeof swap.max === "number" ? -1 * swap.max : undefined;
  roll.max = typeof swap.min === "number" ? -1 * swap.min : undefined;
}

export function finalFilterTweaks(ctx: FiltersCreationContext) {
  const { item } = ctx;

  if (
    item.category === ItemCategory.ClusterJewel &&
    item.rarity !== ItemRarity.Unique
  ) {
    applyClusterJewelRules(ctx.filters);
  } else if (item.category === ItemCategory.Flask) {
    applyFlaskRules(ctx.filters);
  }

  if (
    item.rarity === ItemRarity.Unique &&
    item.info.refName !== "Morior Invictus" &&
    item.info.refName !== "Darkness Enthroned"
  ) {
    hideAllRunes(ctx.filters);
  }

  const hasEmptyModifier = showHasEmptyModifier(ctx);
  if (hasEmptyModifier !== false) {
    const roll = hasEmptyModifier.counts[hasEmptyModifier.empty];
    ctx.filters.push({
      tradeId: ["item.has_empty_modifier"],
      text: "# Empty Modifier",
      statRef: "# Empty Modifier",
      disabled: true,
      hidden: "filters.hide_empty_mod",
      tag: FilterTag.Pseudo,
      sources: [],
      option: {
        value: hasEmptyModifier.empty,
      },
      additionalInfo: {
        emptyModifierInfo: hasEmptyModifier.counts,
      },
      roll: {
        value: roll,
        min: roll,
        max: undefined,
        default: { min: roll, max: roll },
        dp: false,
        isNegated: false,
      },
    });
  }

  if (
    item.category === ItemCategory.Amulet ||
    item.category === ItemCategory.Ring
  ) {
    applyAnointmentRules(ctx.filters, ctx.item);
  }

  for (const filter of ctx.filters) {
    if (
      filter.tag === FilterTag.Fractured ||
      filter.tag === FilterTag.Desecrated
    ) {
      const mod = ctx.item.statsByType.find(
        (mod) => mod.stat.ref === filter.statRef,
      )!;
      if (mod.stat.trade.ids[ModifierType.Explicit]) {
        // hide only if fractured or desecrated mod has corresponding explicit variant
        filter.hidden = "filters.hide_for_crafting";
      }
    } else if (filter.tag === FilterTag.Skill && filter.roll) {
      filter.disabled = filter.roll.value < 20;
      if (filter.disabled) {
        filter.hidden = "filters.hide_not_max_level";
      }
    }
    if (ctx.item.category === ItemCategory.Map) {
      if (
        filter.tag !== FilterTag.Property &&
        filter.tag !== FilterTag.Desecrated
      ) {
        filter.disabled = true;
        filter.hidden = "filters.hide_for_map";
      }
    }
  }

  if (
    item.rarity === ItemRarity.Magic &&
    itemIsModifiable(item) &&
    item.itemLevel &&
    maxUsefulItemLevel(item.category) - 3 > item.itemLevel
  ) {
    ctx.filters.push({
      tradeId: ["item.rarity_magic"],
      text: "Rarity: Magic",
      statRef: "Rarity: Magic",
      disabled: true,
      hidden: "filters.hide_low_ilvl",
      tag: FilterTag.Pseudo,
      sources: [],
    });
  }

  if (
    item.rarity === ItemRarity.Unique ||
    item.category === ItemCategory.Relic
  ) {
    const countVisible = ctx.filters.reduce(
      (cnt, filter) => (filter.hidden ? cnt : cnt + 1),
      0,
    );
    if (countVisible <= 3) {
      enableAllFilters(ctx.filters);
    }
  }
}

function applyClusterJewelRules(filters: StatFilter[]) {
  for (const filter of filters) {
    if (filter.statRef === "# Added Passive Skills are Jewel Sockets") {
      filter.hidden = "filters.hide_const_roll";
      filter.disabled = true;
    }

    // https://www.poewiki.net/wiki/Cluster_Jewel#Optimal_passive_skill_amounts
    if (filter.statRef === "Adds # Passive Skills") {
      filter.disabled = false;

      // 4 is [_, 5]
      if (filter.roll!.value === 4) {
        filter.roll!.max = 5;
        // 5 is [5, 5]
      } else if (filter.roll!.value === 5) {
        filter.roll!.min = filter.roll!.default.min;
        // 3, 6, 10, 11, 12 are [n, _]
      } else if (
        filter.roll!.value === 3 ||
        filter.roll!.value === 6 ||
        filter.roll!.value === 10 ||
        filter.roll!.value === 11 ||
        filter.roll!.value === 12
      ) {
        filter.roll!.min = filter.roll!.default.min;
        filter.roll!.max = undefined;
      }
      // else 2, 8, 9 are [_ , n]
    }
  }
}

function applyFlaskRules(filters: StatFilter[]) {
  const usedEnkindling = filters.find(
    (filter) => filter.statRef === "Gains no Charges during Flask Effect",
  );
  for (const filter of filters) {
    if (filter.tag === FilterTag.Enchant && !usedEnkindling) {
      filter.hidden = "hide_harvest_and_instilling";
      filter.disabled = true;
    }
  }
}

function hideAllRunes(filters: StatFilter[]) {
  for (const filter of filters) {
    if (filter.tag === FilterTag.Rune || filter.tag === FilterTag.AddedRune) {
      filter.hidden = "filters.hide_const_roll";
      filter.disabled = true;
    }
  }
}

// TODO
// +1 Prefix Modifier allowed
// -1 Suffix Modifier allowed
function showHasEmptyModifier(ctx: FiltersCreationContext):
  | {
      empty: ItemHasEmptyModifier;
      counts: Record<ItemHasEmptyModifier, number>;
    }
  | false {
  const { item } = ctx;

  if (!itemIsModifiable(item) || item.category === ItemCategory.Map) {
    return false;
  }

  if (item.rarity === ItemRarity.Magic) {
    const { prefixes: magicPrefixes, suffixes: magicSuffixes } =
      explicitModifierCount(item);
    if (magicPrefixes && magicSuffixes) {
      return false;
    }
    if (magicPrefixes > 0) {
      return {
        empty: ItemHasEmptyModifier.Suffix,
        counts: {
          [ItemHasEmptyModifier.Prefix]: 0,
          [ItemHasEmptyModifier.Suffix]: 1,
          [ItemHasEmptyModifier.Any]: 1,
        },
      };
    } else if (magicSuffixes > 0) {
      return {
        empty: ItemHasEmptyModifier.Prefix,
        counts: {
          [ItemHasEmptyModifier.Prefix]: 1,
          [ItemHasEmptyModifier.Suffix]: 0,
          [ItemHasEmptyModifier.Any]: 1,
        },
      };
    }
    // magic but has no explicit mods (annulled to 0)
    return false;
  }

  if (item.rarity !== ItemRarity.Rare) {
    return false;
  }

  const { prefixes, suffixes, total } = explicitModifierCount(item);
  const maxAmount = itemMaxModifiersBySlot(item);

  if (total !== maxAmount[ItemHasEmptyModifier.Any] && total !== 0) {
    const empty =
      suffixes === maxAmount[ItemHasEmptyModifier.Suffix]
        ? ItemHasEmptyModifier.Prefix
        : prefixes === maxAmount[ItemHasEmptyModifier.Prefix]
          ? ItemHasEmptyModifier.Suffix
          : ItemHasEmptyModifier.Any;

    const counts = {
      [ItemHasEmptyModifier.Any]: maxAmount[ItemHasEmptyModifier.Any] - total,
      [ItemHasEmptyModifier.Prefix]:
        maxAmount[ItemHasEmptyModifier.Prefix] - prefixes,
      [ItemHasEmptyModifier.Suffix]:
        maxAmount[ItemHasEmptyModifier.Suffix] - suffixes,
    };

    return {
      empty,
      counts,
    };
  }

  return false;
}

function enableAllFilters(filters: StatFilter[]) {
  for (const filter of filters) {
    if (!filter.hidden) {
      filter.disabled = false;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function enableGoodRolledFilters(filters: StatFilter[], abovePct: number) {
  for (const filter of filters) {
    if (filter.hidden) continue;
    if (!filter.roll || filter.roll.goodness == null) {
      filter.disabled = false;
      continue;
    }

    if (filter.roll.goodness >= abovePct) {
      filter.disabled = false;
    }
  }
}

function itemMaxModifiersBySlot(item: ParsedItem) {
  let base;
  switch (item.category) {
    case ItemCategory.Jewel:
    case ItemCategory.Tablet:
    case ItemCategory.Relic:
    case ItemCategory.SanctumRelic:
      base = 2;
      break;
    default:
      base = 3;
      break;
  }

  const maxAmount = [2 * base, base, base];
  // TODO: change this to be programmatic based on implicits
  if (
    item.info.refName === "Dusk Amulet" ||
    item.info.refName === "Dusk Ring"
  ) {
    maxAmount[ItemHasEmptyModifier.Prefix] += 1;
    maxAmount[ItemHasEmptyModifier.Suffix] -= 1;
  } else if (
    item.info.refName === "Gloam Amulet" ||
    item.info.refName === "Gloam Ring"
  ) {
    maxAmount[ItemHasEmptyModifier.Prefix] -= 1;
    maxAmount[ItemHasEmptyModifier.Suffix] += 1;
  } else if (
    item.info.refName === "Penumbra Amulet" ||
    item.info.refName === "Penumbra Ring"
  ) {
    maxAmount[ItemHasEmptyModifier.Prefix] += 2;
    maxAmount[ItemHasEmptyModifier.Suffix] -= 2;
  } else if (
    item.info.refName === "Tenebrous Amulet" ||
    item.info.refName === "Tenebrous Ring"
  ) {
    maxAmount[ItemHasEmptyModifier.Prefix] -= 2;
    maxAmount[ItemHasEmptyModifier.Suffix] += 2;
  }

  return maxAmount;
}
