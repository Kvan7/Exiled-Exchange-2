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
    console.log("calibrate cpp");
    const img = await this.loadImage(Buffer.from(screenshot.data));
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
    console.log("findRecipeId cpp");
    const img = await this.loadImage(Buffer.from(screenshot.data));
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
  async testLoaded(num: number): Promise<number> {
    console.log("testLoaded cpp");
    const box = createBgMask(num);
    this._cv.imshow("bgMask", box);
    return num;
  }
  //#endregion Interface Methods

  //#region Private Methods
  private async loadImage(input: string | Buffer): Promise<Mat> {
    let mat: Mat;
    if (typeof input === "string") {
      mat = this._cv.imread(input, this._cv.IMREAD_UNCHANGED);
    } else {
      mat = this._cv.imdecode(input, this._cv.IMREAD_UNCHANGED);
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
