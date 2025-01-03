import { stat } from "@/assets/data";

export const DAMAGE_STATS = {
  PHYSICAL_DAMAGE: {
    flat: [stat("Adds # to # Physical Damage")],
    incr: [stat("#% increased Physical Damage")],
  },
  ATTACK_SPEED: {
    incr: [stat("#% increased Attack Speed")],
  },
  CRITICAL_STRIKE_CHANCE: {
    incr: [stat("#% increased Critical Strike Chance")],
  },
  CRITICAL_STRIKE_MULTIPLIER: {
    incr: [stat("#% increased Critical Strike Multiplier")],
  },
};
