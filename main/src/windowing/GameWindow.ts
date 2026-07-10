import { desktopCapturer, type BrowserWindow } from "electron";
import { EventEmitter } from "node:events";
import { OverlayController, type AttachEvent } from "electron-overlay-window";

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- updating eslint config
export interface GameWindow {
  on: (event: "active-change", listener: (isActive: boolean) => void) => this;
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- updating eslint config
export class GameWindow extends EventEmitter {
  private _isActive = false;
  private _isTracking = false;
  private _title: string | undefined = undefined;

  get bounds() {
    return OverlayController.targetBounds;
  }

  get isActive() {
    return this._isActive;
  }

  set isActive(active: boolean) {
    if (this.isActive !== active) {
      this._isActive = active;
      this.emit("active-change", this._isActive);
    }
  }

  get uiSidebarWidth() {
    // sidebar is 370px at 800x600
    const ratio = 370 / 600;
    return Math.round(this.bounds.height * ratio);
  }

  attach(window: BrowserWindow | undefined, title: string) {
    this._title = title;
    if (!this._isTracking) {
      OverlayController.events.on("focus", () => {
        this.isActive = true;
      });
      OverlayController.events.on("blur", () => {
        this.isActive = false;
      });
      OverlayController.attachByTitle(window, title, {
        hasTitleBarOnMac: true,
      });
      this._isTracking = true;
    }
  }

  onAttach(cb: (hasAccess: boolean | undefined) => void) {
    OverlayController.events.on("attach", (e: AttachEvent) => {
      cb(e.hasAccess);
    });
  }

  async screenshot() {
    if (process.platform === "win32") {
      return OverlayController.screenshot();
    }

    const b = OverlayController.targetBounds;

    console.log(b);

    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: b,
      fetchWindowIcons: false,
    });
    const windowSource = sources.find((s) => s.name === this._title);
    console.log(windowSource);
    console.log(windowSource?.thumbnail.getSize());

    return windowSource?.thumbnail.toBitmap();
  }
}
