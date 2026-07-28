import { Anchor, Widget } from "../overlay/widgets";

export interface XpWidget extends Widget {
  anchor: Anchor;
  showExp: boolean;
}
