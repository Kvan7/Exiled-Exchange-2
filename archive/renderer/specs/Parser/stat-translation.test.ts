import { ModifierType } from "@/parser/modifiers";
import { __testExports } from "@/parser/stat-translations";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as data from "@/assets/data";

vi.mock("@/assets/data", async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    init: vi.fn(),
    CLIENT_STRINGS: {},
    STAT_BY_MATCH_STR: vi.fn(),
    TRADE_STAT_BY_MATCH_STR: vi.fn(),
    StatBetter: { PositiveRoll: 1 },
  };
});

const PHYS_DAMAGE_STAT = {
  ref: "#% increased Physical Damage",
  better: 1,
  matchers: [
    { string: "#% increased Physical Damage" },
    { string: "#% reduced Physical Damage", negate: true },
    { string: "No Physical Damage", value: -100 },
  ],
  trade: {
    ids: {
      explicit: ["explicit.stat_1509134228"],
      fractured: ["fractured.stat_1509134228"],
      enchant: ["enchant.stat_1509134228"],
      rune: ["rune.stat_1509134228"],
      desecrated: ["desecrated.stat_1509134228"],
    },
  },
  id: "local_physical_damage_+%",
} as data.Stat;

const EXACT_MATCH_STAT = {
  ref: "Players are Cursed with Enfeeble",
  better: 1,
  matchers: [{ string: "Players are Cursed with Enfeeble" }],
  trade: { ids: { explicit: ["explicit.stat_4103440490"] } },
  id: "map_player_has_level_X_enfeeble",
} as data.Stat;
const OPTION_STAT = {
  ref: "Upgrades Radius to #",
  better: 1,
  matchers: [
    { string: "Upgrades Radius to Large", value: 2 },
    { string: "Upgrades Radius to Medium", value: 1 },
  ],
  trade: {
    ids: {
      explicit: ["explicit.stat_3891355829"],
      fractured: ["fractured.stat_3891355829"],
      desecrated: ["desecrated.stat_3891355829"],
    },
    option: true,
  },
  id: "local_jewel_display_radius_change",
} as data.Stat;

describe("tryParseTranslation", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // prob don't need these?
    // setupTests();
    // await init("en");
  });

  it("should return undefined if no translation is found", () => {
    vi.mocked(data.STAT_BY_MATCH_STR).mockReturnValue(undefined);
    vi.mocked(data.TRADE_STAT_BY_MATCH_STR).mockReturnValue(undefined);

    const result = __testExports.tryParseTranslation(
      { string: "180% increased Physical Damage", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );

    expect(result).toBeUndefined();
    expect(data.STAT_BY_MATCH_STR).toHaveBeenCalled();
    expect(data.TRADE_STAT_BY_MATCH_STR).toHaveBeenCalled();
  });

  it("should not call trade stats if stat found in normal stats", () => {
    vi.mocked(data.STAT_BY_MATCH_STR).mockReturnValue({
      stat: PHYS_DAMAGE_STAT,
      matcher: PHYS_DAMAGE_STAT.matchers[0],
    });
    vi.mocked(data.TRADE_STAT_BY_MATCH_STR).mockReturnValue(undefined);

    const result = __testExports.tryParseTranslation(
      { string: "180(170-190)% increased Physical Damage", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );

    expect(result).toBeDefined();
    expect(data.STAT_BY_MATCH_STR).toHaveBeenCalled();
    expect(data.TRADE_STAT_BY_MATCH_STR).not.toHaveBeenCalled();
  });

  it("should give simple parsed stat if match string fails but trade stat works", () => {
    vi.mocked(data.STAT_BY_MATCH_STR).mockReturnValue(undefined);
    vi.mocked(data.TRADE_STAT_BY_MATCH_STR).mockReturnValue(
      PHYS_DAMAGE_STAT.trade.ids,
    );

    const result = __testExports.tryParseTranslation(
      { string: "180(170-190)% increased Physical Damage", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );

    expect(result).toBeDefined();
    expect(data.STAT_BY_MATCH_STR).toHaveBeenCalled();
    expect(data.TRADE_STAT_BY_MATCH_STR).toHaveBeenCalled();
  });

  it("should parse roll from stat, when by match str", () => {
    vi.mocked(data.STAT_BY_MATCH_STR).mockImplementation((name) => {
      if (!name.startsWith("#")) return;
      return {
        stat: PHYS_DAMAGE_STAT,
        matcher: PHYS_DAMAGE_STAT.matchers[0],
      };
    });
    vi.mocked(data.TRADE_STAT_BY_MATCH_STR).mockReturnValue(undefined);

    const result = __testExports.tryParseTranslation(
      { string: "180(170-190)% increased Physical Damage", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );

    expect(result).toBeDefined();

    expect(result?.stat).toBe(PHYS_DAMAGE_STAT);
    expect(result?.translation).toBe(PHYS_DAMAGE_STAT.matchers[0]);
    expect(result?.roll?.value).toBe(180);

    expect(data.STAT_BY_MATCH_STR).toHaveBeenCalled();
  });

  it("should parse roll from stat, when by trade stat", () => {
    vi.mocked(data.STAT_BY_MATCH_STR).mockReturnValue(undefined);
    vi.mocked(data.TRADE_STAT_BY_MATCH_STR).mockImplementation((name) => {
      if (!name.startsWith("#")) return;
      return PHYS_DAMAGE_STAT.trade.ids;
    });

    const result = __testExports.tryParseTranslation(
      { string: "180(170-190)% increased Physical Damage", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );

    expect(result).toBeDefined();

    expect(result?.stat).not.toBe(PHYS_DAMAGE_STAT);
    expect(result?.translation.string).toBe("#% increased Physical Damage");
    expect(result?.roll?.value).toBe(180);

    expect(data.STAT_BY_MATCH_STR).toHaveBeenCalled();
    expect(data.TRADE_STAT_BY_MATCH_STR).toHaveBeenCalledTimes(2);
  });

  it("should handle legacy rolls", () => {
    vi.mocked(data.STAT_BY_MATCH_STR).mockImplementation((name) => {
      if (!name.startsWith("#")) return;
      return {
        stat: PHYS_DAMAGE_STAT,
        matcher: PHYS_DAMAGE_STAT.matchers[0],
      };
    });
    vi.mocked(data.TRADE_STAT_BY_MATCH_STR).mockReturnValue(undefined);

    const result = __testExports.tryParseTranslation(
      { string: "220(170-190)% increased Physical Damage", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );

    expect(result).toBeDefined();

    expect(result?.stat).toBe(PHYS_DAMAGE_STAT);
    expect(result?.translation).toBe(PHYS_DAMAGE_STAT.matchers[0]);
    expect(result?.roll?.value).toBe(220);
    expect(result?.roll?.legacy).toBeTruthy();

    expect(data.STAT_BY_MATCH_STR).toHaveBeenCalled();
  });

  it("should prefer match str on exact match", () => {
    vi.mocked(data.STAT_BY_MATCH_STR).mockReturnValue({
      stat: EXACT_MATCH_STAT,
      matcher: EXACT_MATCH_STAT.matchers[0],
    });
    vi.mocked(data.TRADE_STAT_BY_MATCH_STR).mockReturnValue(
      EXACT_MATCH_STAT.trade.ids,
    );

    const result = __testExports.tryParseTranslation(
      { string: "Players are Cursed with Enfeeble", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );

    expect(result).toBeDefined();
    expect(result?.stat).toBe(EXACT_MATCH_STAT);
    expect(result?.translation).toBe(EXACT_MATCH_STAT.matchers[0]);
    expect(result?.roll).toBeUndefined();

    expect(data.STAT_BY_MATCH_STR).toHaveBeenCalled();
    expect(data.TRADE_STAT_BY_MATCH_STR).not.toHaveBeenCalled();
  });

  it("should handle exact match with trade stat", () => {
    vi.mocked(data.STAT_BY_MATCH_STR).mockReturnValue(undefined);
    vi.mocked(data.TRADE_STAT_BY_MATCH_STR).mockReturnValue(
      EXACT_MATCH_STAT.trade.ids,
    );

    const result = __testExports.tryParseTranslation(
      { string: "Players are Cursed with Enfeeble", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );

    expect(result).toBeDefined();
    expect(result?.roll).toBeUndefined();

    expect(data.STAT_BY_MATCH_STR).toHaveBeenCalled();
    expect(data.TRADE_STAT_BY_MATCH_STR).toHaveBeenCalled();
  });

  it("should handle options in match str", () => {
    vi.mocked(data.STAT_BY_MATCH_STR).mockReturnValue({
      stat: OPTION_STAT,
      matcher: OPTION_STAT.matchers[0],
    });
    vi.mocked(data.TRADE_STAT_BY_MATCH_STR).mockReturnValue(
      OPTION_STAT.trade.ids,
    );

    const result = __testExports.tryParseTranslation(
      { string: "Upgrades Radius to Large", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );

    expect(result).toBeDefined();
    expect(result?.stat).toBe(OPTION_STAT);
    expect(result?.translation).toBe(OPTION_STAT.matchers[0]);
    expect(result?.roll?.value).toBe(2);

    expect(data.STAT_BY_MATCH_STR).toHaveBeenCalled();
    expect(data.TRADE_STAT_BY_MATCH_STR).not.toHaveBeenCalled();
  });

  it("should handle options in trade stat", () => {
    vi.mocked(data.STAT_BY_MATCH_STR).mockReturnValue(undefined);
    vi.mocked(data.TRADE_STAT_BY_MATCH_STR).mockReturnValue({
      explicit: ["explicit.stat_3891355829|2"],
    });

    const result = __testExports.tryParseTranslation(
      { string: "Upgrades Radius to Large", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );

    expect(result).toBeDefined();
    expect(result?.stat).not.toBe(OPTION_STAT);
    expect(result?.stat.trade.ids).toHaveProperty("explicit");
    expect(result?.stat.trade.ids.explicit).toHaveLength(1);

    expect(data.STAT_BY_MATCH_STR).toHaveBeenCalled();
    expect(data.TRADE_STAT_BY_MATCH_STR).toHaveBeenCalledOnce();
  });
});
