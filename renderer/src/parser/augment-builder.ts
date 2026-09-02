import { AugmentLineData, BaseType, ITEM_BY_REF } from "@/assets/data";
import { ARMOUR, ItemCategory, MARTIAL_WEAPON } from "./meta";
import { replaceHashWithValues } from "./Parser";
import { EditorItem, ParsedItem } from "./ParsedItem";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import { AppConfig } from "@/web/Config";

export function selectAugmentEffectByItemCategory(
  category: ItemCategory,
  rune: BaseType["augment"],
): AugmentLineData[] | undefined {
  if (!rune) return;

  return rune.filter((rune) => rune.categories.includes(category));
}

export function buildEditorItems(
  augments: BaseType[],
  category: ItemCategory,
  existing?: true,
): EditorItem[] {
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
  if (!strings || !values) return "ns(shouldn't see this)";

  // if each value array is not the same, return empty
  if (
    !values.every(
      (v) =>
        v.length === values[0].length && v.every((v, i) => v === values[0][i]),
    )
  )
    return "ve(shouldn't see this)";

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

export function getSavedAugments(item: ParsedItem): Array<BaseType | null> {
  if (!item.augmentSockets) return [];
  const lookup = AppConfig<PriceCheckWidget>("price-check")!.savedAugments;

  let refNames: Array<string | null> = [];
  if (item.category && lookup[item.category]?.length) {
    refNames = lookup[item.category]!;
  } else if (
    item.category &&
    MARTIAL_WEAPON.has(item.category) &&
    lookup.martialWeapon?.length
  ) {
    refNames = lookup.martialWeapon;
  } else if (
    (item.category === ItemCategory.Wand ||
      item.category === ItemCategory.Staff) &&
    lookup.casterWeapon?.length
  ) {
    refNames = lookup.casterWeapon;
  } else if (item.category === ItemCategory.Sceptre && lookup.spectre?.length) {
    refNames = lookup.spectre;
  } else if (
    item.category &&
    ARMOUR.has(item.category) &&
    lookup.armour?.length
  ) {
    refNames = lookup.armour;
  } else if (lookup.all?.length) {
    refNames = lookup.all;
  }

  const bases = refNames.map((refName) => {
    if (!refName) return null;
    return ITEM_BY_REF("ITEM", refName)?.at(0) ?? null;
  });

  return bases;
}
