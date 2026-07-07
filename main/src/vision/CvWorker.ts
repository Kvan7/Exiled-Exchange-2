import type { Logger } from "../RemoteLogger";
import type { ServerEvents } from "../server";
import { RuneRecipeFinder } from "./RuneRecipeFinder";
import type { BoundingBox, ImageData } from "./utils";

export class CvWorker {
  private runeFinder: RuneRecipeFinder;

  constructor(
    private server: ServerEvents,
    private logger: Logger,
  ) {
    this.runeFinder = RuneRecipeFinder.create();

    this.server.onEventAnyClient("CLIENT->MAIN::cv-calibration", async (e) => {
      if (e.target !== "remnants") return;
      const pressTime = Date.now();

      const runeBBox = await this.runeFinder.calibrate();
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
    });
  }

  async findRuneRecipe(
    screenshot: ImageData,
    bbox: {
      x: number | null;
      y: number | null;
      width: number | null;
      height: number | null;
    },
  ) {
    if (
      bbox.x === null ||
      bbox.y === null ||
      bbox.width === null ||
      bbox.height === null
    ) {
      this.logger.write("info [CvWorker] Bounding box Calibrating");

      bbox = await this.runeFinder.calibrate();
      this.logger.write(
        `info [CvWorker] Bounding box calibrated to (${bbox.x}, ${bbox.y}), (${bbox.width}, ${bbox.height})`,
      );
    }

    const result = await this.runeFinder.ocrScreenshot(
      screenshot,
      // cast is safe, checked if any null above
      bbox as BoundingBox,
    );
    return result;
  }
}
