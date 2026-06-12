import { applyIncr } from "./advanced-mod-desc";
import type { Stat, StatMatcher } from "@/assets/data";
import type { ParsedModifier } from "./advanced-mod-desc";
import type { ParsedStat } from "./stat-translations";

export interface StatCalculated {
  stat: Stat;
  type: ModifierType;
  sources: StatSource[];
}

export interface StatSource {
  modifier: ParsedModifier;
  stat: ParsedStat;
  contributes?: StatRoll;
}

export interface StatRoll {
  value: number;
  min: number;
  max: number;
  option?: number;
}

export function sumStatsByModType(
  mods: readonly ParsedModifier[],
): StatCalculated[] {
  const out: StatCalculated[] = [];

  for (const modA of mods) {
    for (const statA of modA.stats) {
      if (
        out.some(
          (merged) =>
            merged.stat.ref === statA.stat.ref &&
            merged.type === modA.info.type &&
            // Multiple allocations should not be merged
            ((statA.stat.ref !== "Allocates #" &&
              statA.stat.ref !== "Legacy of #") ||
              merged.sources.some(
                (src) =>
                  src.stat.translation.string === statA.translation.string,
              )),
        )
      ) {
        continue;
      }

      const sources = mods.reduce(
        (filtered, modB) => {
          if (modB.info.type === modA.info.type) {
            const targetStat = modB.stats.find(
              (statB) =>
                statB.stat.ref === statA.stat.ref &&
                ((statA.stat.ref !== "Allocates #" &&
                  statA.stat.ref !== "Legacy of #") ||
                  statB.translation.string === statA.translation.string),
            );
            if (targetStat) {
              const roll = (applyIncr(modB.info, targetStat) ?? targetStat)
                .roll;
              filtered.push({
                modifier: modB,
                stat: targetStat,
                contributes: roll && {
                  value: roll.value,
                  min: roll.min,
                  max: roll.max,
                  option: roll.option,
                },
              });
            }
          }
          return filtered;
        },
        [] as StatCalculated["sources"],
      );

      out.push({ stat: statA.stat, type: modA.info.type, sources });
    }
  }

  return out;
}

export function statSourcesTotal(
  sources: StatSource[],
  mode: "sum" | "max" | "count" = "sum",
): StatRoll | undefined {
  if (mode === "count") {
    const count = sources.length;
    return {
      value: count,
      min: count,
      max: count,
      option: !count ? undefined : sources[0].contributes?.option,
    };
  }

  const fn =
    mode === "sum"
      ? (a: number, b: number) => a + b
      : (a: number, b: number) => Math.max(a, b);
  return sources.length === 1
    ? sources[0].contributes
    : sources.reduce(
        (sum, { contributes }) => {
          contributes = contributes ?? { value: 1, min: 1, max: 1 };
          sum.value = fn(sum.value, contributes.value);
          sum.min = fn(sum.min, contributes.min);
          sum.max = fn(sum.max, contributes.max);
          sum.option = contributes.option;
          return sum;
        },
        { value: 0, min: 0, max: 0, option: undefined } as StatRoll,
      );
}

// Does actual translation?
export function translateStatWithRoll(
  calc: StatCalculated,
  roll: StatRoll | undefined,
) {
  const { matchers } = calc.stat;
  let translation: StatMatcher | undefined;
  if (!roll) {
    translation = matchers.find((m) => m.value == null) ?? matchers[0];
  } else {
    if (roll.option) {
      translation = matchers.find((m) => m.value === roll.option);
    } else {
      translation = matchers.find((m) => m.value === roll.value);
    }
    if (!translation) {
      // TODO: for some stats reduced is better (m.negate === true)
      const sameSign = Math.sign(roll.min) === Math.sign(roll.max);
      translation = sameSign
        ? matchers.find(
            (m) => m.value == null && Boolean(m.negate) === roll.value < 0,
          )
        : matchers.find((m) => m.value == null && !m.negate);
    }
    if (!translation) {
      translation = matchers.find((m) => m.value == null) ?? {
        string: `BUG_STAT_ID: ${calc.stat.ref}`,
      };
    }
  }

  const dp = roll
    ? calc.stat.dp ||
      calc.sources.some(
        (s) => s.stat.stat.ref === calc.stat.ref && s.stat.roll!.dp,
      )
    : undefined;

  return {
    string: translation.string,
    negate: translation.negate || false,
    dp,
  };
}

export function modsEqual(a: ParsedModifier, b: ParsedModifier) {
  return (
    a.stats.length === b.stats.length &&
    a.info.name === b.info.name &&
    a.info.tier === b.info.tier &&
    a.info.generation === b.info.generation &&
    a.info.type === b.info.type &&
    a.stats.every(
      (statA, i) =>
        statA.stat.ref === b.stats[i].stat.ref &&
        statA.roll?.min === b.stats[i].roll?.min &&
        statA.roll?.max === b.stats[i].roll?.max &&
        statA.roll?.value === b.stats[i].roll?.value,
    )
  );
}

export enum ModifierType {
  Pseudo = "pseudo",
  Explicit = "explicit",
  Implicit = "implicit",
  Crafted = "crafted",
  Enchant = "enchant",
  Scourge = "scourge",
  Necropolis = "necropolis",
  Veiled = "veiled",
  Fractured = "fractured",
  Augment = "rune",
  AddedAugment = "added-rune",
  Sanctum = "sanctum",
  Desecrated = "desecrated",
  Skill = "skill",
}

export const EXPLICIT_MOD_TYPES = new Set([
  ModifierType.Explicit,
  ModifierType.Fractured,
  ModifierType.Veiled,
  ModifierType.Desecrated,
  ModifierType.Crafted,
  ModifierType.Sanctum,
]);
