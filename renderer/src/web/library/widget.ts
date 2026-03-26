import { Anchor, Widget } from "../overlay/widgets";

export interface LibraryWidget extends Widget {
  anchor: Anchor;
  logItemKey: string | null;
}
