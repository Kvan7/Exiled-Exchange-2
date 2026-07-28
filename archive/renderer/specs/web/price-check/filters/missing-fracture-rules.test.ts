import { FilterTag } from "@/web/price-check/filters/interfaces";
import { applyRules as applyMissingFracturedRules } from "@/web/price-check/filters/pseudo/missing-fractured-rules";
import { describe, expect, it } from "vitest";

describe("applyMissingFracturedRules", () => {
  it("Should do nothing if item is not fractured", () => {
    const filters = [
      {
        tradeId: [],
        statRef: "",
        text: "",
        tag: FilterTag.Explicit,
        sources: [],
        disabled: false,
      },
    ];
    applyMissingFracturedRules(filters, filters);

    expect(filters).toEqual(JSON.parse(JSON.stringify(filters)));
  });

  it("Should do nothing if fractured and a modifier is fractured", () => {
    const filters = [
      {
        tradeId: [],
        statRef: "",
        text: "",
        tag: FilterTag.Fractured,
        sources: [],
        disabled: false,
      },
    ];

    const explicitFilters = [
      {
        tradeId: [],
        statRef: "",
        text: "",
        tag: FilterTag.Explicit,
        sources: [],
        disabled: false,
      },
    ];
    applyMissingFracturedRules(filters, explicitFilters);

    expect(filters).toEqual(JSON.parse(JSON.stringify(filters)));
  });

  it("Should do nothing if fractured and item has some fractured mod and non fractured mods", () => {
    const filters = [
      {
        tradeId: [],
        statRef: "",
        text: "",
        tag: FilterTag.Fractured,
        sources: [],
        disabled: false,
      },
      {
        tradeId: [],
        statRef: "",
        text: "",
        tag: FilterTag.Explicit,
        sources: [],
        disabled: false,
      },
    ];
    applyMissingFracturedRules(
      filters,
      filters.filter((f) => f.tag === FilterTag.Explicit),
    );

    expect(filters).toEqual(JSON.parse(JSON.stringify(filters)));
  });

  it("Should append explicit stats, as fractured mods to filters", () => {
    const filters = [
      {
        tradeId: [],
        statRef: "a",
        text: "a",
        tag: FilterTag.Explicit,
        sources: [],
        disabled: false,
      },
      {
        tradeId: [],
        statRef: "b",
        text: "b",
        tag: FilterTag.Explicit,
        sources: [],
        disabled: false,
      },
    ];

    const explicitFilters = [
      {
        tradeId: [],
        statRef: "a",
        text: "a",
        tag: FilterTag.Explicit,
        sources: [],
        disabled: false,
      },
      {
        tradeId: [],
        statRef: "b",
        text: "b",
        tag: FilterTag.Explicit,
        sources: [],
        disabled: false,
      },
    ];
    applyMissingFracturedRules(filters, explicitFilters);

    expect(filters.filter((f) => f.tag === FilterTag.Fractured)).toHaveLength(
      2,
    );
    expect(filters).toHaveLength(4);
  });
});
