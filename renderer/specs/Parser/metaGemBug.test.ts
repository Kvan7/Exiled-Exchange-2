import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";
import { parseClipboard, ItemCategory } from "@/parser";

describe("meta gems without item class", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });

  it("parses Cast on Critical copied text that starts with Rarity", () => {
    const result = parseClipboard(`Rarity: Gem
Cast on Critical
--------
Buff, Persistent, Trigger, Meta
Level: 19
Quality: +20% (augmented)
Reservation: 100 Spirit
--------
Requires: Level 84, 147 Int
--------
Sockets: G G G G G
--------
While active, gains Energy when you Critically Hit enemies and triggers socketed Spells on reaching maximum Energy.
--------
10% increased Reservation Efficiency
Gains 1 Energy per Power of enemies you
Critically Hit with Skills, modified by the percentage of the enemy's Ailment Threshold the Critical Hit will deal
54% increased Energy gained
Triggers all Socketed Spells and loses all Energy on reaching maximum Energy
--------
Support
--------
Has 10 maximum Energy per 0.1 seconds of base cast time of Socketed Spells
Socketed Skills deal 20% less Damage
--------
Place one or more Skill Gems into this Meta Gem's sockets in the Skills Panel. The socketed Skills will be incorporated into the Meta Gem's effect.
`);

    expect(result.isOk()).toBe(true);
    const item = result._unsafeUnwrap();
    expect(item.category).toBe(ItemCategory.Gem);
    expect(item.info.refName).toBe("Cast on Critical");
    expect(item.gemLevel).toBe(19);
  });
});
