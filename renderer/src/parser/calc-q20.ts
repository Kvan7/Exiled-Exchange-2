import { ParsedItem } from "./ParsedItem";
import { stat } from "@/assets/data";
import { StatRoll, StatSource, statSourcesTotal } from "./modifiers";

export const QUALITY_STATS = {
  ARMOUR: {
    flat: [stat("# to Armour")],
    incr: [
      stat("#% increased Armour"),
      stat("#% increased Armour and Energy Shield"),
      stat("#% increased Armour and Evasion"),
      stat("#% increased Armour, Evasion and Energy Shield"),
    ],
  },
  EVASION: {
    flat: [stat("# to Evasion Rating")],
    incr: [
      stat("#% increased Evasion Rating"),
      stat("#% increased Armour and Evasion"),
      stat("#% increased Evasion and Energy Shield"),
      stat("#% increased Armour, Evasion and Energy Shield"),
    ],
  },
  ENERGY_SHIELD: {
    flat: [stat("# to maximum Energy Shield")],
    incr: [
      stat("#% increased Energy Shield"),
      stat("#% increased Armour and Energy Shield"),
      stat("#% increased Evasion and Energy Shield"),
      stat("#% increased Armour, Evasion and Energy Shield"),
    ],
  },
  PHYSICAL_DAMAGE: {
    flat: [stat("Adds # to # Physical Damage")],
    incr: [stat("#% increased Physical Damage")],
  },
};
export const OTHER_PSEUDO_STATS = {
  ATTACK_SPEED: {
    flat: [],
    incr: [stat("#% increased Attack Speed")],
  },
};

export function propAt20Quality(
  total: number,
  statRefs: { flat: string[]; incr: string[] },
  item: ParsedItem,
): { roll: StatRoll; sources: StatSource[] } {
  const { incr, flat, sources } = calcPropBase(statRefs, item);
  const base = calcFlat(total, incr.value, item.quality) - flat.value;
  const quality = item.isCorrupted
    ? (item.quality ?? 0)
    : Math.max(20, item.quality ?? 0);
  return {
    roll: {
      value: calcIncreased(base + flat.value, incr.value, quality),
      min: calcIncreased(base + flat.min, incr.min, quality),
      max: calcIncreased(base + flat.max, incr.max, quality),
    },
    sources: sources.map((source) => ({ ...source, contributes: undefined })),
  };
}

export function calcPropBounds(
  total: number,
  statRefs: { flat: string[]; incr: string[] },
  item: ParsedItem,
  inverted: boolean = false,
): { roll: StatRoll; sources: StatSource[] } {
  const { incr, flat, sources } = calcPropBase(statRefs, item);
  const base = calcFlat(total, incr.value, 0, inverted) - flat.value;
  return {
    roll: {
      value: calcIncreased(base + flat.value, incr.value, 0, inverted),
      min: calcIncreased(base + flat.min, incr.min, 0, inverted),
      max: calcIncreased(base + flat.max, incr.max, 0, inverted),
    },
    sources:
      statRefs.incr.length && statRefs.flat.length
        ? sources.map((source) => ({ ...source, contributes: undefined }))
        : statRefs.incr.length
          ? sources.map((source) => ({
              ...source,
              contributes: {
                value: (base * source.contributes!.value) / 100,
                min: (base * source.contributes!.min) / 100,
                max: (base * source.contributes!.max) / 100,
              },
            }))
          : sources,
  };
}

export function calcPropPercentile(
  total: number,
  bounds: [min: number, max: number],
  statRefs: { flat: string[]; incr: string[] },
  item: ParsedItem,
): number {
  const { incr, flat } = calcPropBase(statRefs, item);
  const roll = calcFlat(total, incr.value, item.quality ?? 0) - flat.value;
  const [min, max] = bounds;
  const result = Math.round(((roll - min) / (max - min)) * 100);
  return Math.min(Math.max(result, 0), 100);
}

export function calcPropBase(
  statRefs: { flat: string[]; incr: string[] },
  item: ParsedItem,
) {
  const incr: StatRoll = { value: 0, min: 0, max: 0 };
  const flat: StatRoll = { value: 0, min: 0, max: 0 };
  const sources: StatSource[] = [];

  for (const calc of item.statsByType) {
    let total: StatRoll;
    if (statRefs.flat.includes(calc.stat.ref)) {
      total = flat;
    } else if (statRefs.incr.includes(calc.stat.ref)) {
      total = incr;
    } else {
      continue;
    }
    const roll = statSourcesTotal(calc.sources)!;
    total.value += roll.value;
    total.min += roll.min;
    total.max += roll.max;
    sources.push(...calc.sources);
  }

  return { incr, flat, sources };
}

export function calcFlat(
  total: number,
  incrPct: number,
  morePct: number = 0,
  inverted: boolean = false,
): number {
  if (inverted) {
    return calcIncreased(total, incrPct, morePct);
  }
  return total / (1 + morePct / 100) / (1 + incrPct / 100);
}

export function calcIncreased(
  flat: number,
  incrPct: number,
  morePct: number = 0,
  inverted: boolean = false,
): number {
  if (inverted) {
    return calcFlat(flat, incrPct, morePct);
  }
  return flat * (1 + incrPct / 100) * (1 + morePct / 100);
}
