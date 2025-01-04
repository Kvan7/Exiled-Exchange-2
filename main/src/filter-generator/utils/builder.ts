import { type IFilter, type IFilterIdentifiers, type IFilterModifiers } from "../data/IFilter";

const header = `
##########################################
# PoE2 Loot Filter
# for Zulieros guild by tmakuch
# Based on filter by CYBERION
# Filter v0.1 - 2025/01/02
##########################################
`.trim();

const knownOperators = ["=", "!", "!=", "<=", ">=", "<", ">", "=="];

export default function getFiltersContent(filters: Array<IFilter>) {
  return [header, ...filters.map(mapSingleFilter)].join("\n\n");
};

function mapSingleFilter(filter: IFilter) {
  const lines = [`${filter.hide ? "Hide" : "Show"} # ${filter.name}`];

  if (filter.identifiers) {
    (Object.entries(filter.identifiers) as Array<[string, IFilterIdentifiers[string]]>)
      .map(mapIdentifiersEntries)
      .forEach((line: string) => lines.push("\t" + line));
  }

  if (filter.modifiers) {
    (Object.entries(filter.modifiers) as Array<[string, IFilterModifiers[string]]>)
      .map(mapModifiersEntries)
      .forEach((line: string) => lines.push("\t" + line));
  }
  if (filter.continue) {
    lines.push("\tContinue");
  }

  return lines.join("\n");
}

function mapIdentifiersEntries([key, value]: [string, string | Array<string>]): string {
  let safeValue = value;
  if (safeValue instanceof Array) {
    safeValue = safeValue.map((value) => `"${value}"`).join(" ");
  } else if (
    !knownOperators.some((ko) => (safeValue as string).startsWith(ko))
  ) {
    safeValue = `"${safeValue}"`;
  }
  return key + " " + safeValue;
}

function mapModifiersEntries([key, value]: [string, string | number]): string {
  return key + " " + value;
}
