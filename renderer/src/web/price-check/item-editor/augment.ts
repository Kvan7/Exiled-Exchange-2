import { AugmentGroup, AugmentLineData, BaseType } from "@/assets/data";
import { ItemCategory, ParsedItem } from "@/parser";
import { INTERNAL_AUGMENT_TYPES } from "@/parser/modifiers";
import { replaceHashWithValues } from "@/parser/Parser";

export interface EditorItem {
  name: string;
  refName: string;
  icon: string;
  displayString: string;
  stat: AugmentLineData;
  baseItem: BaseType;
}

export function selectAugmentEffectByItemCategory(
  category: ItemCategory,
  rune: BaseType["augment"],
) {
  if (!rune) return;

  return rune.find((rune) => rune.categories.includes(category));
}

export function buildEditorItems(augments: BaseType[], category: ItemCategory) {
  return augments
    .map((augment) => {
      const effect = selectAugmentEffectByItemCategory(
        category,
        augment.augment,
      );
      if (!effect) return undefined;
      return buildEditorItem(augment, effect);
    })
    .filter((augment) => augment !== undefined);
}

function buildEditorItem(augment: BaseType, stat: AugmentLineData): EditorItem {
  return {
    name: augment.name,
    refName: augment.refName,
    icon: augment.icon,
    displayString: replaceHashWithValues(stat.string, stat.values),
    stat,
    baseItem: augment,
  };
}

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

  // remove old augment stats from item

  item.statsByType = item.statsByType.filter(
    (stat) => !INTERNAL_AUGMENT_TYPES.has(stat.type),
  );
  item.newMods = item.newMods.filter(
    (mod) => !INTERNAL_AUGMENT_TYPES.has(mod.info.type),
  );

  // add augment
  item.augmentSockets.augments[index] = augment.baseItem;
  // add augment stat to item
}
