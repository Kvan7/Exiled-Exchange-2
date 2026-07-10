import type { Logger } from "../RemoteLogger";
import type { ServerEvents } from "../server";
import type { GameWindow } from "../windowing/GameWindow";
import { visionConfig } from "./config";
import { RuneRecipeFinder } from "./RuneRecipeFinder";
import type { CalibrationResult } from "./utils";

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
        const imageData = await this.poeWindow.screenshot();
        if (!imageData) {
          this.server.sendEventTo("last-active", {
            name: "MAIN->CLIENT::cv-calibration-result",
            payload: {
              target: "remnants",
              pressTime,
              cvTime: 0,
              data: {
                error: "no image found",
              },
            },
          });
          return;
        }

        visionConfig.debug = e.debug;

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
    calibration: {
      bbox: {
        x: number | null;
        y: number | null;
        width: number | null;
        height: number | null;
      };
      scale: number | null;
    },
    debug?: boolean,
  ) {
    const screenshot = await this.poeWindow.screenshot();
    if (!screenshot) {
      this.logger.write("info [CvWorker] No screenshot found");
      return {
        elapsed: 0,
        data: {
          error: "no screenshot found",
        },
      };
    }
    const image = {
      width: this.poeWindow.bounds.width,
      height: this.poeWindow.bounds.height,
      data: screenshot,
    };

    visionConfig.debug = debug;
    if (
      calibration.bbox.x === null ||
      calibration.bbox.y === null ||
      calibration.bbox.width === null ||
      calibration.bbox.height === null
    ) {
      this.logger.write("info [CvWorker] Bounding box Calibrating");

      calibration = await this.runeFinder.calibrate(image);
      this.logger.write(
        `info [CvWorker] Bounding box calibrated to (${calibration.bbox.x}, ${calibration.bbox.y}), (${calibration.bbox.width}, ${calibration.bbox.height}), scale: ${calibration.scale}`,
      );
    }

    const result = await this.runeFinder.findRecipeId(
      image,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- cast is safe, checked if any null above
      calibration as CalibrationResult,
    );
    return result;
  }

  async doTest(num: number): Promise<number> {
    console.log("doTest - taking screenshot");
    const img = await this.poeWindow.screenshot();
    return await this.runeFinder.doTest(num, {
      width: 3840,
      height: 2108,
      data: img!,
    });
  }
}
