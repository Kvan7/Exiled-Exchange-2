import { __testExports } from "@/web/item-check/hotkeyable-actions";
import { describe, expect, it } from "vitest";

describe("encodePoe2dbUri", () => {
  it("should encode all spaces", () => {
    const result = __testExports.encodePoe2dbUri("a b c");
    expect(result).toBe("a_b_c");
  });

  it("should remove all single quotes", () => {
    const result = __testExports.encodePoe2dbUri("a'b'c");
    expect(result).toBe("abc");
  });

  it("should do both", () => {
    const result = __testExports.encodePoe2dbUri("a'b c");
    expect(result).toBe("ab_c");
  });

  it("should leave all others unchanged", () => {
    const result = __testExports.encodePoe2dbUri("A/b-cö");
    expect(result).toBe("A/b-cö");
  });
});
