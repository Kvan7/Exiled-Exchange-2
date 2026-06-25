import { AugmentGroup, BaseType } from "@/assets/data";
import { ItemCategory, ParsedItem } from "@/parser";
import { buildEditorItems } from "@/parser/augment-builder";
import {
  INTERNAL_AUGMENT_TYPES,
  ModifierType,
  sumStatsByModType,
} from "@/parser/modifiers";
import { EditorItem } from "@/parser/ParsedItem";
import { parseStatsFromMod } from "@/parser/Parser";
import { recalculateItemProperties } from "@/parser/calc-base";

export function getCategoryGroups(
  augments: AugmentGroup<BaseType>,
  category: ItemCategory,
): AugmentGroup<EditorItem> {
  return {
    Rune: {
      Lesser: buildEditorItems(augments.Rune.Lesser, category),
      Normal: buildEditorItems(augments.Rune.Normal, category),
      Greater: buildEditorItems(augments.Rune.Greater, category),
      Perfect: buildEditorItems(augments.Rune.Perfect, category),
      Other: buildEditorItems(augments.Rune.Other, category),
    },
    SoulCore: {
      Normal: buildEditorItems(augments.SoulCore.Normal, category),
      Special: buildEditorItems(augments.SoulCore.Special, category),
    },
    Idol: buildEditorItems(augments.Idol, category),
    Legacy: buildEditorItems(augments.Legacy, category),
    Other: buildEditorItems(augments.Other, category),
  };
}

export function useAugment(
  item: ParsedItem,
  augment: EditorItem,
  index: number,
) {
  if (!item.augmentSockets || item.augmentSockets.augments.length < index) {
    throw new Error("Augment index out of bounds");
  }

  // deep copy
  const oldItem = JSON.parse(JSON.stringify(item)) as ParsedItem;

  // remove old augment stats from item
  item.newMods = item.newMods.filter(
    (mod) => !INTERNAL_AUGMENT_TYPES.has(mod.info.type),
  );
  item.statsByType = item.statsByType.filter(
    (stat) => !INTERNAL_AUGMENT_TYPES.has(stat.type),
  );

  // add augment
  item.augmentSockets!.augments[index] = augment;
  // add augment stat to item
  for (const thisAugment of item.augmentSockets!.augments) {
    if (!thisAugment) continue;
    const modInfo = {
      // need to keep pre-existing ones marked as non-added
      type: thisAugment.existing
        ? ModifierType.Augment
        : ModifierType.AddedAugment,
      tags: [],
    };
    parseStatsFromMod(
      thisAugment.displayString.split("\n"),
      item,
      {
        info: modInfo,
        stats: [],
      },
      thisAugment.existing ? undefined : thisAugment.baseItem,
    );
  }
  item.statsByType = sumStatsByModType(item.newMods);

  // augment now added to item, yay
  // need to fix the filters now

  recalculateItemProperties(item, oldItem);
}
