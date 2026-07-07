import type openCv from "@u4/opencv4nodejs";
import type { Mat } from "@u4/opencv4nodejs";
import type { ICvAdapter, ICvMat } from "./ICvAdapter";

export class CppCvAdapter implements ICvAdapter {
  constructor(private _cv: typeof openCv) {}

  async loadImage(input: string | Buffer): Promise<ICvMat> {
    let mat: Mat;
    if (typeof input === "string") {
      mat = this._cv.imread(input, this._cv.IMREAD_UNCHANGED);
    } else {
      mat = this._cv.imdecode(input, this._cv.IMREAD_UNCHANGED);
    }
    return new CppMatAdapter(mat);
  }
}

export class CppMatAdapter implements ICvMat {
  constructor(private _mat: Mat) {}
}
