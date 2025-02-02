import {type IFilter, type IRawFilter, IRawStyles} from "../data/IFilter";
import { FONT_SIZE, RGBA } from "../data/vars";

const fallbackModifiers = {
  SetTextColor: RGBA.WHITE(150),
  SetBackgroundColor: RGBA.EXALT(150),
  SetBorderColor: RGBA.EXALT(),
};

export default function parseRawFilters(
  rawFilters: Array<IRawFilter>,
  styles: Array<IRawStyles>
): Array<IFilter> {
  const getStyle = getStylesFunction(styles);
  return rawFilters
    .filter((filter: IRawFilter) => {
      const identifiersCount = filter.identifiers.filter(
        (identifier: IRawFilter["identifiers"][number]) => {
          return identifier.key.length > 0 && identifier.value.length > 0;
        }
      ).length;

      //filter out empty raw filters (with no specified or not full identifiers)
      return identifiersCount > 0;
    })
    .map((filter: IRawFilter) => ({
      name: filter.name,
      identifiers: filter.identifiers.reduce(
        (result, next: { key: string; value: string }) => {
          //filter empty or not full identifiers
          if (next.key.length > 0 && next.value.length > 0) {
            result[next.key] = next.value.includes(",")
              ? next.value.split(",")
              : next.value;
          }
          return result;
        },
        {} as Record<string, string | Array<string>>
      ),
      hide: filter.action === "hide",
      modifiers:
        filter.action !== "hide" ? getStyle(filter.action) : undefined,
    }));
}

function getStylesFunction(allStyles: Array<IRawStyles>) {
  return (styleName: string) => {
    const style = allStyles.find(_ => _.name === styleName);
    if (!style) {
      return fallbackModifiers;
    }

    return Object.values(style.rules).reduce((result, next) => {
      result[next.key] = next.value;
      return result;
    }, {} as Record<string, string>)
  }
}