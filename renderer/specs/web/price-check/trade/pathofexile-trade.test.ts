import { beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { init } from "@/assets/data";
import { __testExports } from "@/web/price-check/trade/pathofexile-trade";
import { setupTests } from "@specs/vitest.setup";

function getFetchResult(idPrefix: string) {
  const filePath = path.resolve(__dirname, "../../../docs/fetchResponses.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return data.result.find((result: { id: string }) =>
    result.id.startsWith(idPrefix),
  );
}

describe("pathofexile-trade tooltip parsing", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  it("preserves affix tiers for listing tooltip modifiers", () => {
    const displayItem = __testExports.parseFetchResult(
      getFetchResult("65c7c4e8"),
    );

    expect(displayItem.explicitMods?.map((mod) => mod.affixTier)).toEqual([
      "P2",
      "S3",
    ]);
  });

  it("reuses the same affix tier for hybrid modifier lines", () => {
    const displayItem = __testExports.parseFetchResult(
      getFetchResult("ece06af2"),
    );

    expect(displayItem.explicitMods?.map((mod) => mod.affixTier)).toEqual([
      "P7",
      "P7",
      "P5",
      "S5",
      "S6",
    ]);
  });
});
