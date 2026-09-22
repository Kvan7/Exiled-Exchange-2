import {
  percentRoll,
  percentRollDelta,
  roundRoll,
} from "@/web/price-check/filters/util";
import { describe, expect, it } from "vitest";

describe("price filter roll utilities", () => {
  it.each([
    [12.9, false, 12],
    [-12.9, false, -12],
    [2.39, true, 2.3],
    [2.299, true, 2.29],
    [1.239, true, 1.23],
  ])("rounds %s with dp=%s", (value, dp, expected) => {
    expect(roundRoll(value, dp)).toBe(expected);
  });

  it("applies percentage ranges with configurable rounding", () => {
    expect(percentRoll(100, 10, Math.floor)).toBe(110);
    expect(percentRoll(100, -10, Math.ceil)).toBe(90);
    expect(percentRoll(-100, 10, Math.ceil)).toBe(-90);
    expect(percentRoll(1.234, 10, Math.floor, true)).toBe(1.35);
    expect(percentRoll(2.34, 10, Math.ceil, 2)).toBe(2.58);
  });

  it("applies a percentage to a separate delta", () => {
    expect(percentRollDelta(100, 20, 50, Math.floor)).toBe(110);
    expect(percentRollDelta(100, -20, 50, Math.ceil)).toBe(90);
    expect(percentRollDelta(1.2, 0.5, 10, Math.floor, true)).toBe(1.25);
  });
});
