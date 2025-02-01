import type { Widget, Anchor } from "../overlay/widgets.js";

export interface FilterGeneratorWidget extends Widget {
  anchor: Anchor;
  selectedFilterFile: string;
  filtersFolder: string;
  filterStrategy: "before" | "after";
  entries: Array<{
    id: number;
    name: string;
    identifiers: Array<{
      key: string;
      value: string;
    }>;
    action: string;
  }>;
  styles: Array<{
    name: string;
    rules: Array<{
      key: string;
      value: string;
    }>;
  }>;
}
