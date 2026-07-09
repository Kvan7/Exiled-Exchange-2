import type openCv from "@techstark/opencv-js";
import type { ICvAdapter } from "./ICvAdapter";
import type { ImageData, CalibrationResult } from "../utils";
import { getImage, preprocess } from "./js/image";
import {
  calibrateBBox,
  determineTomeType,
  findHighlightedTome,
} from "./js/detects";
import { filterRecipeRects, getTomePxSize } from "./common";
import { ACTIVE_TOME_FILTER } from "./constants";
import { createBgMask } from "./js/utils";

export class JsCvAdapter implements ICvAdapter {
  constructor(private _cv: typeof openCv) {}

  //#region Interface Methods
  async calibrate(screenshot: ImageData): Promise<CalibrationResult> {
    // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
    console.log("calibrate js");
    const img = await getImage(Buffer.from(screenshot.data));
    try {
      const { scale, recipeBBox } = await calibrateBBox(img);
      return {
        bbox: recipeBBox,
        scale,
      };
    } finally {
      img.delete();
    }
  }
  async findRecipeId(
    screenshot: ImageData,
    calibration: CalibrationResult,
  ): Promise<{
    highlightedTome: string;
    highlightedSlot: number;
    tomeCount: number;
  }> {
    // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
    console.log("findRecipeId js");
    const img = await getImage(Buffer.from(screenshot.data));
    const { bbox, scale } = calibration;
    const firstRecipe = img.roi(
      new this._cv.Rect(bbox.x, bbox.y, bbox.width, bbox.height),
    );
    try {
      const tomeSize = getTomePxSize(scale, img.rows);

      const { highlightedRect, highlightedTomeType } =
        await this.getHighlighted(firstRecipe, tomeSize);

      const normalRects = this.getNormalRects(firstRecipe, tomeSize);

      const recipe = filterRecipeRects(
        [...normalRects, highlightedRect],
        img.rows,
      );

      return {
        highlightedTome: highlightedTomeType,
        highlightedSlot: 1,
        tomeCount: recipe.tomeCount,
      };
    } finally {
      img.delete();
      firstRecipe.delete();
    }
  }
  async testLoaded(num: number): Promise<number> {
    console.log("testLoaded js");
    const box = createBgMask(num);
    console.log(box.rows, box.cols);
    console.log(box.data);

    box.delete();
    return num;
  }
  //#endregion Interface Methods

  //#region Private Methods
  private async getHighlighted(
    firstRecipe: openCv.Mat,
    tomeSize: number,
  ): Promise<{ highlightedRect: openCv.Rect; highlightedTomeType: string }> {
    // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
    const recipeProcessedForHighlight = preprocess(
      firstRecipe,
      ACTIVE_TOME_FILTER,
    ); // deleted

    const highlightedMatch = await findHighlightedTome(
      recipeProcessedForHighlight,
      tomeSize,
    );

    const highlightedTome = recipeProcessedForHighlight.roi(highlightedMatch); // deleted

    const tomeType = await determineTomeType(highlightedTome, tomeSize);

    recipeProcessedForHighlight.delete();
    highlightedTome.delete();

    return {
      highlightedRect: highlightedMatch,
      highlightedTomeType: tomeType,
    };
  }

  private getNormalRects(
    firstRecipe: openCv.Mat,
    tomeSize: number,
  ): openCv.Rect[] {
    // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
    throw new Error("Method not implemented.");
  }
  //#endregion Private Methods
}
