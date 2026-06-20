import { AugmentGroup, AugmentLineData, BaseType } from "@/assets/data";
import { ItemCategory } from "@/parser";
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

function filterByCategory(augments: BaseType[], category: ItemCategory) {
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
      Lesser: filterByCategory(augments.Rune.Lesser, category),
      Normal: filterByCategory(augments.Rune.Normal, category),
      Greater: filterByCategory(augments.Rune.Greater, category),
      Perfect: filterByCategory(augments.Rune.Perfect, category),
      Other: filterByCategory(augments.Rune.Other, category),
    },
    SoulCore: {
      Normal: filterByCategory(augments.SoulCore.Normal, category),
      Special: filterByCategory(augments.SoulCore.Special, category),
    },
    Idol: filterByCategory(augments.Idol, category),
    Legacy: filterByCategory(augments.Legacy, category),
    Other: filterByCategory(augments.Other, category),
  };
}
