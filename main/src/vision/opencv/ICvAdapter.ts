import type { BoundingBox, ImageData } from "../utils";

export interface ICvAdapter {
  calibrate: (screenshot: ImageData) => Promise<BoundingBox>;
  findRecipeId: (
    screenshot: ImageData,
    bbox: BoundingBox,
  ) => Promise<{
    highlightedTome: string;
    highlightedSlot: number;
    tomeCount: number;
  }>;
}
