import { BaseType, CATALYST_TO_TAG } from "@/assets/data";
import { ItemRarity, ParsedItem } from "@/parser";
import { recalculateItemProperties } from "@/parser/calc-base";
import { ARMOUR, ItemCategory, ItemEditorType, WEAPON } from "@/parser/meta";
import { sumStatsByModType } from "@/parser/modifiers";

export function getItemEditorType(item: ParsedItem): ItemEditorType {
  if (!item.category) return ItemEditorType.None;

  // TODO: add uniques where this should be allowed here
  // should probably have a set and check it, so we can not hide the augments

  if (item.rarity === ItemRarity.Unique) return ItemEditorType.None;

  // TODO: add special cases here

  if (
    item.category === ItemCategory.Ring ||
    item.category === ItemCategory.Amulet ||
    item.category === ItemCategory.Jewel
  ) {
    return ItemEditorType.Catalyst;
  } else if (WEAPON.has(item.category) || ARMOUR.has(item.category)) {
    return ItemEditorType.Augment;
  } else {
    return ItemEditorType.None;
  }
}

export function applyCatalyst(
  item: ParsedItem,
  catalyst: BaseType,
  quality: number,
) {
  // deep copy
  const oldItem = JSON.parse(JSON.stringify(item)) as ParsedItem;

  // remove old catalyst increases
  if (item.qualityType) {
    if (!item.qualityType.endsWith("_catalyst")) {
      throw new Error("Invalid quality type");
    }
    const oldQuality = item.quality ?? 0;
    const oldTag = new Set(CATALYST_TO_TAG[item.qualityType]);
    for (const mod of item.newMods) {
      if (mod.info.tags.some((tag) => oldTag.has(tag))) {
        if (mod.info.rollIncr) {
          mod.info.rollIncr -= oldQuality;
        } else {
          // probably?
          mod.info.rollIncr = -oldQuality;
        }
        mod.info.addedIncr = undefined;
      }
    }
  }

  // add new catalyst
  item.quality = quality;
  item.qualityType = catalyst.tags[1];

  const translatedTags = CATALYST_TO_TAG[catalyst.tags[1]];

  for (const tag of translatedTags) {
    for (const mod of item.newMods) {
      if (mod.info.tags.includes(tag)) {
        if (mod.info.rollIncr) {
          mod.info.rollIncr += quality;
        } else {
          mod.info.rollIncr = quality;
        }
        mod.info.addedIncr = true;
      }
    }
  }

  item.statsByType = sumStatsByModType(item.newMods);
  recalculateItemProperties(item, oldItem);
}

export enum AugmentSaveType {
  Class = "class",
  CasterWeapon = "casterWeapon",
  MaritalWeapon = "maritalWeapon",
  Sceptre = "spectre",
  Armour = "armour",
  All = "all",
}
