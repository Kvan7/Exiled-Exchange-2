import { cvWrapper } from "./opencv/cvWrapper";
import type { ICvAdapter } from "./opencv/ICvAdapter";
import type { BoundingBox, ImageData } from "./utils";

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

  async calibrate(screenshot: ImageData): Promise<BoundingBox> {
    throw new Error("Method not implemented.");
  }

  async findRecipeId(
    screenshot: ImageData,
    bbox: BoundingBox,
  ): Promise<RecipeResult> {
    throw new Error("Method not implemented.");
  }
}
