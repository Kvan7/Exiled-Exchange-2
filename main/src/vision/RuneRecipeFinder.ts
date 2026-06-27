import { BoundingBox, ImageData } from "./utils";

interface OcrResult {
  elapsed: number;
}

export class RuneRecipeFinder {
  private constructor(
    private readonly needleMat: any,
    private readonly hsvMin: any,
    private readonly hsvMax: any,
  ) {}

  static create() {
    return new RuneRecipeFinder(0, 0, 0);
  }

  async calibrate(): Promise<BoundingBox> {
    const result = new Promise<BoundingBox>((resolve) => {
      setTimeout(() => {
        resolve({
          x: 102,
          y: 304,
          width: 985,
          height: 81,
        });
      }, 2000);
    });

    return await result;
  }

  async ocrScreenshot(
    screenshot: ImageData,
    bbox: BoundingBox,
  ): Promise<OcrResult> {
    const result = new Promise<OcrResult>((resolve) => {
      setTimeout(() => {
        resolve({ elapsed: bbox.x });
      }, 4000);
    });

    return await result;
  }
}
