import { uIOhook, UiohookKey, UiohookMouseEvent } from "uiohook-napi";
import type { ServerEvents } from "../server";
import type { GameConfig } from "../host-files/GameConfig";
import type { OverlayWindow } from "./OverlayWindow";

export class OverlayVisibility {
  private timerId: NodeJS.Timeout | undefined;
  private isOverlayVisible = true;
  private isMouseMoveListenerActive = false;

  constructor(
    private server: ServerEvents,
    private overlay: OverlayWindow,
    private gameConfig: GameConfig,
  ) {
    uIOhook.on("keydown", (e) => {
      if (
        e.altKey &&
        !e.shiftKey &&
        !e.ctrlKey &&
        e.keycode === UiohookKey.Alt
      ) {
        this.makeInvisible();
      } else {
        this.makeVisible();
      }
    });

    uIOhook.on("keyup", (e) => {
      if (!e.altKey) {
        this.makeVisible();
      }
    });
  }

  private readonly handleMouseMove = (e: UiohookMouseEvent) => {
    if (!e.altKey) {
      this.makeVisible();
    }
  };

  private makeVisible() {
    this.removeMouseMoveListener();

    if (this.isOverlayVisible && this.timerId === undefined) return;

    if (this.timerId !== undefined) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
    } else {
      this.isOverlayVisible = true;
      this.server.sendEventTo("broadcast", {
        name: "MAIN->OVERLAY::visibility",
        payload: { isVisible: this.isOverlayVisible },
      });
    }
  }

  private makeInvisible() {
    if (!this.isOverlayVisible || this.timerId !== undefined) return;

    this.addMouseMoveListener();
    this.timerId = setTimeout(
      () => {
        this.timerId = undefined;
        this.isOverlayVisible = false;
        this.server.sendEventTo("broadcast", {
          name: "MAIN->OVERLAY::visibility",
          payload: { isVisible: this.isOverlayVisible },
        });
      },
      this.overlay.isInteractable ? 85 : 275,
    );
  }

  private addMouseMoveListener() {
    if (this.isMouseMoveListenerActive) return;

    uIOhook.addListener("mousemove", this.handleMouseMove);
    this.isMouseMoveListenerActive = true;
  }

  private removeMouseMoveListener() {
    if (!this.isMouseMoveListenerActive) return;

    uIOhook.removeListener("mousemove", this.handleMouseMove);
    this.isMouseMoveListenerActive = false;
  }
}
