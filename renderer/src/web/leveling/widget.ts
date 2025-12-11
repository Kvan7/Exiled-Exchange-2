import { Anchor, Widget } from "../overlay/widgets";

export interface LevelingWidget extends Widget {
  anchor: Anchor;
  showExp: boolean;
}
