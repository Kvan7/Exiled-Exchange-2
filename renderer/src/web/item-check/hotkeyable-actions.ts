import { Host } from "@/web/background/IPC";
import { AppConfig } from "@/web/Config";
import { ItemRarity, ParsedItem, parseClipboard } from "@/parser";
import { ItemCheckWidget } from "./widget";
import { ARMOUR, ItemCategory } from "@/parser/meta";

const POEDB_LANGS = {
  "en": "us",
  "ru": "ru",
  "cmn-Hant": "tw",
  "ko": "kr",
  "ja": "jp",
  "de": "de",
  "es": "sp",
  "pt": "pt",
};

const POE2DB_CONVERSIONS = new Map([
  // One handed
  [ItemCategory.Claw, "Claws"],
  [ItemCategory.Dagger, "Daggers"],
  [ItemCategory.Wand, "Wands"],
  [ItemCategory.OneHandedSword, "One_Hand_Swords"],
  [ItemCategory.OneHandedAxe, "One_Hand_Axes"],
  [ItemCategory.OneHandedMace, "One_Hand_Maces"],
  [ItemCategory.Sceptre, "Sceptres"],
  [ItemCategory.Spear, "Spears"],
  [ItemCategory.Flail, "Flails"],
  // Two handed
  [ItemCategory.Bow, "Bows"],
  [ItemCategory.Staff, "Staves"],
  [ItemCategory.TwoHandedSword, "Two_Hand_Swords"],
  [ItemCategory.TwoHandedAxe, "Two_Hand_Axes"],
  [ItemCategory.TwoHandedMace, "Two_Hand_Maces"],
  [ItemCategory.Warstaff, "Quarterstaves"],
  [ItemCategory.Crossbow, "Crossbows"],
  // Jewelery
  [ItemCategory.Amulet, "Amulets"],
  [ItemCategory.Ring, "Rings"],
  [ItemCategory.Belt, "Belts"],
  // Armours
  [ItemCategory.BodyArmour, "Body_Armours"],
  [ItemCategory.Helmet, "Helmets"],
  [ItemCategory.Gloves, "Gloves"],
  [ItemCategory.Boots, "Boots"],
  // offhand
  [ItemCategory.Quiver, "Quivers"],
  [ItemCategory.Shield, "Shields"],
  [ItemCategory.Focus, "Foci"],
  [ItemCategory.Buckler, "Bucklers"],
  // Jewels
  ["Ruby", "Ruby"],
  ["Emerald", "Emerald"],
  ["Sapphire", "Sapphire"],
  ["Time-Lost Ruby", "Time-Lost_Ruby"],
  ["Time-Lost Emerald", "Time-Lost_Emerald"],
  ["Time-Lost Sapphire", "Time-Lost_Sapphire"],
  // Flasks
  ["Life Flask", "Life_Flasks"],
  ["Mana Flask", "Mana_Flasks"],
  ["Charm", "Charms"],
  // Relics
  ["Urn Relic", "Urn_Relic"],
  ["Amphora Relic", "Amphora_Relic"],
  ["Vase Relic", "Vase_Relic"],
  ["Seal Relic", "Seal_Relic"],
  ["Coffer Relic", "Coffer_Relic"],
  ["Tapestry Relic", "Tapestry_Relic"],
  ["Incense Relic", "Incense_Relic"],
  // Tablet
  ["Breach Precursor Tablet", "Breach_Precursor_Tablet"],
  ["Expedition Precursor Tablet", "Expedition_Precursor_Tablet"],
  ["Delirium Precursor Tablet", "Delirium_Precursor_Tablet"],
  ["Ritual Precursor Tablet", "Ritual_Precursor_Tablet"],
  ["Precursor Tablet", "Precursor_Tablet"],
  ["Overseer Precursor Tablet", "Overseer_Precursor_Tablet"],
  // Waystones
  ["Waystones(Low)", "Waystones_low_tier"],
  ["Waystones(Mid)", "Waystones_mid_tier"],
  ["Waystones(Top)", "Waystones_top_tier"],
]);

export function registerActions() {
  Host.onEvent("MAIN->CLIENT::item-text", (e) => {
    if (
      ![
        "open-wiki",
        "open-craft-of-exile",
        "open-poedb",
        "search-similar",
        "search-same-priced",
      ].includes(e.target)
    ) {
      return;
    }
    const parsed = parseClipboard(e.clipboard);
    if (!parsed.isOk()) return;

    if (e.target === "open-wiki") {
      openWiki(parsed.value);
    } else if (e.target === "open-craft-of-exile") {
      openCoE(parsed.value);
    } else if (e.target === "open-poedb") {
      openPoedb(parsed.value);
    } else if (e.target === "search-similar") {
      findSimilarItems(parsed.value);
    } else if (e.target === "search-same-priced") {
      findSamePricedItems(parsed.value);
    }
  });
}

export function openWiki(item: ParsedItem) {
  window.open(`https://www.poe2wiki.net/wiki/${item.info.refName}`);
}
export function openPoedb(item: ParsedItem) {
  const path = getPoe2dbPath(item);
  window.open(`https://poe2db.tw/${POEDB_LANGS[AppConfig().language]}/${path}`);
}
export function openCoE(item: ParsedItem) {
  const encodedClipboard = encodeURIComponent(item.rawText);
  window.open(
    `https://craftofexile.com/?game=poe2&eimport=${encodedClipboard}`,
  );
}

export function findSimilarItems(item: ParsedItem) {
  const text = JSON.stringify(item.info.name);
  Host.sendEvent({
    name: "CLIENT->MAIN::user-action",
    payload: { action: "stash-search", text },
  });
}

export function findSamePricedItems(item: ParsedItem) {
  if (!item.note) return;
  const note = item.note ? JSON.stringify(item.note) : "";
  const name = JSON.stringify(item.info.name);
  const useName =
    AppConfig<ItemCheckWidget>("item-check")!.samePricedType === "both";

  const text =
    useName && note.length + name.length < 51 ? `${note}${name}` : note;

  Host.sendEvent({
    name: "CLIENT->MAIN::user-action",
    payload: { action: "stash-search", text },
  });
}

function getPoe2dbPath(item: ParsedItem) {
  const category = item.category;
  const refName = item.info.refName;
  if (!category) return;

  if (item.rarity === ItemRarity.Unique) {
    return `search?q=${refName}`;
  }

  if (POE2DB_CONVERSIONS.has(refName)) {
    return POE2DB_CONVERSIONS.get(refName)! + "#ModifiersCalc";
  }
  if (!POE2DB_CONVERSIONS.has(category)) {
    return `search?q=${refName}`;
  }

  let path = POE2DB_CONVERSIONS.get(category)!;
  if (
    ARMOUR.has(category) &&
    !(category === ItemCategory.Buckler || category === ItemCategory.Focus)
  ) {
    if (item.armourAR) {
      path += "_str";
    }
    if (item.armourEV) {
      path += "_dex";
    }
    if (item.armourES) {
      path += "_int";
    }
  }

  return path + "#ModifiersCalc";
}
