import type openCv from "@techstark/opencv-js";
import type { ICvAdapter, ICvMat } from "./ICvAdapter";
import { loadImage } from "canvas";

export class JsCvAdapter implements ICvAdapter {
  constructor(private _cv: typeof openCv) {}

  async loadImage(input: string | Buffer): Promise<ICvMat> {
    const image = await loadImage(input);
    const mat = this._cv.imread(image as unknown as HTMLImageElement);
    return new JsMatAdapter(mat);
  }
}

export class JsMatAdapter implements ICvMat {
  constructor(private _mat: any) {}
}
