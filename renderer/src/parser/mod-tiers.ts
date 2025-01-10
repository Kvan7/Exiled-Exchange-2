import { Stat, StatTier, StatTierMod } from "@/assets/data";
import { ItemCategory } from "./meta";
import { ModifierType } from "./modifiers";

function mapItemCategoryToKeys(itemCategory: ItemCategory): string[] {
  const categoryMap: Record<ItemCategory, string[]> = {
    [ItemCategory.OneHandedSword]: ["sword", "one_hand_weapon"],
    [ItemCategory.TwoHandedSword]: ["sword", "two_hand_weapon"],
    [ItemCategory.Staff]: ["staff"],
    [ItemCategory.Ring]: ["ring"],
    [ItemCategory.Quiver]: ["quiver"],
    [ItemCategory.Map]: [""],
    [ItemCategory.CapturedBeast]: [""],
    [ItemCategory.MetamorphSample]: [""],
    [ItemCategory.Helmet]: ["helmet"],
    [ItemCategory.BodyArmour]: ["body_armour"],
    [ItemCategory.Gloves]: ["gloves"],
    [ItemCategory.Boots]: ["boots"],
    [ItemCategory.Shield]: ["shield"],
    [ItemCategory.Amulet]: ["amulet"],
    [ItemCategory.Belt]: ["belt"],
    [ItemCategory.Flask]: ["flask"],
    [ItemCategory.AbyssJewel]: ["jewel"],
    [ItemCategory.Jewel]: ["jewel"],
    [ItemCategory.Claw]: ["claw"],
    [ItemCategory.Bow]: ["bow"],
    [ItemCategory.Sceptre]: ["sceptre"],
    [ItemCategory.Wand]: ["wand"],
    [ItemCategory.FishingRod]: [""],
    [ItemCategory.Warstaff]: ["warstaff"],
    [ItemCategory.Dagger]: ["dagger"],
    [ItemCategory.RuneDagger]: ["rune_dagger"],
    [ItemCategory.OneHandedAxe]: ["axe", "one_hand_weapon"],
    [ItemCategory.TwoHandedAxe]: ["axe", "two_hand_weapon"],
    [ItemCategory.OneHandedMace]: ["mace", "one_hand_weapon"],
    [ItemCategory.TwoHandedMace]: ["mace", "two_hand_weapon"],
    [ItemCategory.ClusterJewel]: ["jewel"],
    [ItemCategory.HeistBlueprint]: [""],
    [ItemCategory.HeistContract]: [""],
    [ItemCategory.HeistTool]: [""],
    [ItemCategory.HeistBrooch]: [""],
    [ItemCategory.HeistGear]: [""],
    [ItemCategory.HeistCloak]: [""],
    [ItemCategory.Trinket]: [""],
    [ItemCategory.Invitation]: [""],
    [ItemCategory.Gem]: ["gem"],
    [ItemCategory.Currency]: [""],
    [ItemCategory.DivinationCard]: [""],
    [ItemCategory.Voidstone]: [""],
    [ItemCategory.Sentinel]: [""],
    [ItemCategory.MemoryLine]: [""],
    [ItemCategory.SanctumRelic]: [""],
    [ItemCategory.Tincture]: [""],
    [ItemCategory.Charm]: [""],
    [ItemCategory.Crossbow]: ["crossbow"],
    [ItemCategory.SkillGem]: [""],
    [ItemCategory.SupportGem]: [""],
    [ItemCategory.MetaGem]: [""],
    [ItemCategory.Focus]: [""],
  };

  return categoryMap[itemCategory] || [itemCategory.toLowerCase()];
}

export function getModTier(
  values: Array<
    Pick<
      {
        roll: number;
        rollStr: string;
        decimal: boolean;
        bounds?: {
          min: number;
          max: number;
        };
      },
      "roll" | "bounds" | "decimal"
    >
  >,
  found: Stat["tiers"],
  itemCategory: ItemCategory,
  modType: ModifierType,
): StatTierMod {
  if (!found)
    throw new Error("Expected stat to have tiers, but none were found");

  if (modType in found) {
    const tier = found[modType as keyof Stat["tiers"]];

    // Normalize to an array of StatTierMod
    const tierArray: StatTierMod[] = Array.isArray(tier)
      ? tier
      : Object.values(tier);

    // Map ItemCategory to the corresponding items keys
    const categoryKeys = mapItemCategoryToKeys(itemCategory);

    let categoryMatch = tierArray.find((mod) =>
      categoryKeys.every((key) => mod.items[key] !== undefined),
    );

    if (!categoryMatch) {
      // If no match for all keys, try matching any of the category keys
      categoryMatch = tierArray.find((mod) =>
        categoryKeys.some((key) => mod.items[key] !== undefined),
      );
    }

    if (categoryMatch) {
      const tierMatch = categoryMatch.mods.find((t) =>
        values.every((stat, index) => {
          const tierBounds = t.values[index];
          return (
            tierBounds &&
            tierBounds[0] <= stat.roll &&
            stat.roll <= tierBounds[1]
          );
        }),
      );

      if (tierMatch) {
        // Set bounds for each stat from the matched tier
        values.forEach((stat, index) => {
          const tierBounds = tierMatch.values[index];
          if (tierBounds) {
            stat.bounds = {
              min: tierBounds[0],
              max: tierBounds[1],
            };
          }
        });
        return categoryMatch;
      }
    }

    // Fallback: Search through all StatTierMods
    for (const mod of tierArray) {
      const tierMatch = mod.mods.find((t) =>
        values.every((stat, index) => {
          const tierBounds = t.values[index];
          return (
            tierBounds &&
            tierBounds[0] <= stat.roll &&
            stat.roll <= tierBounds[1]
          );
        }),
      );

      if (tierMatch) {
        // Set bounds for each stat from the matched tier
        values.forEach((stat, index) => {
          const tierBounds = tierMatch.values[index];
          if (tierBounds) {
            stat.bounds = {
              min: tierBounds[0],
              max: tierBounds[1],
            };
          }
        });
        return mod;
      }
    }

    // If no match is found, return the first mod tier
    return tierArray[0];
  }

  throw new Error(
    `Expected stat to have tiers for ${modType}, but none were found`,
  );
}
export function getTier(
  values: Array<
    Pick<
      {
        roll: number;
        rollStr: string;
        decimal: boolean;
        bounds?: {
          min: number;
          max: number;
        };
      },
      "roll" | "bounds" | "decimal"
    >
  >,
  mod: StatTierMod,
): StatTier | undefined {
  if (mod === undefined || mod.mods === undefined || !mod.mods) {
    console.warn("No mods found for mod", mod);
    return undefined;
  }
  // Check for an exact match within bounds
  const tierMatch = mod.mods.find((t) =>
    values.every((stat, index) => {
      const tierBounds = t.values[index];
      return (
        tierBounds && tierBounds[0] <= stat.roll && stat.roll <= tierBounds[1]
      );
    }),
  );

  if (tierMatch) {
    return tierMatch;
  }

  // If no match, check if the roll is below the lowest tier
  const lowestTier = mod.mods[0];
  if (
    values.some((stat, index) => {
      const tierBounds = lowestTier.values[index];
      return tierBounds && stat.roll < tierBounds[0];
    })
  ) {
    return lowestTier;
  }

  // If no match, check if the roll is above the highest tier
  const highestTier = mod.mods[mod.mods.length - 1];
  if (
    values.some((stat, index) => {
      const tierBounds = highestTier.values[index];
      return tierBounds && stat.roll > tierBounds[1];
    })
  ) {
    return highestTier;
  }

  // No valid tier found
  return undefined;
}

export function getTierNumber(
  tier: StatTier,
  mod: StatTierMod,
  itemCategory: ItemCategory,
): number {
  if (mod === undefined || mod.mods === undefined || !mod.mods) {
    console.warn("No mods found for mod", mod);
    return -1;
  }

  if (tier === undefined || itemCategory === undefined) {
    console.warn("No tier or itemCategory found");
    return -1;
  }

  // Map the itemCategory to its corresponding key(s)
  const categoryKeys = mapItemCategoryToKeys(itemCategory);

  // Use the first key from the mapped category keys
  const primaryCategoryKey = categoryKeys[0];

  // Check if the category exists in items for any mod
  const categoryExists = mod.mods.some((t) =>
    t.items.includes(primaryCategoryKey),
  );
  if (!categoryExists) {
    return -1; // Return -1 if the category is not found in any mod
  }

  // Find the index of the given tier in mod.mods
  const tierIndex = mod.mods.findIndex((t) => t.id === tier.id);

  if (tierIndex === -1) {
    throw new Error(`Tier not found in mod.mods for tier id: ${tier.id}`);
  }

  // Count the number of tiers after the found tier with the same itemCategory
  const matchingTiersAfter = mod.mods
    .slice(tierIndex + 1)
    .filter((t) => t.items.includes(primaryCategoryKey)).length;

  // Return the tier number (1-based)
  return matchingTiersAfter + 1;
}
