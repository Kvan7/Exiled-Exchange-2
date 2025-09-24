import { Host } from "@/web/background/IPC";
import { AppConfig } from "@/web/Config";
import { ParsedItem, parseClipboard } from "@/parser";
import { ItemCheckWidget } from "./widget";

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
  window.open(
    `https://poe2db.tw/${POEDB_LANGS[AppConfig().language]}/search?q=${item.info.refName}`,
  );
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
  const note = JSON.stringify(item.note);
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
