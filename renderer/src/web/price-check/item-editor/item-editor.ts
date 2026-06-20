import { ItemRarity, ParsedItem } from "@/parser";
import { ARMOUR, ItemCategory, ItemEditorType, WEAPON } from "@/parser/meta";

export function getItemEditorType(item: ParsedItem): ItemEditorType {
  if (!item.category) return ItemEditorType.None;

  // TODO: add uniques where this should be allowed here
  // should probably have a set and check it, so we can not hide the augments

  if (item.rarity === ItemRarity.Unique) return ItemEditorType.None;

  // TODO: add special cases here

  if (
    item.category === ItemCategory.Ring ||
    item.category === ItemCategory.Amulet
  ) {
    return ItemEditorType.Catalyst;
  } else if (WEAPON.has(item.category) || ARMOUR.has(item.category)) {
    return ItemEditorType.Augment;
  } else {
    return ItemEditorType.None;
  }
}
