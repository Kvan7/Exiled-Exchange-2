import { NinjaSchema } from "@/web/background/Prices";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";

const SAMPLE_BLOB = JSON.stringify({
  core: {
    rates: { exalted: 2312, chaos: 76.2 },
    primary: "divine",
    secondary: "chaos",
  },
  itemOverviews: [
    {
      type: "Currency",
      lines: [
        {
          name: "Orb of Alchemy",
          detailsId: "orb-of-alchemy",
          id: "alch",
          primaryValue: 0.00003575,
          volumePrimaryValue: 0.4008,
          maxVolumeCurrency: "exalted",
          maxVolumeRate: 12.05,
          sparkline: { totalChange: -40.89, data: [-9.56, -40.89] },
        },
        {
          name: "Vaal Orb",
          variant: "Corrupted",
          detailsId: "vaal-orb-corrupted",
          id: "vaal",
          primaryValue: 1.5,
          volumePrimaryValue: 100,
          maxVolumeCurrency: "chaos",
          maxVolumeRate: 5,
          sparkline: { totalChange: 2.1, data: [1.0, 2.1] },
        },
      ],
    },
  ],
});

const SAMPLE_SCHEMA: NinjaSchema = {
  schemaVersion: 1,
  map: [{ ns: "ITEM", cx: true, url: "currency", type: "Currency" }],
};

describe("price data parsing", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
    vi.clearAllMocks();
  });

  it("parses the overview blob as valid JSON", () => {
    const blob = JSON.parse(SAMPLE_BLOB);
    expect(blob.core.rates.exalted).toBe(2312);
    expect(blob.core.rates.chaos).toBe(76.2);
    expect(blob.itemOverviews).toHaveLength(1);
    expect(blob.itemOverviews[0].type).toBe("Currency");
    expect(blob.itemOverviews[0].lines).toHaveLength(2);
  });

  it("builds a price index from blob + schema", () => {
    const blob = JSON.parse(SAMPLE_BLOB);
    const index = new Map<
      string,
      {
        entry: (typeof blob.itemOverviews)[0]["lines"][0];
        cx: boolean;
        url: string;
      }
    >();
    for (const section of blob.itemOverviews) {
      const mapping = SAMPLE_SCHEMA.map.find((m) => m.type === section.type);
      if (!mapping) continue;
      for (const item of section.lines) {
        const key = `${mapping.ns}:${item.name}:${(item as { variant?: string }).variant ?? ""}`;
        index.set(key, { entry: item, cx: mapping.cx, url: mapping.url });
      }
    }
    expect(index.size).toBe(2);
    expect(index.has("ITEM:Orb of Alchemy:")).toBe(true);
    expect(index.has("ITEM:Vaal Orb:Corrupted")).toBe(true);
    expect(index.get("ITEM:Orb of Alchemy:")!.entry.primaryValue).toBe(
      0.00003575,
    );
    expect(index.get("ITEM:Vaal Orb:Corrupted")!.entry.primaryValue).toBe(1.5);
  });
});
