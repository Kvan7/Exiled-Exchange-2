import { AugmentLineData, BaseType } from "@/assets/data";
import { ItemCategory } from "./meta";
import { replaceHashWithValues } from "./Parser";
import { EditorItem } from "./ParsedItem";

export function selectAugmentEffectByItemCategory(
  category: ItemCategory,
  rune: BaseType["augment"],
) {
  if (!rune) return;

  return rune.filter((rune) => rune.categories.includes(category));
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
      if (!effect || !effect.length) return undefined;
      return buildEditorItem(augment, effect, existing);
    })
    .filter((augment) => augment !== undefined);
}

function zipHashAndValues(strings?: string[], values?: number[][]): string {
  if (!strings || !values) return "";

  // if each value array is not the same, return empty
  if (
    !values.every(
      (v) =>
        v.length === values[0].length && v.every((v, i) => v === values[0][i]),
    )
  )
    return "";

  const valueGenerator = values[0].values();

  const outString = strings
    .map((str) => {
      const replaceCount = str.match(/#/g)?.length ?? 0;
      const valuesToAdd = [];
      for (let i = 0; i < replaceCount; i++) {
        valuesToAdd.push(valueGenerator.next().value ?? 0);
      }
      return replaceHashWithValues(str, valuesToAdd);
    })
    .join("\n");

  return outString;
}

function buildEditorItem(
  augment: BaseType,
  stats: AugmentLineData[],
  existing?: true,
): EditorItem {
  return {
    existing,
    name: augment.name,
    refName: augment.refName,
    icon: augment.icon,
    displayString: zipHashAndValues(
      stats?.map((s) => s.string),
      stats?.map((s) => s.values),
    ),
    stats,
    baseItem: augment,
  };
}
