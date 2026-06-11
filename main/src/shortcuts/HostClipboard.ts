import { clipboard, Clipboard } from "electron";
import type { Logger } from "../RemoteLogger";

const POLL_DELAY = 48;
const POLL_LIMIT = 500;

// PoE must read clipboard within this timeframe,
// after that we restore clipboard.
// If game lagged for some reason, it will read
// wrong content (= restored clipboard, potentially containing password).
const RESTORE_AFTER = 120;

export class HostClipboard {
  private pollPromise?: Promise<string>;
  private elapsed = 0;
  private shouldRestore = false;
  private initialDelay = POLL_DELAY;

  private isRestored = true;

  get isPolling() {
    return this.pollPromise != null;
  }

  constructor(private logger: Logger) {}

  updateOptions(restoreClipboard: boolean) {
    this.shouldRestore = restoreClipboard;
  }

  async readItemText(): Promise<string> {
    this.elapsed = 0;
    if (this.pollPromise) {
      return await this.pollPromise;
    }

    let textBefore = clipboard.readText();
    if (isPoeItem(textBefore)) {
      textBefore = "";
      clipboard.writeText("");
    }

    this.pollPromise = new Promise((resolve, reject) => {
      const poll = () => {
        const textAfter = clipboard.readText();

        if (isPoeItem(textAfter)) {
          if (this.shouldRestore) {
            clipboard.writeText(textBefore);
          }
          this.pollPromise = undefined;
          resolve(textAfter);
        } else {
          this.elapsed += POLL_DELAY;
          if (this.elapsed < POLL_LIMIT) {
            setTimeout(poll, POLL_DELAY);
          } else {
            if (this.shouldRestore) {
              clipboard.writeText(textBefore);
            }
            this.pollPromise = undefined;

            if (!isPoeItem(textAfter)) {
              this.logger.write("warn [ClipboardPoller] No item text found.");
            }
            reject(new Error("Reading clipboard timed out"));
          }
        }
      };
      setTimeout(poll, this.initialDelay);
    });

    return await this.pollPromise;
  }

  // when `shouldRestore` is false, this function continues
  // to work as a throttler for callback
  restoreShortly(cb: (clipboard: Clipboard) => void) {
    // Not only do we not overwrite the clipboard, but we don't exec callback.
    // This throttling helps against disconnects from "Too many actions".
    if (!this.isRestored) {
      return;
    }

    this.isRestored = false;
    const saved = clipboard.readText();
    cb(clipboard);
    setTimeout(() => {
      if (this.shouldRestore) {
        clipboard.writeText(saved);
      }
      this.isRestored = true;
    }, RESTORE_AFTER);
  }

  updateDelay(delay: number) {
    this.initialDelay = delay;
  }
}

function isPoeItem(text: string) {
  return LANGUAGE_DETECTOR.find(
    ({ firstLine, uncutSkillGemLine }) =>
      text.startsWith(firstLine) || text.startsWith(uncutSkillGemLine),
  );
}

const LANGUAGE_DETECTOR = [
  {
    lang: "en",
    firstLine: "Item Class: ",
    uncutSkillGemLine: "Rarity: ",
  },
  {
    lang: "ru",
    firstLine: "Класс предмета: ",
    uncutSkillGemLine: "Редкость: ",
  },
  {
    lang: "fr",
    firstLine: "Classe d'objet: ",
    uncutSkillGemLine: "Rareté: ",
  },
  {
    lang: "de",
    firstLine: "Gegenstandsklasse: ",
    uncutSkillGemLine: "Seltenheit: ",
  },
  {
    lang: "pt",
    firstLine: "Classe do Item: ",
    uncutSkillGemLine: "Raridade: ",
  },
  {
    lang: "es",
    firstLine: "Clase de objeto: ",
    uncutSkillGemLine: "Rareza: ",
  },
  {
    lang: "th",
    firstLine: "ชนิดไอเทม: ",
    uncutSkillGemLine: "Rarity: ",
  },
  {
    lang: "ko",
    firstLine: "아이템 종류: ",
    uncutSkillGemLine: "아이템 희귀도: ",
  },
  {
    lang: "cmn-Hant",
    firstLine: "物品種類: ",
    uncutSkillGemLine: "稀有度: ",
  },
  {
    lang: "cmn-Hans",
    firstLine: "物品类别: ",
    uncutSkillGemLine: "Rarity: ",
  },
  {
    lang: "ja",
    firstLine: "アイテムクラス: ",
    uncutSkillGemLine: "レアリティ: ",
  },
];
