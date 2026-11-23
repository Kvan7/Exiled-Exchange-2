function decimalPlaces(value: number, dp: number | boolean): number {
  if (typeof dp === "number") {
    return dp;
  } else if (!dp || Math.abs(value) >= 10) {
    return 0;
  } else {
    return Math.abs(value) < 2.3 ? 2 : 1;
  }
}

export function roundRoll(value: number, dp: boolean) {
  const rounding = Math.pow(10, decimalPlaces(value, dp));
  return Math.trunc(value * rounding) / rounding;
}

/**
 * Modifies the roll value in a direction based on percentages.
 * Does Value +- a percent of the value, then floor/ceil to the decimal places specified
 * @param value number for the roll
 * @param percent Whole number percent to multiply value by, also pos/neg 0
 * @param method floor/ceiling
 * @param dp decimal points to keep, false=none, true=auto, number=exact
 * @returns modified value
 */
export function percentRoll(
  value: number,
  percent: number,
  method: Math["floor"] | Math["ceil"],
  dp: number | boolean = false,
): number {
  const res = value + (Math.abs(value) * percent) / 100;
  const rounding = Math.pow(10, decimalPlaces(value, dp));
  return method((res + Number.EPSILON) * rounding) / rounding;
}

/**
 * Modifies the roll value in a direction based on percentages.
 * Does Value +- a percent of the DELTA, then floor/ceil to the decimal places specified
 * @param value number for the roll
 * @param delta number to take the percentage of
 * @param percent Whole number percent to multiply value by, also pos/neg 0
 * @param method floor/ceiling
 * @param dp decimal points to keep, false=none, true=auto, number=exact
 * @returns modified value
 */
export function percentRollDelta(
  value: number,
  delta: number,
  p: number,
  method: Math["floor"] | Math["ceil"],
  dp: number | boolean = false,
): number {
  const res = value + (delta * p) / 100;
  const rounding = Math.pow(10, decimalPlaces(value, dp));
  return method((res + Number.EPSILON) * rounding) / rounding;
}
