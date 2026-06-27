import type { Widget, Anchor } from "../overlay/widgets.js";

export interface ItemSearchWidget extends Widget {
  anchor: Anchor;
  remnantsCvKey: string | null;
  boundingBoxes: {
    remnants: {
      x: number | null;
      y: number | null;
      width: number | null;
      height: number | null;
    };
  };
}
