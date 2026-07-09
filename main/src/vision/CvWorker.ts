import type { Logger } from "../RemoteLogger";
import type { ServerEvents } from "../server";
import type { GameWindow } from "../windowing/GameWindow";
import { RuneRecipeFinder } from "./RuneRecipeFinder";
import type { CalibrationResult, ImageData } from "./utils";

export class CvWorker {
  private runeFinder: RuneRecipeFinder;

  constructor(
    private server: ServerEvents,
    private logger: Logger,
    private poeWindow: GameWindow,
  ) {
    this.runeFinder = RuneRecipeFinder.create();

    this.server.onEventAnyClient("CLIENT->MAIN::cv-calibration", (e) => {
      (async () => {
        if (e.target !== "remnants") return;
        const pressTime = Date.now();
        const imageData = this.poeWindow.screenshot();

        const runeBBox = await this.runeFinder.calibrate({
          width: this.poeWindow.bounds.width,
          height: this.poeWindow.bounds.height,
          data: imageData,
        });

        const cvTime = Date.now() - pressTime;
        this.server.sendEventTo("last-active", {
          name: "MAIN->CLIENT::cv-calibration-result",
          payload: {
            target: "remnants",
            pressTime,
            cvTime,
            data: runeBBox,
          },
        });
      })().catch(console.error);
    });
  }

  async findRuneRecipe(
    screenshot: ImageData,
    calibration: {
      bbox: {
        x: number | null;
        y: number | null;
        width: number | null;
        height: number | null;
      };
      scale: number | null;
    },
  ) {
    if (
      calibration.bbox.x === null ||
      calibration.bbox.y === null ||
      calibration.bbox.width === null ||
      calibration.bbox.height === null
    ) {
      this.logger.write("info [CvWorker] Bounding box Calibrating");

      calibration = await this.runeFinder.calibrate(screenshot);
      this.logger.write(
        `info [CvWorker] Bounding box calibrated to (${calibration.bbox.x}, ${calibration.bbox.y}), (${calibration.bbox.width}, ${calibration.bbox.height}), scale: ${calibration.scale}`,
      );
    }

    const result = await this.runeFinder.findRecipeId(
      screenshot,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- cast is safe, checked if any null above
      calibration as CalibrationResult,
    );
    return result;
  }

  async doTest(num: number): Promise<number> {
    return await this.runeFinder.doTest(num);
  }
}
