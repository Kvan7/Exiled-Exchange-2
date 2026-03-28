import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "../vitest.setup";
import {
  __testExports,
  init,
  setLocalAugmentFilter,
  STAT_BY_REF,
} from "@/assets/data";

describe("augmentsToLookup", () => {
  setupTests();

  beforeEach(async () => {
    // Set a filter that allows all augments to pass through.
    setLocalAugmentFilter((value, index, array) => true);
    // Load the language data required for the tests.
    await init("en");
  });

  it("should not throw with empty list", () => {
    expect(() => __testExports.augmentsToLookup([])).not.toThrow();
  });
  // Currently disabled
  // test("Searching Iron augment should give 3 types", () => {
  //   AUGMENT_DATA_BY_AUGMENT["Iron Rune"].forEach((augment) => {
  //     expect(augment.augment).toBe("Iron Rune");
  //   });
  //   expect(AUGMENT_DATA_BY_AUGMENT["Iron Rune"].length).toBe(3);
  // });
  it("Random stats should be present", () => {
    expect(STAT_BY_REF("Adds # to # Physical Damage")).toBeTruthy();
    expect(STAT_BY_REF("Adds # to # Lightning Damage")).toBeTruthy();
    expect(STAT_BY_REF("#% to Fire Resistance")).toBeTruthy();
    expect(STAT_BY_REF("Knockback direction is reversed")).toBeTruthy();

    expect(
      STAT_BY_REF("Regenerate # Life per second per Maximum Energy Shield"),
    ).toBeTruthy();
    expect(
      STAT_BY_REF(
        "Increases and Reductions to Minion Attack Speed also affect you",
      ),
    ).toBeTruthy();
    expect(
      STAT_BY_REF(
        "Notable Passive Skills in Radius also grant Projectiles have #% chance for an additional Projectile when Forking",
      ),
    ).toBeTruthy();
    expect(
      STAT_BY_REF("Every Rage also grants #% increased Armour"),
    ).toBeTruthy();
    expect(
      STAT_BY_REF(
        "Recover #% of maximum Life for each Endurance Charge consumed",
      ),
    ).toBeTruthy();
    expect(STAT_BY_REF("#% increased Freeze Buildup")).toBeTruthy();
    expect(STAT_BY_REF("Has Purple Smoke")).toBeTruthy();
    expect(
      STAT_BY_REF("On Corruption, Item gains two Enchantments"),
    ).toBeTruthy();
  });
});
