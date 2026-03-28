import { ModifierInfo } from "@/parser/advanced-mod-desc";
import { ModifierType } from "@/parser/modifiers";

class TestModInfo implements ModifierInfo {
  rawText: string;

  type: ModifierType = ModifierType.Necropolis;
  name?: string | undefined;
  tier?: number | undefined;
  rank?: number | undefined;
  tags: string[] = [];
  rollIncr?: number | undefined;
  hybridWithRef?: Set<string> | undefined;
  generation?: "suffix" | "prefix" | "corrupted" | "eldritch" | "mutated";

  constructor(text: string) {
    this.rawText = text;
  }

  public toString = () => {
    return this.rawText;
  };
}

export function createTestModInfo() {
  const mods = [];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Crackling" (Tier: 7) — Damage, Elemental, Lightning, Attack }
Adds 1(1-4) to 50(46-66) Lightning Damage
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 7;
  mods[0].name = "Crackling";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Damage", "Elemental", "Lightning", "Attack"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of the Brute" (Tier: 8) — Attribute }
+8(5-8) to Strength
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 8;
  mods[0].name = "of the Brute";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Attribute"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Shocking" (Tier: 4) — Damage, Elemental, Lightning, Attack }
Adds 5(1-5) to 82(62-89) Lightning Damage
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 4;
  mods[0].name = "Shocking";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Damage", "Elemental", "Lightning", "Attack"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Scorching" (Tier: 5) — Damage, Elemental, Fire, Attack }
Adds 27(20-30) to 36(31-46) Fire Damage
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 5;
  mods[0].name = "Scorching";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Damage", "Elemental", "Fire", "Attack"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Icy" (Tier: 8) — Damage, Elemental, Cold, Attack }
Adds 9(6-9) to 13(10-15) Cold Damage
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 8;
  mods[0].name = "Icy";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Damage", "Elemental", "Cold", "Attack"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of Radiance" (Tier: 1) — Attack }
+57(41-60) to Accuracy Rating
15% increased Light Radius
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 1;
  mods[0].name = "of Radiance";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Attack"];

  mods.unshift(
    new TestModInfo(`{ Unique Modifier — Defences }
56(50-70)% increased Energy Shield
`),
  );
  mods[0].generation = undefined;
  mods[0].tier = undefined;
  mods[0].name = undefined;
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Defences"];

  mods.unshift(
    new TestModInfo(`{ Unique Modifier — Mana }
40% increased Mana Regeneration Rate while stationary
`),
  );
  mods[0].generation = undefined;
  mods[0].tier = undefined;
  mods[0].name = undefined;
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Mana"];

  mods.unshift(
    new TestModInfo(`{ Unique Modifier — Elemental, Lightning, Resistance }
+26(20-30)% to Lightning Resistance
`),
  );
  mods[0].generation = undefined;
  mods[0].tier = undefined;
  mods[0].name = undefined;
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Elemental", "Lightning", "Resistance"];

  mods.unshift(
    new TestModInfo(`{ Unique Modifier — Elemental, Lightning, Resistance }
+5% to Maximum Lightning Resistance
`),
  );
  mods[0].generation = undefined;
  mods[0].tier = undefined;
  mods[0].name = undefined;
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Elemental", "Lightning", "Resistance"];

  mods.unshift(
    new TestModInfo(`{ Unique Modifier — Mana }
40% increased Mana Regeneration Rate
`),
  );
  mods[0].generation = undefined;
  mods[0].tier = undefined;
  mods[0].name = undefined;
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Mana"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Vaporous" (Tier: 3) — Defences }
+143(124-151) to Evasion Rating
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 3;
  mods[0].name = "Vaporous";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Defences"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of the Wrestler" (Tier: 7) — Attribute }
+12(9-12) to Strength
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 7;
  mods[0].name = "of the Wrestler";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Attribute"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of Warmth" (Tier: 3) — Mana }
8(8-12)% increased Mana Regeneration Rate
5% increased Light Radius
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 3;
  mods[0].name = "of Warmth";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Mana"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of the Penguin" (Tier: 7) — Elemental, Cold, Resistance }
+15(11-15)% to Cold Resistance
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 7;
  mods[0].name = "of the Penguin";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Elemental", "Cold", "Resistance"];

  mods.unshift(
    new TestModInfo(`{ Implicit Modifier — Elemental, Fire, Cold, Lightning, Resistance }
+8(7-10)% to all Elemental Resistances
`),
  );
  mods[0].generation = undefined;
  mods[0].tier = undefined;
  mods[0].name = undefined;
  mods[0].type = ModifierType.Implicit;
  mods[0].tags = ["Elemental", "Fire", "Cold", "Lightning", "Resistance"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Merciless" (Tier: 1) — Damage, Physical, Attack }
173(170-179)% increased Physical Damage
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 1;
  mods[0].name = "Merciless";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Damage", "Physical", "Attack"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Dictator's" (Tier: 1) — Damage, Physical, Attack }
78(75-79)% increased Physical Damage
+175(175-200) to Accuracy Rating
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 1;
  mods[0].name = "Dictator's";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Damage", "Physical", "Attack"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Flaring" (Tier: 1) — Damage, Physical, Attack }
Adds 54(37-55) to 94(63-94) Physical Damage (desecrated)
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 1;
  mods[0].name = "Flaring";
  mods[0].type = ModifierType.Desecrated;
  mods[0].tags = ["Damage", "Physical", "Attack"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of Infamy" — Attack, Speed }
25(23-25)% increased Attack Speed (fractured)
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = undefined;
  mods[0].name = "of Infamy";
  mods[0].type = ModifierType.Fractured;
  mods[0].tags = ["Attack", "Speed"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of the Sniper" (Tier: 1) }
+7 to Level of all Projectile Skills
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 1;
  mods[0].name = "of the Sniper";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = [];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of Bursting" (Tier: 1) — Attack }
Loads 2 additional bolts
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 1;
  mods[0].name = "of Bursting";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Attack"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Impenetrable" (Tier: 1) — Defences }
103(101-110)% increased Armour
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 1;
  mods[0].name = "Impenetrable";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Defences"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Hardened" (Tier: 1) — Defences }
+70(70-86) to Armour
41(39-42)% increased Armour
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 1;
  mods[0].name = "Hardened";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Defences"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Unmoving" (Tier: 2) — Defences }
+256(226-256) to Armour (desecrated)
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 2;
  mods[0].name = "Unmoving";
  mods[0].type = ModifierType.Desecrated;
  mods[0].tags = ["Defences"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of the Titan" (Tier: 1) — Attribute }
+32(31-33) to Strength
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 1;
  mods[0].name = "of the Titan";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Attribute"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of Allaying" (Tier: 3) — Physical, Ailment }
48(50-46)% reduced Duration of Bleeding on You
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 3;
  mods[0].name = "of Allaying";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Physical", "Ailment"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of the Essence" (Tier: 1) }
Hits against you have 44(40-50)% reduced Critical Damage Bonus
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 1;
  mods[0].name = "of the Essence";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = [];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Malignant" (Tier: 4) — Damage, Chaos }
71(65-74)% increased Chaos Damage
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 4;
  mods[0].name = "Malignant";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Damage", "Chaos"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Frostbound" (Tier: 1) — Damage, Elemental, Cold }
Gain 28(28-30)% of Damage as Extra Cold Damage
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 1;
  mods[0].name = "Frostbound";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Damage", "Elemental", "Cold"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of the Hearth" (Tier: 1) — Mana }
22(18-22)% increased Mana Regeneration Rate
15% increased Light Radius
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 1;
  mods[0].name = "of the Hearth";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Mana"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of the Apt" (Tier: 4) }
20% reduced Attribute Requirements
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 4;
  mods[0].name = "of the Apt";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = [];

  mods.unshift(
    new TestModInfo(`{ Implicit Modifier }
18(12-20)% increased Rarity of Items found
`),
  );
  mods[0].generation = undefined;
  mods[0].tier = undefined;
  mods[0].name = undefined;
  mods[0].type = ModifierType.Implicit;
  mods[0].tags = [];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Lady's" (Tier: 5) }
+30(30-33) to Spirit
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 5;
  mods[0].name = "Lady's";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = [];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Gentian" (Tier: 6) — Mana }
+90(90-104) to maximum Mana
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 6;
  mods[0].name = "Gentian";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Mana"];

  mods.unshift(
    new TestModInfo(`{ Prefix Modifier "Incanter's" (Tier: 1) — Damage, Caster }
29(27-30)% increased Spell Damage
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 1;
  mods[0].name = "Incanter's";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Damage", "Caster"];

  mods.unshift(
    new TestModInfo(`{ Fractured Suffix Modifier "of the Ice" (Tier: 2) — Elemental, Cold, Resistance }
+37(36-40)% to Cold Resistance
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 2;
  mods[0].name = "of the Ice";
  mods[0].type = ModifierType.Fractured;
  mods[0].tags = ["Elemental", "Cold", "Resistance"];

  mods.unshift(
    new TestModInfo(`{ Suffix Modifier "of the Sorcerer" (Tier: 1) — Caster, Gem }
+3 to Level of all Spell Skills
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 1;
  mods[0].name = "of the Sorcerer";
  mods[0].type = ModifierType.Explicit;
  mods[0].tags = ["Caster", "Gem"];

  mods.unshift(
    new TestModInfo(`{ Desecrated Suffix Modifier "of Amanamu" (Tier: 1) — Elemental, Fire, Chaos, Resistance }
+17(13-17)% to Fire and Chaos Resistances
`),
  );
  mods[0].generation = "suffix";
  mods[0].tier = 1;
  mods[0].name = "of Amanamu";
  mods[0].type = ModifierType.Desecrated;
  mods[0].tags = ["Elemental", "Fire", "Chaos", "Resistance"];

  mods.unshift(
    new TestModInfo(`{ Master Crafted Prefix Modifier "Gentian" (Tier: 6) — Mana }
+90(90-104) to maximum Mana
`),
  );
  mods[0].generation = "prefix";
  mods[0].tier = 6;
  mods[0].name = "Gentian";
  mods[0].type = ModifierType.Crafted;
  mods[0].tags = ["Mana"];

  return mods;
}
