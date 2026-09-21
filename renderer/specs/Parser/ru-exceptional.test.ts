import { init } from "@/assets/data";
import { parseClipboard } from "@/parser/Parser";
import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";

// Exact item text from
// https://github.com/Kvan7/Exiled-Exchange-2/issues/1033 — the Russian game
// client conjugates the "Exceptional" prefix to the gender of the base name
// ("Образцовый" + "Золочёный доспех"), while the RU regex only matched the
// neuter form "Образцовое".
const RU_EXCEPTIONAL_ITEM = [
  "Класс предмета: Нательные доспехи",
  "Редкость: Обычный",
  "Образцовый Золочёный доспех",
  "--------",
  "Броня: 261",
  "Уклонение: 237",
  "--------",
  "Требуется: Уровень 62, 54 (unmet) Сила, 54 (unmet) Ловк",
  "--------",
  "Гнезда: S S S ",
  "--------",
  "Уровень предмета: 80",
].join("\n");

describe("RU Exceptional normal item (issue #1033)", () => {
  beforeEach(async () => {
    setupTests();
    await init("ru");
  });

  it("resolves a masculine-prefix Exceptional RU normal item", () => {
    const refName = parseClipboard(RU_EXCEPTIONAL_ITEM).match(
      (item) => item.info.refName,
      (e) => {
        throw new Error(`expected item to parse, got parse error: ${e}`);
      },
    );
    // Language-independent: EN reference name from the trade database.
    expect(refName).toBe("Golden Mail");
  });
});
