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
  weaponCHAOS?: number | undefined;
  weaponRELOAD?: number | undefined;
  weaponSPIRIT?: number;
  mapBlighted?: "Blighted" | "Blight-ravaged" | undefined;
  mapTier?: number | undefined;
  mapPackSize?: number;
  mapItemRarity?: number;
  mapRevives?: number;
  mapDropChance?: number;
  mapMagicMonsters?: number;
  mapRareMonsters?: number;
  gemLevel?: number | undefined;
  areaLevel?: number | undefined;
  talismanTier?: number | undefined;
  quality?: number | undefined;
  augmentSockets?:
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

  requires?: {
    level: number;
    str: number;
    dex: number;
    int: number;
  };

  unidentifiedTier?: number;

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
  skillCount: number = 0;
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
NormalItem.requires = {
  level: 75,
  str: 67,
  dex: 0,
  int: 67,
};

NormalItem.info.refName = "Divine Crown";
NormalItem.sectionCount = 4;
// #endregion NormalItem

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
MagicItem.requires = {
  level: 28,
  str: 57,
  dex: 0,
  int: 0,
};

MagicItem.info.refName = "Temple Maul";
MagicItem.sectionCount = 5;
MagicItem.prefixCount = 1;
MagicItem.suffixCount = 1;
// #endregion MagicItem

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
RareItem.requires = {
  level: 51,
  str: 0,
  dex: 103,
  int: 0,
};

RareItem.info.refName = "Rider Bow";
RareItem.sectionCount = 5;
RareItem.prefixCount = 3;
RareItem.suffixCount = 1;
// #endregion RareItem

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
UniqueItem.requires = {
  level: 26,
  str: 0,
  dex: 0,
  int: 43,
};

// NOTE: requires step through to verify use of Name here is right
UniqueItem.info.refName = "The Eternal Spark";
UniqueItem.sectionCount = 6;
UniqueItem.uniqueAffixCount = 5;
UniqueItem.rollingUniqueAffixCount = 2;
// #endregion UniqueItem

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
+8(7-10)% to all Elemental Resistances
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
RareWithImplicit.requires = {
  level: 45,
  str: 0,
  dex: 0,
  int: 0,
};

RareWithImplicit.info.refName = "Prismatic Ring";
RareWithImplicit.sectionCount = 5;
RareWithImplicit.implicitCount = 1;
RareWithImplicit.prefixCount = 1;
RareWithImplicit.suffixCount = 3;
// #endregion RareWithImplicit

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
// #endregion UncutSkillGem

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
// #endregion UncutSpiritGem

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
// #endregion UncutSupportGem

// #region MetaSkillGem
export const MetaSkillGem = new TestItem(`Rarity: Gem
Mirage Archer
--------
Buff, Persistent, Trigger, Duration, Meta
Level: 14
Reservation: 60 Spirit
--------
Requires: Level 58, 103 Dex
Requires: Spear, Bow, Crossbow
--------
Sockets: G G G G
--------
While active, dodge rolling will create a Mirage that uses socketed ranged Attacks for a short duration, then vanish.
--------
Support
--------
Mirages deal 30% less Damage
Socketed Skills cannot consume Charges
--------
Mirage
--------
Cooldown Time: 10.00s
--------
Mirage duration is 5.7 seconds
--------
Place one or more Skill Gems into this Meta Gem's sockets in the Skills Panel. The socketed Skills will be incorporated into the Meta Gem's effect.
`);
MetaSkillGem.category = ItemCategory.Gem;
MetaSkillGem.gemLevel = 14;
MetaSkillGem.info = {
  name: "Mirage Archer",
  refName: "Mirage Archer",
  namespace: "GEM",
  icon: "test",
  tags: [],
  craftable: { category: ItemCategory.Gem },
};

MetaSkillGem.sectionCount = 11;
// #endregion MetaSkillGem

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
Grenade Skills Fire an additional Projectile
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
HighDamageRareItem.quality = 29;
HighDamageRareItem.weaponPHYSICAL = 728.5;
HighDamageRareItem.weaponAS = 2.07;
HighDamageRareItem.weaponCRIT = 5;
HighDamageRareItem.weaponRELOAD = 0.6;
HighDamageRareItem.itemLevel = 82;

HighDamageRareItem.info.refName = "Siege Crossbow";
HighDamageRareItem.sectionCount = 9;
HighDamageRareItem.prefixCount = 3;
HighDamageRareItem.suffixCount = 3;
HighDamageRareItem.implicitCount = 1;
HighDamageRareItem.requires = {
  level: 79,
  str: 89,
  dex: 89,
  int: 0,
};

HighDamageRareItem.augmentSockets = {
  empty: 0,
  current: 2,
  normal: 2,
};
// #endregion HighDamageRareItem

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
ArmourHighValueRareItem.quality = 20;
ArmourHighValueRareItem.armourAR = 3075;
ArmourHighValueRareItem.itemLevel = 80;
ArmourHighValueRareItem.requires = {
  level: 65,
  str: 121,
  dex: 0,
  int: 0,
};

ArmourHighValueRareItem.info.refName = "Soldier Cuirass";
ArmourHighValueRareItem.sectionCount = 8;
ArmourHighValueRareItem.prefixCount = 3;
ArmourHighValueRareItem.suffixCount = 3;

ArmourHighValueRareItem.augmentSockets = {
  empty: 0,
  current: 3,
  normal: 2,
};
ArmourHighValueRareItem.note = "~b/o 10 divine";
// #endregion ArmourHighValueRareItem

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
WandRareItem.requires = {
  level: 90,
  str: 0,
  dex: 0,
  int: 125,
};

WandRareItem.info.refName = "Withered Wand";
WandRareItem.sectionCount = 6;
WandRareItem.prefixCount = 2;
WandRareItem.suffixCount = 2;
WandRareItem.implicitCount = 1;

WandRareItem.note = "~b/o 5 exalted";
// #endregion WandRareItem

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
NormalShield.armourAR = 71;
NormalShield.armourEV = 64;
NormalShield.armourBLOCK = 25;
NormalShield.requires = {
  level: 54,
  str: 42,
  dex: 42,
  int: 0,
};

NormalShield.info.refName = "Polished Targe";
NormalShield.sectionCount = 6;
NormalShield.implicitCount = 1;

NormalShield.note = "~b/o 1 aug";
// #endregion NormalShield

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
14(15-10)% reduced Charm Charges used
{ Implicit Modifier — Charm }
Has 2(1-3) Charm Slots
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
TwoImplicitItem.requires = {
  level: 59,
  str: 0,
  dex: 0,
  int: 0,
};

TwoImplicitItem.info.refName = "Ornate Belt";
TwoImplicitItem.sectionCount = 5;
TwoImplicitItem.implicitCount = 2;
TwoImplicitItem.prefixCount = 2;
TwoImplicitItem.suffixCount = 3;
// #endregion TwoImplicitItem

// #region TwoLineOneImplicitItem
export const TwoLineOneImplicitItem = new TestItem(`Item Class: Tablet
Rarity: Rare
Planar Challenge
Delirium Precursor Tablet
--------
Item Level: 84
--------
{ Implicit Modifier }
Adds a Mirror of Delirium to a Map
17 uses remaining
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
// #endregion TwoLineOneImplicitItem

// #region Map
export const RareMap = new TestItem(`Item Class: Waystones
Rarity: Rare
Desolate Route
Waystone (Tier 14)
--------
Waystone Tier: 14
Revives Available: 2 (augmented)
Pack Size: +34% (augmented)
Rare Monsters: +28% (augmented)
Waystone Drop Chance: +75% (augmented)
--------
Item Level: 80
--------
{ Prefix Modifier "Shocking" (Tier: 1) }
Area has patches of Shocked Ground — Unscalable Value
{ Prefix Modifier "Painful" (Tier: 1) }
28(26-30)% increased Monster Damage
{ Suffix Modifier "of Splitting" (Tier: 2) }
Monsters fire 2 additional Projectiles
{ Suffix Modifier "of Destruction" (Tier: 1) }
Monsters have 293(260-300)% increased Critical Hit Chance
+26(26-30)% to Monster Critical Damage Bonus
--------
Can be used in a Map Device, allowing you to enter a Map. Waystones can only be used once.
`);
RareMap.category = ItemCategory.Map;
RareMap.rarity = ItemRarity.Normal;
RareMap.mapTier = 14;
RareMap.mapRevives = 2;
RareMap.mapPackSize = 34;
RareMap.mapRareMonsters = 28;
RareMap.mapDropChance = 75;
RareMap.sectionCount = 5;
// #endregion RareMap

// #region RareMapFakeAllProps
export const RareMapFakeAllProps = new TestItem(`Item Class: Waystones
Rarity: Rare
Blasted Control
Waystone (Tier 16)
--------
Waystone Tier: 16
Revives Available: 0 (augmented)
Pack Size: +20% (augmented)
Magic Monsters: +30% (augmented)
Rare Monsters: +71% (augmented)
Waystone Drop Chance: +90% (augmented)
Item Rarity: +17% (augmented)
--------
Item Level: 79
--------
{ Prefix Modifier "Painful" (Tier: 1) }
30(26-30)% increased Monster Damage
{ Prefix Modifier "Enduring" (Tier: 1) }
Monsters are Armoured
{ Prefix Modifier "Slowing" (Tier: 1) }
Players are periodically Cursed with Temporal Chains — Unscalable Value
{ Suffix Modifier "of the Unwavering" (Tier: 1) }
Monsters have 71(70-79)% increased Ailment Threshold
Monsters have 72(70-79)% increased Stun Threshold
{ Suffix Modifier "of Drought" (Tier: 1) }
Players gain 33(35-30)% reduced Flask Charges
{ Suffix Modifier "of Shattering" (Tier: 1) }
Monsters Break Armour equal to 36(30-45)% of Physical Damage dealt
--------
Can be used in a Map Device, allowing you to enter a Map. Waystones can only be used once.
--------
Corrupted
`);
RareMapFakeAllProps.category = ItemCategory.Map;
RareMapFakeAllProps.rarity = ItemRarity.Normal;
RareMapFakeAllProps.mapTier = 16;
RareMapFakeAllProps.mapRevives = 0;
RareMapFakeAllProps.mapPackSize = 20;
RareMapFakeAllProps.mapMagicMonsters = 30;
RareMapFakeAllProps.mapRareMonsters = 71;
RareMapFakeAllProps.mapDropChance = 90;
RareMapFakeAllProps.mapItemRarity = 17;
RareMapFakeAllProps.sectionCount = 6;
// #endregion RareMapFakeAllProps

// #region FracturedItem
export const FracturedItem = new TestItem(`Item Class: Bows
Rarity: Rare
Miracle Siege
Obliterator Bow
--------
Quality: +25% (augmented)
Physical Damage: 381-705 (augmented)
Critical Hit Chance: 9.40% (augmented)
Attacks per Second: 1.15
--------
Requires: Level 78, 163 (unmet) Dex
--------
Sockets: S S
--------
Item Level: 81
--------
36% increased Physical Damage (rune)
--------
{ Implicit Modifier }
50% reduced Projectile Range
--------
{ Prefix Modifier "Flaring" (Tier: 1) — Damage, Physical, Attack }
Adds 32(26-39) to 59(44-66) Physical Damage (fractured)

{ Prefix Modifier "Bloodthirsty" (Tier: 4) — Damage, Physical, Attack }
134(110-134)% increased Physical Damage

{ Prefix Modifier "Champion's" (Tier: 4) — Damage, Physical, Attack }
54(45-54)% increased Physical Damage
+113(98-123) to Accuracy Rating

{ Suffix Modifier "of the Essence" — Speed }
20(20-25)% chance to gain Onslaught on Killing Hits with this Weapon

{ Suffix Modifier "of the Essence" — Attack }
+3 to Level of all Attack Skills

{ Suffix Modifier "of Ruin" (Tier: 2) — Attack, Critical }
+4.4(3.81-4.4)% to Critical Hit Chance

--------
Fractured Item
`);
FracturedItem.category = ItemCategory.Bow;
FracturedItem.rarity = ItemRarity.Rare;
FracturedItem.quality = 25;
FracturedItem.weaponPHYSICAL = 624;
FracturedItem.weaponAS = 1.15;
FracturedItem.weaponCRIT = 9.4;
FracturedItem.itemLevel = 81;
FracturedItem.requires = {
  level: 78,
  str: 163,
  dex: 0,
  int: 0,
};

FracturedItem.info.refName = "Obliterator Bow";
FracturedItem.isFractured = true;
FracturedItem.prefixCount = 3;
FracturedItem.suffixCount = 3;
FracturedItem.implicitCount = 1;
FracturedItem.sectionCount = 9;
FracturedItem.augmentSockets = {
  empty: 0,
  current: 2,
  normal: 2,
};
// #endregion FracturedItem

// #region FracturedItemNoModMarked
export const FracturedItemNoModMarked = new TestItem(`Item Class: Bows
Rarity: Rare
Miracle Siege
Obliterator Bow
--------
Quality: +25% (augmented)
Physical Damage: 381-705 (augmented)
Critical Hit Chance: 9.40% (augmented)
Attacks per Second: 1.15
--------
Requires: Level 78, 163 (unmet) Dex
--------
Sockets: S S
--------
Item Level: 81
--------
36% increased Physical Damage (rune)
--------
{ Implicit Modifier }
50% reduced Projectile Range
--------
{ Prefix Modifier "Flaring" (Tier: 1) — Damage, Physical, Attack }
Adds 32(26-39) to 59(44-66) Physical Damage

{ Prefix Modifier "Bloodthirsty" (Tier: 4) — Damage, Physical, Attack }
134(110-134)% increased Physical Damage

{ Prefix Modifier "Champion's" (Tier: 4) — Damage, Physical, Attack }
54(45-54)% increased Physical Damage
+113(98-123) to Accuracy Rating

{ Suffix Modifier "of the Essence" — Speed }
20(20-25)% chance to gain Onslaught on Killing Hits with this Weapon

{ Suffix Modifier "of the Essence" — Attack }
+3 to Level of all Attack Skills

{ Suffix Modifier "of Ruin" (Tier: 2) — Attack, Critical }
+4.4(3.81-4.4)% to Critical Hit Chance

--------
Fractured Item
`);
FracturedItemNoModMarked.category = ItemCategory.Bow;
FracturedItemNoModMarked.rarity = ItemRarity.Rare;
FracturedItemNoModMarked.quality = 25;
FracturedItemNoModMarked.weaponPHYSICAL = 543;
FracturedItemNoModMarked.weaponAS = 1.15;
FracturedItemNoModMarked.weaponCRIT = 9.4;
FracturedItemNoModMarked.itemLevel = 81;
FracturedItemNoModMarked.requires = {
  level: 78,
  str: 163,
  dex: 0,
  int: 0,
};

FracturedItemNoModMarked.info.refName = "Obliterator Bow";
FracturedItemNoModMarked.isFractured = true;
FracturedItemNoModMarked.prefixCount = 3;
FracturedItemNoModMarked.suffixCount = 3;
FracturedItemNoModMarked.implicitCount = 1;
FracturedItemNoModMarked.sectionCount = 9;
FracturedItemNoModMarked.augmentSockets = {
  empty: 0,
  current: 2,
  normal: 2,
};
// #endregion FracturedItemNoModMarked

// #region RequiresOneAttribute
export const RequiresOneAttribute = new TestItem(`Item Class: Boots
Rarity: Rare
Dunerunner Sandals
--------
Energy Shield: 58
--------
Requires: 78 (unmet) Intelligence
--------
Item Level: 68
--------
Unidentified
`);

RequiresOneAttribute.category = ItemCategory.Boots;
RequiresOneAttribute.rarity = ItemRarity.Rare;
RequiresOneAttribute.itemLevel = 68;
RequiresOneAttribute.armourES = 58;
RequiresOneAttribute.requires = {
  level: 0,
  str: 0,
  dex: 0,
  int: 78,
};

RequiresOneAttribute.info.refName = "Dunerunner Sandals";
RequiresOneAttribute.sectionCount = 5;
RequiresOneAttribute.isUnidentified = true;
// #endregion RequiresOneAttribute

// #region NewExplicitTypeDefinitions
export const NewExplicitTypeDefinitions = new TestItem(`Item Class: Amulets
Rarity: Rare
Brood Locket
Gold Amulet
--------
Requires: Level 60
--------
Item Level: 81
--------
Allocates Cooked (enchant)
--------
{ Implicit Modifier }
18(12-20)% increased Rarity of Items found
--------
{ Prefix Modifier "Lady's" (Tier: 5) }
+30(30-33) to Spirit
{ Prefix Modifier "Gentian" (Tier: 6) — Mana }
+90(90-104) to maximum Mana
{ Prefix Modifier "Incanter's" (Tier: 1) — Damage, Caster }
29(27-30)% increased Spell Damage
{ Fractured Suffix Modifier "of the Ice" (Tier: 2) — Elemental, Cold, Resistance }
+37(36-40)% to Cold Resistance
{ Suffix Modifier "of the Sorcerer" (Tier: 1) — Caster, Gem }
+3 to Level of all Spell Skills
{ Desecrated Suffix Modifier "of Amanamu" (Tier: 1) — Elemental, Fire, Chaos, Resistance }
+17(13-17)% to Fire and Chaos Resistances
--------
Fractured Item
`);

NewExplicitTypeDefinitions.category = ItemCategory.Amulet;
NewExplicitTypeDefinitions.rarity = ItemRarity.Rare;
NewExplicitTypeDefinitions.itemLevel = 81;
NewExplicitTypeDefinitions.requires = {
  level: 60,
  str: 0,
  dex: 0,
  int: 0,
};

NewExplicitTypeDefinitions.info.refName = "Gold Amulet";
NewExplicitTypeDefinitions.sectionCount = 7;
NewExplicitTypeDefinitions.isFractured = true;
NewExplicitTypeDefinitions.prefixCount = 3;
NewExplicitTypeDefinitions.suffixCount = 3;
NewExplicitTypeDefinitions.implicitCount = 1;
NewExplicitTypeDefinitions.enchantCount = 1;
// #endregion NewExplicitTypeDefinitions

// #region ItemAllTheModifierTypes
export const ItemAllTheModifierTypes = new TestItem(`Item Class: Crossbows
Rarity: Rare
Storm Core
Gemini Crossbow
--------
Quality: +20% (augmented)
Physical Damage: 74-231 (augmented)
Lightning Damage: 10-273 (lightning)
Critical Hit Chance: 5.00%
Attacks per Second: 1.89 (augmented)
Reload Time: 0.93 (augmented)
--------
Requires: Level 78, 89 Str, 89 Dex
--------
Sockets: S S
--------
Item Level: 80
--------
45% increased Elemental Damage with Attacks (enchant)
--------
18% increased Physical Damage (rune)
Gain 24 Mana per enemy killed (rune)
--------
{ Implicit Modifier — Attack }
Loads an additional bolt
--------
Grants Skill: Level 18 Cackling Companions
--------
{ Fractured Prefix Modifier "Electrocuting" (Tier: 2) — Damage, Elemental, Lightning, Attack }
Adds 10(1-16) to 273(239-300) Lightning Damage
{ Prefix Modifier "Razor-sharp" (Tier: 3) — Damage, Physical, Attack }
Adds 24(23-35) to 51(39-59) Physical Damage
{ Prefix Modifier "Overpowering" (Tier: 2) — Damage, Elemental, Attack }
109(100-119)% increased Elemental Damage with Attacks
{ Suffix Modifier "of the Drought" (Tier: 1) — Mana, Physical, Attack }
Leeches 7.59(7-7.9)% of Physical Damage as Mana
{ Desecrated Suffix Modifier "of Siphoning" (Tier: 3) — Mana }
Gain 21(21-27) Mana per enemy killed
{ Suffix Modifier "of Acclaim" (Tier: 1) — Attack, Speed }
18(17-19)% increased Attack Speed
--------
Corrupted
--------
Fractured Item
`);

ItemAllTheModifierTypes.category = ItemCategory.Crossbow;
ItemAllTheModifierTypes.rarity = ItemRarity.Rare;
ItemAllTheModifierTypes.quality = 20;
ItemAllTheModifierTypes.weaponPHYSICAL = 152.5;
ItemAllTheModifierTypes.weaponLIGHTNING = 141.5;
ItemAllTheModifierTypes.weaponELEMENTAL =
  ItemAllTheModifierTypes.weaponLIGHTNING;
ItemAllTheModifierTypes.weaponCRIT = 5;
ItemAllTheModifierTypes.weaponAS = 1.89;
ItemAllTheModifierTypes.weaponRELOAD = 0.93;
ItemAllTheModifierTypes.itemLevel = 80;
ItemAllTheModifierTypes.requires = {
  level: 78,
  str: 89,
  dex: 89,
  int: 0,
};

ItemAllTheModifierTypes.info.refName = "Gemini Crossbow";
ItemAllTheModifierTypes.sectionCount = 11;
ItemAllTheModifierTypes.implicitCount = 1;
ItemAllTheModifierTypes.enchantCount = 1;
ItemAllTheModifierTypes.skillCount = 1;
ItemAllTheModifierTypes.prefixCount = 3;
ItemAllTheModifierTypes.suffixCount = 3;
ItemAllTheModifierTypes.augmentSockets = {
  empty: 0,
  current: 2,
  normal: 2,
};
ItemAllTheModifierTypes.isCorrupted = true;
ItemAllTheModifierTypes.isFractured = true;

// #endregion ItemAllTheModifierTypes

// #region SpectreIncSpirit
export const SpectreIncSpirit = new TestItem(`Item Class: Sceptres
Rarity: Rare
Skull Song
Shrine Sceptre
--------
Spirit: 152 (augmented)
--------
Requires: Level 72, 39 Str, 98 Int
--------
Sockets: S
--------
Item Level: 79
--------
Grants Skill: Level 17 Purity of Lightning
--------
{ Prefix Modifier "Duke's" (Tier: 3) }
52(51-55)% increased Spirit
{ Prefix Modifier "Arcing" (Tier: 4) — Damage, Elemental, Lightning, Attack }
Allies in your Presence deal 2(1-2) to 34(33-40) added Attack Lightning Damage
{ Prefix Modifier "Opalescent" (Tier: 5) — Mana }
+83(80-89) to maximum Mana
{ Suffix Modifier "of Excitement" (Tier: 6) — Mana }
18(10-19)% increased Mana Regeneration Rate
{ Suffix Modifier "of the Tutor" (Tier: 5) — Life, Minion }
Minions have 28(26-30)% increased maximum Life
{ Suffix Modifier "of the Sage" (Tier: 3) — Attribute }
+27(25-27) to Intelligence
`);

SpectreIncSpirit.category = ItemCategory.Sceptre;
SpectreIncSpirit.rarity = ItemRarity.Rare;
SpectreIncSpirit.itemLevel = 79;
SpectreIncSpirit.weaponSPIRIT = 152;
SpectreIncSpirit.requires = {
  level: 72,
  str: 39,
  dex: 0,
  int: 98,
};

SpectreIncSpirit.info.refName = "Shrine Sceptre";
SpectreIncSpirit.sectionCount = 7;
SpectreIncSpirit.prefixCount = 3;
SpectreIncSpirit.suffixCount = 3;
SpectreIncSpirit.skillCount = 1;
SpectreIncSpirit.augmentSockets = {
  empty: 0,
  current: 1,
  normal: 1,
};

// #endregion SpectreIncSpirit

// #region UnidentifiedBase
export const UnidentifiedBase = new TestItem(`Item Class: Wands
Rarity: Rare
Volatile Wand
--------
Requires: 113 Intelligence
--------
Item Level: 69
--------
Grants Skill: Level 15 Volatile Dead
--------
Unidentified
`);

UnidentifiedBase.category = ItemCategory.Wand;
UnidentifiedBase.rarity = ItemRarity.Rare;
UnidentifiedBase.itemLevel = 69;
UnidentifiedBase.requires = {
  level: 0,
  str: 0,
  dex: 0,
  int: 113,
};

UnidentifiedBase.info.refName = "Volatile Wand";
UnidentifiedBase.sectionCount = 5;
UnidentifiedBase.skillCount = 1;
UnidentifiedBase.isUnidentified = true;

// #endregion UnidentifiedBase

// #region UnidentifiedTier
export const UnidentifiedTier = new TestItem(`Item Class: Rings
Rarity: Magic
Sapphire Ring
--------
Item Level: 54
--------
{ Implicit Modifier — Elemental, Cold, Resistance }
+23(20-30)% to Cold Resistance
--------
Unidentified (Tier 4)
`);

UnidentifiedTier.category = ItemCategory.Ring;
UnidentifiedTier.rarity = ItemRarity.Magic;
UnidentifiedTier.itemLevel = 54;

UnidentifiedTier.info.refName = "Volatile Wand";
UnidentifiedTier.sectionCount = 4;
UnidentifiedTier.implicitCount = 1;
UnidentifiedTier.isUnidentified = true;
UnidentifiedTier.unidentifiedTier = 4;

// #endregion UnidentifiedTier
