import { cvWrapper } from "./opencv/cvWrapper";
import type { ICvAdapter } from "./opencv/ICvAdapter";
import type { CalibrationResult, ImageData } from "./utils";

interface RecipeResult {
  elapsed: number;
  data: {
    highlightedTome: string;
    highlightedSlot: number;
    tomeCount: number;
  };
}

export class RuneRecipeFinder {
  private cv: ICvAdapter;

  private constructor() {
    this.cv = cvWrapper.cv;
  }

  static create() {
    return new RuneRecipeFinder();
  }

  async calibrate(screenshot: ImageData): Promise<CalibrationResult> {
    return await this.cv.calibrate(screenshot);
  }

  async findRecipeId(
    screenshot: ImageData,
    calibration: CalibrationResult,
  ): Promise<RecipeResult> {
    const start = performance.now();
    const res = await this.cv.findRecipeId(screenshot, calibration);
    const elapsed = performance.now() - start;
    return { elapsed, data: res };
  }
}
