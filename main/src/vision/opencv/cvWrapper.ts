import cvModule from "@techstark/opencv-js";
import type { ICvAdapter } from "./ICvAdapter";
import { JsCvAdapter } from "./JsAdapter";
import { CppCvAdapter } from "./CppAdapter";
import type openCv from "@u4/opencv4nodejs";

export class CvWrapper {
  private _cv: ICvAdapter | undefined;
  private _testingHardFailCppImportNeverSetThisOutsideOfTests = false;
  private _ready: Promise<void>;

  get ready(): Promise<void> {
    return this._ready;
  }

  get cv(): ICvAdapter {
    if (!this._cv) {
      throw new Error("CvWrapper not ready");
    }
    return this._cv;
  }

  constructor() {
    this._cv = undefined;
    this._ready = this._load();
  }

  async reload(): Promise<void> {
    this._cv = undefined;
    this._ready = this._load();
    await this._ready;
  }

  private async _load() {
    const cpp = await this._tryCpp();
    if (cpp) {
      this._cv = new CppCvAdapter(cpp);
      console.log("Using C++ OpenCV adapter");
      return;
    }
    this._cv = new JsCvAdapter((await this._loadJs()).cv);
    console.log("Using JS OpenCV adapter");
  }

  private async _tryCpp(): Promise<typeof openCv | undefined> {
    try {
      if (this._testingHardFailCppImportNeverSetThisOutsideOfTests) {
        throw new Error("testing");
      }
      return await import("@u4/opencv4nodejs");
    } catch {
      console.log(
        "Failed to load @u4/opencv4nodejs, falling back to @techstark/opencv-js",
      );
      return undefined;
    }
  }

  private async _loadJs(): Promise<{ cv: typeof cvModule }> {
    let cv: typeof cvModule;
    if (cvModule instanceof Promise) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- is of correct type
      cv = await cvModule;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- actually not always true
    } else if (cvModule.Mat) {
      cv = cvModule;
    } else {
      await new Promise<void>((resolve) => {
        cvModule.onRuntimeInitialized = () => {
          resolve();
        };
      });
      cv = cvModule;
    }

    return { cv };
  }
}

export const cvWrapper = new CvWrapper();
