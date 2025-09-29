import {
  ItemCategory,
  itemIsModifiable,
  ItemRarity,
  ParsedItem,
} from "@/parser";
import { ModifierType } from "@/parser/modifiers";

export function maxUsefulItemLevel(category: ItemCategory | undefined) {
  const itemLevelCaps: Partial<Record<ItemCategory, number>> = {
    [ItemCategory.Wand]: 81,
    [ItemCategory.Staff]: 81,
    [ItemCategory.Relic]: 80,
    [ItemCategory.Tablet]: 1,
    [ItemCategory.Jewel]: 1,
    [ItemCategory.Map]: 1,
  };

  const maxUsefulItemLevel = category ? (itemLevelCaps[category] ?? 82) : 82;
  return maxUsefulItemLevel;
}

export function likelyFinishedItem(item: ParsedItem) {
  return (
    item.rarity === ItemRarity.Unique ||
    item.statsByType.some((calc) => calc.type === ModifierType.Crafted) ||
    item.quality === 20 || // quality > 20 can be used for selling bases, quality < 20 drops sometimes
    !itemIsModifiable(item)
  );
}

export function hasCraftingValue(item: ParsedItem) {
  return (
    // Base useful crafting item (synth and influence not in poe2 yet though)
    item.isSynthesised ||
    item.isFractured ||
    item.influences.length ||
    // Clusters (deprecated)
    item.category === ItemCategory.ClusterJewel ||
    // Jewels
    (item.category === ItemCategory.Jewel &&
      item.rarity === ItemRarity.Magic) ||
    // High ilvl (minus 3 for now, since seems like we churn through items an stock is low)
    item.itemLevel! >= maxUsefulItemLevel(item.category) - 3 ||
    // is exceptional item
    (item.runeSockets && item.runeSockets.current > item.runeSockets.normal) ||
    (item.quality && item.quality > 20)
  );
}

export function explicitModifierCount(item: ParsedItem) {
  const randomMods = item.newMods.filter(
    (mod) =>
      mod.info.type === ModifierType.Explicit ||
      mod.info.type === ModifierType.Fractured ||
      mod.info.type === ModifierType.Veiled ||
      mod.info.type === ModifierType.Desecrated,
  );
  if (randomMods.length === 0) {
    return { prefixes: 0, suffixes: 0, total: 0 };
  }

  const prefixes = randomMods.filter(
    (mod) => mod.info.generation === "prefix",
  ).length;
  const suffixes = randomMods.filter(
    (mod) => mod.info.generation === "suffix",
  ).length;

  return {
    prefixes,
    suffixes,
    total: prefixes + suffixes,
  };
}
