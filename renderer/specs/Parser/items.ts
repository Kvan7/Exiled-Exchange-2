import { BaseType } from "@/assets/data";
import { ItemCategory, ItemInfluence, ItemRarity, ParsedItem } from "@/parser";
import { ParsedModifier } from "@/parser/advanced-mod-desc";
import { StatCalculated, ModifierType } from "@/parser/modifiers";

export class TestItem implements ParsedItem {
  // #region ParsedItem
  rarity?: ItemRarity | undefined;
  itemLevel?: number | undefined;
  armourAR?: number | undefined;
  armourEV?: number | undefined;
  armourES?: number | undefined;
  armourBLOCK?: number | undefined;
  basePercentile?: number | undefined;
  weaponCRIT?: number | undefined;
  weaponAS?: number | undefined;
  weaponPHYSICAL?: number | undefined;
  weaponELEMENTAL?: number | undefined;
  weaponFIRE?: number | undefined;
  weaponCOLD?: number | undefined;
  weaponLIGHTNING?: number | undefined;
  weaponChaos?: number | undefined;
  weaponReload?: number | undefined;
  mapBlighted?: "Blighted" | "Blight-ravaged" | undefined;
  mapTier?: number | undefined;
  gemLevel?: number | undefined;
  areaLevel?: number | undefined;
  talismanTier?: number | undefined;
  quality?: number | undefined;
  runeSockets?:
    | {
        empty: number;
        current: number;
        normal: number;
      }
    | undefined;

  gemSockets?: { number: number; linked?: number; white: number } | undefined;
  stackSize?: { value: number; max: number } | undefined;
  isUnidentified: boolean = false;
  isCorrupted: boolean = false;
  isUnmodifiable?: boolean | undefined;
  isMirrored?: boolean | undefined;
  influences: ItemInfluence[] = [];
  logbookAreaMods?: ParsedModifier[][] | undefined;
  sentinelCharge?: number | undefined;
  isSynthesised?: boolean | undefined;
  isFractured?: boolean | undefined;
  isVeiled?: boolean | undefined;
  isFoil?: boolean | undefined;
  statsByType: StatCalculated[] = [];
  newMods: ParsedModifier[] = [];
  unknownModifiers: Array<{ text: string; type: ModifierType }> = [];
  heist?:
    | {
        wingsRevealed?: number;
        target?: "Enchants" | "Trinkets" | "Gems" | "Replicas";
      }
    | undefined;

  note?: string;
  category?: ItemCategory | undefined;
  info: BaseType = {
    name: "test",
    refName: "test",
    namespace: "ITEM",
    icon: "test",
    tags: [],
  };

  rawText: string;

  // #endregion

  public get affixCount() {
    return (
      this.prefixCount +
      this.suffixCount +
      this.uniqueAffixCount +
      this.implicitCount +
      this.enchantCount
    );
  }

  public get explicitCount() {
    return this.prefixCount + this.suffixCount + this.uniqueAffixCount;
  }

  prefixCount: number = 0;
  suffixCount: number = 0;
  implicitCount: number = 0;
  enchantCount: number = 0;
  uniqueAffixCount: number = 0;
  rollingUniqueAffixCount: number = 0;

  sectionCount: number = 0;

  constructor(text: string) {
    this.rawText = text;
  }
}

// #region NormalItem
export const NormalItem = new TestItem(`Item Class: Helmets
Rarity: Normal
Superior Divine Crown
--------
Quality: +9% (augmented)
Armour: 174 (augmented)
Energy Shield: 60 (augmented)
--------
Requires: Level 75, 67 (augmented) Str, 67 (augmented) Int
--------
Item Level: 81
`);
NormalItem.category = ItemCategory.Helmet;
NormalItem.rarity = ItemRarity.Normal;
NormalItem.quality = 9;
NormalItem.armourAR = 174;
NormalItem.armourES = 60;
NormalItem.itemLevel = 81;

NormalItem.info.refName = "Divine Crown";
NormalItem.sectionCount = 4;
// #endregion

// #region MagicItem
export const MagicItem = new TestItem(`Item Class: Two Hand Maces
Rarity: Magic
Crackling Temple Maul of the Brute
--------
Physical Damage: 35-72
Lightning Damage: 1-50 (lightning)
Critical Hit Chance: 5.00%
Attacks per Second: 1.20
--------
Requires: Level 28, 57 (augmented) Str
--------
Item Level: 32
--------
{ Prefix Modifier "Crackling" (Tier: 7) — Damage, Elemental, Lightning, Attack }
Adds 1(1-4) to 50(46-66) Lightning Damage
{ Suffix Modifier "of the Brute" (Tier: 8) — Attribute }
+8(5-8) to Strength
`);
MagicItem.category = ItemCategory.TwoHandedMace;
MagicItem.rarity = ItemRarity.Magic;
MagicItem.weaponPHYSICAL = 53.5;
MagicItem.weaponLIGHTNING = 25.5;
MagicItem.weaponELEMENTAL = MagicItem.weaponLIGHTNING;
MagicItem.weaponCRIT = 5;
MagicItem.weaponAS = 1.2;
MagicItem.itemLevel = 32;

MagicItem.info.refName = "Temple Maul";
MagicItem.sectionCount = 5;
MagicItem.prefixCount = 1;
MagicItem.suffixCount = 1;
// #endregion

// #region RareItem
export const RareItem = new TestItem(`Item Class: Bows
Rarity: Rare
Oblivion Strike
Rider Bow
--------
Physical Damage: 36-61
Elemental Damage: 27-36 (fire), 9-13 (cold), 5-82 (lightning)
Critical Hit Chance: 5.00%
Attacks per Second: 1.20
--------
Requires: Level 51, 103 (augmented) Dex
--------
Item Level: 80
--------
{ Prefix Modifier "Shocking" (Tier: 4) — Damage, Elemental, Lightning, Attack }
Adds 5(1-5) to 82(62-89) Lightning Damage
{ Prefix Modifier "Scorching" (Tier: 5) — Damage, Elemental, Fire, Attack }
Adds 27(20-30) to 36(31-46) Fire Damage
{ Prefix Modifier "Icy" (Tier: 8) — Damage, Elemental, Cold, Attack }
Adds 9(6-9) to 13(10-15) Cold Damage
{ Suffix Modifier "of Radiance" (Tier: 1) — Attack }
+57(41-60) to Accuracy Rating
15% increased Light Radius
`);
RareItem.category = ItemCategory.Bow;
RareItem.rarity = ItemRarity.Rare;
RareItem.weaponPHYSICAL = 48.5;
RareItem.weaponFIRE = 31.5;
RareItem.weaponCOLD = 11;
RareItem.weaponLIGHTNING = 43.5;
RareItem.weaponELEMENTAL =
  RareItem.weaponFIRE + RareItem.weaponCOLD + RareItem.weaponLIGHTNING;
RareItem.weaponAS = 1.2;
RareItem.weaponCRIT = 5;
RareItem.itemLevel = 80;

RareItem.info.refName = "Rider Bow";
RareItem.sectionCount = 5;
RareItem.prefixCount = 3;
RareItem.suffixCount = 1;
// #endregion

// #region UniqueItem
export const UniqueItem = new TestItem(`Item Class: Foci
Rarity: Unique
The Eternal Spark
Crystal Focus
--------
Energy Shield: 44 (augmented)
--------
Requires: Level 26, 43 (augmented) Int
--------
Item Level: 81
--------
{ Unique Modifier — Defences }
56(50-70)% increased Energy Shield
{ Unique Modifier — Mana }
40% increased Mana Regeneration Rate while stationary
{ Unique Modifier — Elemental, Lightning, Resistance }
+26(20-30)% to Lightning Resistance
{ Unique Modifier — Elemental, Lightning, Resistance }
+5% to Maximum Lightning Resistance
{ Unique Modifier — Mana }
40% increased Mana Regeneration Rate
--------
A flash of blue, a stormcloud's kiss,
her motionless dance the pulse of bliss
`);
UniqueItem.category = ItemCategory.Focus;
UniqueItem.rarity = ItemRarity.Unique;
UniqueItem.armourES = 44;
UniqueItem.itemLevel = 81;

// NOTE: requires step through to verify use of Name here is right
UniqueItem.info.refName = "The Eternal Spark";
UniqueItem.sectionCount = 6;
UniqueItem.uniqueAffixCount = 5;
UniqueItem.rollingUniqueAffixCount = 2;
// #endregion

// #region RareWithImplicit
export const RareWithImplicit = new TestItem(`Item Class: Rings
Rarity: Rare
Rune Loop
Prismatic Ring
--------
Requires: Level 45
--------
Item Level: 79
--------
{ Implicit Modifier — Elemental, Fire, Cold, Lightning, Resistance }
+8(7-10)% to all Elemental Resistances (implicit)
--------
{ Prefix Modifier "Vaporous" (Tier: 3) — Defences }
+143(124-151) to Evasion Rating
{ Suffix Modifier "of the Wrestler" (Tier: 7) — Attribute }
+12(9-12) to Strength
{ Suffix Modifier "of Warmth" (Tier: 3) — Mana }
8(8-12)% increased Mana Regeneration Rate
5% increased Light Radius
{ Suffix Modifier "of the Penguin" (Tier: 7) — Elemental, Cold, Resistance }
+15(11-15)% to Cold Resistance
`);
RareWithImplicit.category = ItemCategory.Ring;
RareWithImplicit.rarity = ItemRarity.Rare;
RareWithImplicit.itemLevel = 79;

RareWithImplicit.info.refName = "Prismatic Ring";
RareWithImplicit.sectionCount = 5;
RareWithImplicit.implicitCount = 1;
RareWithImplicit.prefixCount = 1;
RareWithImplicit.suffixCount = 3;
// #endregion

// #region UncutSkillGem
export const UncutSkillGem = new TestItem(`Item Class: Uncut Skill Gems
Rarity: Currency
Uncut Skill Gem (Level 19)
--------
Creates a Skill Gem or Level an existing gem to level 19
--------
Right Click to engrave a Skill Gem.
`);
UncutSkillGem.category = ItemCategory.Currency;
UncutSkillGem.gemLevel = 19;
UncutSkillGem.info = {
  name: "Uncut Skill Gem",
  refName: "Uncut Skill Gem",
  namespace: "ITEM",
  icon: "test",
  tags: [],
  craftable: { category: ItemCategory.Currency },
};

UncutSkillGem.sectionCount = 3;
// #endregion

// #region UncutSpiritGem
export const UncutSpiritGem = new TestItem(`Item Class: Uncut Spirit Gems
Rarity: Currency
Uncut Spirit Gem (Level 16)
--------
Creates a Persistent Buff Skill Gem or Level an existing gem to Level 16
--------
Right Click to engrave a Persistent Buff Skill Gem.
`);
UncutSpiritGem.category = ItemCategory.Currency;
UncutSpiritGem.gemLevel = 16;
UncutSpiritGem.info = {
  name: "Uncut Spirit Gem",
  refName: "Uncut Spirit Gem",
  namespace: "ITEM",
  icon: "test",
  tags: [],
  craftable: { category: ItemCategory.Currency },
};

UncutSpiritGem.sectionCount = 3;
// #endregion

// #region UncutSupportGem
export const UncutSupportGem = new TestItem(`Item Class: Uncut Support Gems
Rarity: Currency
Uncut Support Gem (Level 5)
--------
Creates a Support Gem
--------
Right Click to engrave a Support Gem.
`);
UncutSupportGem.category = ItemCategory.Currency;
UncutSupportGem.gemLevel = 5;
UncutSupportGem.info = {
  name: "Uncut Spirit Gem",
  refName: "Uncut Spirit Gem",
  namespace: "ITEM",
  icon: "test",
  tags: [],
  craftable: { category: ItemCategory.Currency },
};

UncutSupportGem.sectionCount = 3;
// #endregion

// #region HighDamageRareItem
export const HighDamageRareItem = new TestItem(`Item Class: Crossbows
Rarity: Rare
Dragon Core
Siege Crossbow
--------
Quality: +29% (augmented)
Physical Damage: 414-1,043 (augmented)
Critical Hit Chance: 5.00%
Attacks per Second: 2.07 (augmented)
Reload Time: 0.60 (augmented)
--------
Requires: Level 79, 89 (unmet) Str, 89 Dex
--------
Sockets: S S
--------
Item Level: 82
--------
36% increased Physical Damage (rune)
--------
{ Implicit Modifier }
Grenade Skills Fire an additional Projectile (implicit)
--------
{ Prefix Modifier "Merciless" (Tier: 1) — Damage, Physical, Attack }
173(170-179)% increased Physical Damage
{ Prefix Modifier "Dictator's" (Tier: 1) — Damage, Physical, Attack }
78(75-79)% increased Physical Damage
+175(175-200) to Accuracy Rating
{ Prefix Modifier "Flaring" (Tier: 1) — Damage, Physical, Attack }
Adds 54(37-55) to 94(63-94) Physical Damage (desecrated)
{ Suffix Modifier "of Infamy" — Attack, Speed }
25(23-25)% increased Attack Speed (fractured)
{ Suffix Modifier "of the Sniper" (Tier: 1) }
+7 to Level of all Projectile Skills
{ Suffix Modifier "of Bursting" (Tier: 1) — Attack }
Loads 2 additional bolts
--------
Fractured Item
`);
HighDamageRareItem.category = ItemCategory.Crossbow;
HighDamageRareItem.rarity = ItemRarity.Rare;
HighDamageRareItem.weaponPHYSICAL = 728.5;
HighDamageRareItem.weaponAS = 2.07;
HighDamageRareItem.weaponCRIT = 5;
HighDamageRareItem.weaponReload = 0.6;
HighDamageRareItem.itemLevel = 82;

HighDamageRareItem.info.refName = "Siege Crossbow";
HighDamageRareItem.sectionCount = 9;
HighDamageRareItem.prefixCount = 3;
HighDamageRareItem.suffixCount = 3;
HighDamageRareItem.implicitCount = 1;

HighDamageRareItem.runeSockets = {
  empty: 0,
  current: 2,
  normal: 2,
};
// #endregion

// #region ArmourHighValueRareItem
export const ArmourHighValueRareItem = new TestItem(`Item Class: Body Armours
Rarity: Rare
Hate Pelt
Soldier Cuirass
--------
Quality: +20% (augmented)
Armour: 3075 (augmented)
--------
Requires: Level 65, 121 (unmet) Str
--------
Sockets: S S S
--------
Item Level: 80
--------
54% increased Armour, Evasion and Energy Shield (rune)
--------
{ Prefix Modifier "Impenetrable" (Tier: 1) — Defences }
103(101-110)% increased Armour
{ Prefix Modifier "Hardened" (Tier: 1) — Defences }
+70(70-86) to Armour
41(39-42)% increased Armour
{ Prefix Modifier "Unmoving" (Tier: 2) — Defences }
+256(226-256) to Armour (desecrated)
{ Suffix Modifier "of the Titan" (Tier: 1) — Attribute }
+32(31-33) to Strength
{ Suffix Modifier "of Allaying" (Tier: 3) — Physical, Ailment }
48(50-46)% reduced Duration of Bleeding on You
{ Suffix Modifier "of the Essence" (Tier: 1) }
Hits against you have 44(40-50)% reduced Critical Damage Bonus
--------
Note: ~b/o 10 divine
`);
ArmourHighValueRareItem.category = ItemCategory.BodyArmour;
ArmourHighValueRareItem.rarity = ItemRarity.Rare;
ArmourHighValueRareItem.armourAR = 3075;
ArmourHighValueRareItem.itemLevel = 80;

ArmourHighValueRareItem.info.refName = "Soldier Cuirass";
ArmourHighValueRareItem.sectionCount = 8;
ArmourHighValueRareItem.prefixCount = 3;
ArmourHighValueRareItem.suffixCount = 3;

ArmourHighValueRareItem.runeSockets = {
  empty: 0,
  current: 3,
  normal: 2,
};
ArmourHighValueRareItem.note = "~b/o 10 divine";
// #endregion

// #region WandRareItem
export const WandRareItem = new TestItem(`Item Class: Wands
Rarity: Rare
Doom Bite
Withered Wand
--------
Requires: Level 90 (unmet), 125 (augmented) Int
--------
Item Level: 82
--------
Grants Skill: Level 20 Chaos Bolt
--------
{ Prefix Modifier "Malignant" (Tier: 4) — Damage, Chaos }
71(65-74)% increased Chaos Damage
{ Prefix Modifier "Frostbound" (Tier: 1) — Damage, Elemental, Cold }
Gain 28(28-30)% of Damage as Extra Cold Damage
{ Suffix Modifier "of the Hearth" (Tier: 1) — Mana }
22(18-22)% increased Mana Regeneration Rate
15% increased Light Radius
{ Suffix Modifier "of the Apt" (Tier: 4) }
20% reduced Attribute Requirements
--------
Note: ~b/o 5 exalted
`);
WandRareItem.category = ItemCategory.Wand;
WandRareItem.rarity = ItemRarity.Rare;
WandRareItem.itemLevel = 82;

WandRareItem.info.refName = "Withered Wand";
WandRareItem.sectionCount = 6;
WandRareItem.prefixCount = 2;
WandRareItem.suffixCount = 2;
WandRareItem.implicitCount = 1;

WandRareItem.note = "~b/o 5 exalted";
// #endregion

// #region NormalShield
export const NormalShield = new TestItem(`Item Class: Shields
Rarity: Normal
Polished Targe
--------
Block chance: 25%
Armour: 71
Evasion Rating: 64
--------
Requires: Level 54, 42 Str, 42 Dex
--------
Item Level: 54
--------
Grants Skill: Raise Shield
--------
Note: ~b/o 1 aug
`);
NormalShield.category = ItemCategory.Shield;
NormalShield.rarity = ItemRarity.Normal;
NormalShield.itemLevel = 82;

NormalShield.info.refName = "Polished Targe";
NormalShield.sectionCount = 6;
NormalShield.implicitCount = 1;

NormalShield.note = "~b/o 1 aug";
// #endregion

// #region TwoImplicitItem
export const TwoImplicitItem = new TestItem(`Item Class: Belts
Rarity: Rare
Corpse Snare
Ornate Belt
--------
Requires: Level 59
--------
Item Level: 80
--------
{ Implicit Modifier }
14(15-10)% reduced Charm Charges used (implicit)
{ Implicit Modifier — Charm }
Has 2(1-3) Charm Slots (implicit)
--------
{ Prefix Modifier "Transformative" (Tier: 4) }
11(10-15)% increased Charm Effect Duration
{ Prefix Modifier "Fecund" (Tier: 1) — Life }
+161(150-174) to maximum Life
{ Suffix Modifier "of the Volcano" (Tier: 3) — Elemental, Fire, Resistance }
+32(31-35)% to Fire Resistance
{ Suffix Modifier "of the Titan" (Tier: 2) — Attribute }
+33(31-33) to Strength
{ Suffix Modifier "of Steel Skin" (Tier: 6) }
+94(73-97) to Stun Threshold
`);
TwoImplicitItem.category = ItemCategory.Belt;
TwoImplicitItem.rarity = ItemRarity.Rare;
TwoImplicitItem.itemLevel = 80;

TwoImplicitItem.info.refName = "Ornate Belt";
TwoImplicitItem.sectionCount = 5;
TwoImplicitItem.implicitCount = 2;
TwoImplicitItem.prefixCount = 2;
TwoImplicitItem.suffixCount = 3;
// #endregion

// #region TwoLineOneImplicitItem
export const TwoLineOneImplicitItem = new TestItem(`Item Class: Tablet
Rarity: Rare
Planar Challenge
Delirium Precursor Tablet
--------
Item Level: 84
--------
{ Implicit Modifier }
Adds a Mirror of Delirium to a Map (implicit)
17 uses remaining (implicit)
--------
{ Prefix Modifier "Breeding" }
7(4-10)% increased Pack Size in Map
{ Prefix Modifier "Teeming" }
Map has 16(25-70)% increased Magic Monsters
{ Suffix Modifier "of the Simulacrum" (Tier: 1) }
6(10-30)% increased Stack size of Simulacrum Splinters found in Map
{ Suffix Modifier "of Phobia" (Tier: 1) }
Delirium Encounters in Map are 5(10-30)% more likely to spawn Unique Bosses
--------
Can be used in a personal Map Device to add modifiers to a Map.
--------
Corrupted
--------
Note: ~b/o 1 exalted
`);
TwoLineOneImplicitItem.category = ItemCategory.Tablet;
TwoLineOneImplicitItem.rarity = ItemRarity.Rare;
TwoLineOneImplicitItem.itemLevel = 84;

TwoLineOneImplicitItem.info.refName = "Delirium Precursor Tablet";
TwoLineOneImplicitItem.sectionCount = 7;
TwoLineOneImplicitItem.implicitCount = 1;
TwoLineOneImplicitItem.prefixCount = 2;
TwoLineOneImplicitItem.suffixCount = 2;

TwoLineOneImplicitItem.isCorrupted = true;
TwoLineOneImplicitItem.note = "~b/o 1 exalted";
// #endregion
