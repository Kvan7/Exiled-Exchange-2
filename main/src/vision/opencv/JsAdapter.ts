import type openCv from "@techstark/opencv-js";
import type { ICvAdapter } from "./ICvAdapter";
import { loadImage } from "canvas";
import type { Mat } from "@techstark/opencv-js";
import type { ImageData, BoundingBox } from "../utils";

export class JsCvAdapter implements ICvAdapter {
  constructor(private _cv: typeof openCv) {}

  //#region Interface Methods
  async calibrate(screenshot: ImageData): Promise<BoundingBox> {
    const img = this.loadImage(Buffer.from(screenshot.data));
    console.log(img);
    throw new Error("Method not implemented.");
  }
  async findRecipeId(
    screenshot: ImageData,
    bbox: BoundingBox,
  ): Promise<{
    highlightedTome: string;
    highlightedSlot: number;
    tomeCount: number;
  }> {
    throw new Error("Method not implemented.");
  }

  //#endregion Interface Methods
  //#region Private Methods
  private async loadImage(input: string | Buffer): Promise<Mat> {
    const image = await loadImage(input);
    const mat = this._cv.imread(image as unknown as HTMLImageElement);
    return mat;
  }
  //#endregion Private Methods
}
