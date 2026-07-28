// import { stat } from "@/assets/data";
import { FilterTag, type StatFilter } from "../interfaces";

export function applyRules(filters: StatFilter[], explicitStats: StatFilter[]) {
  if (filters.some((f) => f.tag === FilterTag.Fractured)) return;
  const asFractured = explicitStats
    .filter((f) => f.tag === FilterTag.Explicit)
    .map((f) => ({ ...f, tag: FilterTag.Fractured }));

  filters.push(...asFractured);
}
