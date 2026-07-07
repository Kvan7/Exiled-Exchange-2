import type openCv from "@u4/opencv4nodejs";
import type { Mat } from "@u4/opencv4nodejs";
import type { ICvAdapter } from "./ICvAdapter";
import type { ImageData, BoundingBox } from "../utils";

const ZERO = 0;
const NO_BORDER = ZERO;
const HALF_CIRCLE_DEG = 180;
const UINT8_MAX = 255;
const IDENTITY = 1;

export class CppCvAdapter implements ICvAdapter {
  constructor(private _cv: typeof openCv) {}

  //#region Interface Methods
  async calibrate(screenshot: ImageData): Promise<BoundingBox> {
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
    let mat: Mat;
    if (typeof input === "string") {
      mat = this._cv.imread(input, this._cv.IMREAD_UNCHANGED);
    } else {
      mat = this._cv.imdecode(input, this._cv.IMREAD_UNCHANGED);
    }
    return mat;
  }
  private preprocessImage(
    mat: Mat,
    {
      blur = ZERO,
      hueMin = ZERO,
      hueMax = HALF_CIRCLE_DEG,
      saturationMin = ZERO,
      saturationMax = UINT8_MAX,
      valueMin = ZERO,
      valueMax = UINT8_MAX,
      hueAdd = ZERO,
      saturationAdd = ZERO,
      valueAdd = ZERO,
    }: {
      blur?: number;
      hueMin?: number;
      hueMax?: number;
      saturationMin?: number;
      saturationMax?: number;
      valueMin?: number;
      valueMax?: number;
      hueAdd?: number;
      saturationAdd?: number;
      valueAdd?: number;
    },
  ): Mat {
    const hsv = mat.cvtColor(this._cv.COLOR_BGR2HSV);

    const [h, s, v] = hsv.split();
    const nh = this.shiftChannel(h, hueAdd);
    const ns = this.shiftChannel(s, saturationAdd);
    const nv = this.shiftChannel(v, valueAdd);
    const hsv2 = new this._cv.Mat([nh, ns, nv]);

    const lower = new this._cv.Vec3(hueMin, saturationMin, valueMin);
    const upper = new this._cv.Vec3(hueMax, saturationMax, valueMax);

    const mask = hsv2.inRange(lower, upper);
    const result = new this._cv.Mat(hsv2.rows, hsv2.cols, hsv2.type);
    hsv2.copyTo(result, mask);

    const img2 = result.cvtColor(this._cv.COLOR_HSV2BGR);

    if (blur) {
      img2.gaussianBlur(new this._cv.Size(blur, blur), NO_BORDER);
    }

    return img2;
  }
  private shiftChannel(c: Mat, amount: number) {
    // mat * alpha + beta
    // mat * 1     + amount
    return c.convertTo(this._cv.CV_8UC1, IDENTITY, amount);
  }
  //#endregion Private Methods
}
