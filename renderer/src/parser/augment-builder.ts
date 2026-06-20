import { AugmentLineData, BaseType } from "@/assets/data";
import { ItemCategory } from "./meta";
import { replaceHashWithValues } from "./Parser";
import { EditorItem } from "./ParsedItem";

export function selectAugmentEffectByItemCategory(
  category: ItemCategory,
  rune: BaseType["augment"],
) {
  if (!rune) return;

  return rune.find((rune) => rune.categories.includes(category));
}

export function buildEditorItems(
  augments: BaseType[],
  category: ItemCategory,
  existing?: true,
) {
  return augments
    .map((augment) => {
      const effect = selectAugmentEffectByItemCategory(
        category,
        augment.augment,
      );
      if (!effect) return undefined;
      return buildEditorItem(augment, effect, existing);
    })
    .filter((augment) => augment !== undefined);
}

function buildEditorItem(
  augment: BaseType,
  stat: AugmentLineData,
  existing?: true,
): EditorItem {
  return {
    existing,
    name: augment.name,
    refName: augment.refName,
    icon: augment.icon,
    displayString: replaceHashWithValues(stat.string, stat.values),
    stat,
    baseItem: augment,
  };
}
