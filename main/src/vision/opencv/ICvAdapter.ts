import type { ImageData, CalibrationResult } from "../utils";

export interface ICvAdapter {
  calibrate: (screenshot: ImageData) => Promise<CalibrationResult>;
  findRecipeId: (
    screenshot: ImageData,
    bbox: CalibrationResult,
  ) => Promise<{
    highlightedTome: string;
    highlightedSlot: number;
    tomeCount: number;
  }>;
  testLoaded: (num: number) => Promise<number>;
}
