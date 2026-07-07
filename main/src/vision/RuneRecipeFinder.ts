import { cvWrapper } from "./opencv/cvWrapper";
import type { ICvAdapter } from "./opencv/ICvAdapter";
import type { BoundingBox, ImageData } from "./utils";

interface OcrResult {
  elapsed: number;
  data: {
    highlightedTome: string;
    highlightedSlot: number;
    tomeCount: number;
  };
}

export class RuneRecipeFinder {
  private cv: ICvAdapter;

  private constructor(
    private readonly needleMat: any,
    private readonly hsvMin: any,
    private readonly hsvMax: any,
  ) {
    this.cv = cvWrapper.cv;
  }

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
    throw new Error("Method not implemented.");
  }
}
