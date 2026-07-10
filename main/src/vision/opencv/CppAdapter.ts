import type openCv from "@u4/opencv4nodejs";
import type { Mat, Rect } from "@u4/opencv4nodejs";
import type { ICvAdapter } from "./ICvAdapter";
import type { ImageData, CalibrationResult } from "../utils";
import {
  calibrateBBox,
  determineTomeType,
  findHighlightedTome,
  getNormalRects,
} from "./cpp/detect";
import { ACTIVE_TOME_FILTER, NORMAL_TOME_FILTER } from "./constants";
import { closestRectPos1, filterRecipeRects, getTomePxSize } from "./common";
import { preprocess } from "./cpp/image";
import { createBgMask } from "./cpp/utils";

export class CppCvAdapter implements ICvAdapter {
  constructor(private _cv: typeof openCv) {}

  //#region Interface Methods
  async calibrate(screenshot: ImageData): Promise<CalibrationResult> {
    const img = await this.loadImage(screenshot);
    const { scale, recipeBBox } = calibrateBBox(img);
    return {
      bbox: recipeBBox,
      scale,
    };
  }
  async findRecipeId(
    screenshot: ImageData,
    calibration: CalibrationResult,
  ): Promise<{
    highlightedTome: string;
    highlightedSlot: number;
    tomeCount: number;
  }> {
    const img = await this.loadImage(screenshot);
    const { bbox, scale } = calibration;
    const tomeSize = getTomePxSize(scale, img.rows);
    const firstRecipe = img.getRegion(
      new this._cv.Rect(bbox.x, bbox.y, bbox.width, bbox.height),
    );
    const { highlightedRect, highlightedTomeType } = this.getHighlighted(
      firstRecipe,
      tomeSize,
    );

    const normalRects = this.getNormalRects(firstRecipe, tomeSize);

    const recipe = filterRecipeRects(
      [...normalRects, highlightedRect],
      img.rows,
    );

    const highlightedSlot = closestRectPos1(
      recipe.realRects,
      highlightedRect.x,
      highlightedRect.y,
    );

    return {
      highlightedTome: highlightedTomeType,
      highlightedSlot,
      tomeCount: recipe.tomeCount,
    };
  }
  async testLoaded(num: number, data?: ImageData): Promise<number> {
    if (data) {
      const img = await this.loadImage(data);
      this._cv.imshow("testLoaded", img);
    }
    const box = createBgMask(num);
    this._cv.imshow("bgMask", box);
    return num;
  }
  //#endregion Interface Methods

  //#region Private Methods
  private async loadImage(input: string | ImageData): Promise<Mat> {
    let mat: Mat;
    if (typeof input === "string") {
      mat = this._cv.imread(input, this._cv.IMREAD_UNCHANGED);
    } else {
      // mat = this._cv.imdecode(input, this._cv.IMREAD_UNCHANGED);
      mat = new this._cv.Mat(
        Buffer.from(input.data),
        input.height,
        input.width,
        this._cv.CV_8UC4,
      );
    }
    return mat;
  }

  private getHighlighted(
    firstRecipe: Mat,
    tomeSize: number,
  ): {
    highlightedRect: Rect;
    highlightedTomeType: string;
  } {
    const recipeProcessedForHighlight = preprocess(
      firstRecipe,
      ACTIVE_TOME_FILTER,
    );

    const highlightedMatch = findHighlightedTome(
      recipeProcessedForHighlight,
      tomeSize,
    );

    const highlightedTome =
      recipeProcessedForHighlight.getRegion(highlightedMatch);

    const tomeType = determineTomeType(highlightedTome, tomeSize);

    return {
      highlightedRect: highlightedMatch,
      highlightedTomeType: tomeType,
    };
  }

  private getNormalRects(firstRecipe: Mat, tomeSize: number) {
    const recipeProcessedForNormal = preprocess(
      firstRecipe,
      NORMAL_TOME_FILTER,
    );
    const normalMatches = getNormalRects(recipeProcessedForNormal, tomeSize);
    return normalMatches;
  }

  //#endregion Private Methods
}
