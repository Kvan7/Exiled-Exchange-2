import { __testExports } from "@/web/background/Prices";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { loadForLang } from "@/assets/data";

describe("useTradeApi", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
    vi.clearAllMocks();
  });

  it("parseXchg", () => {
    const blob =
      '{"core":{"rates":{"exalted":2312,"chaos":76.2},"primary":"divine","secondary":"chaos"},"itemOverviews":[{"type":"Currency","lines":[{"name":"Orb of Alchemy","detailsId":"orb-of-alchemy","id":"alch","primaryValue":0.00003575,"volumePrimaryValue":0.4008,"maxVolumeCurrency":"exalted",';
    const expected = {
      rates: {
        exalted: 2312,
        chaos: 76.2,
      },
      primary: "divine",
      secondary: "chaos",
    };
    const result = __testExports.parseXchg(blob);

    expect(result).toEqual(expected);
  });

  it("splitJsonBlob", () => {
    const blob =
      'chaos"},"itemOverviews":[{"type":"Currency","lines":[{"name":"Orb of Alchemy","detailsId":"orb-of-alchemy","id":"alch","primaryValue":0.00003575,"volumePrimaryValue":0.4008,"maxVolumeCurrency":"exalted","maxVolumeRate":12.05,"sparkline":{"totalChange":-40.89,"data":[-9.56,-69.14,-70.07,-20.05,-14.13,18.75,-40.89]}},{"name":"Exalted Orb","detailsId":"exalted-orb","id":"exalted","primaryValue":0.0004308,"volumePrimaryValue":449.7,"maxVolumeCurrency":"divine","maxVolumeRate":2321,"sparkline":{"totalChange":-20.32,"data":[-5.22,-15.82,-13.6,-15.2,-15.99,-21.78,-20.32]}}]}]';

    const result = __testExports.splitJsonBlob(blob);
    expect(result).toHaveLength(1);
  });
});
