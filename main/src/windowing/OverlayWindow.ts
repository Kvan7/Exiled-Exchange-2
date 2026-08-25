import path from "path";
import { BrowserWindow, dialog, shell, Menu, screen } from "electron";
import {
  OverlayController,
  OVERLAY_WINDOW_OPTS,
} from "electron-overlay-window";
import type { ServerEvents } from "../server";
import type { Logger } from "../RemoteLogger";
import type { GameWindow } from "./GameWindow";

export class OverlayWindow {
  public isInteractable = false;
  public wasUsedRecently = true;
  private window?: BrowserWindow;
  private overlayKey: string = "Shift + Space";
  private isOverlayKeyUsed = false;
  private lastToggleAt = 0;
  private wasExplicitlyHidden = false;
  private waylandBlurHandlerInstalled = false;
  private appPagePort?: number;
  private windowTitle = "";

  constructor(
    private server: ServerEvents,
    private logger: Logger,
    private poeWindow: GameWindow,
  ) {
    this.server.onEventAnyClient("OVERLAY->MAIN::focus-game", () => {
      this.isOverlayKeyUsed = true;
      this.assertGameActive();
    });
    this.poeWindow.on("active-change", this.handlePoeWindowActiveChange);
    this.poeWindow.onAttach(this.handleOverlayAttached);

    this.server.onEventAnyClient("CLIENT->MAIN::used-recently", (e) => {
      this.wasUsedRecently = e.isOverlay;
    });

    if (process.argv.includes("--no-overlay")) return;

    this.createWindow();
  }

  private createWindow() {
    if (this.window && !this.window.isDestroyed()) return;

    const waylandBounds = isWayland()
      ? screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).bounds
      : undefined;

    this.waylandBlurHandlerInstalled = false;
    this.window = new BrowserWindow({
      icon: path.join(__dirname, process.env.STATIC!, "icon.png"),
      // On Wayland, OVERLAY_WINDOW_OPTS sets X11-specific window type hints
      // that electron-overlay-window uses for game window attachment. Those
      // hints are meaningless on Wayland and can prevent the window from
      // rendering correctly. We use plain transparent window options instead
      // and manage show/hide manually via the evdev hotkey backend.
      ...(isWayland()
        ? {
            frame: false,
            show: false,
            transparent: true,
            resizable: false,
            fullscreenable: true,
            skipTaskbar: true,
            hasShadow: false,
            alwaysOnTop: true,
            focusable: true,
            backgroundColor: "#00000000",
            x: waylandBounds!.x,
            y: waylandBounds!.y,
            width: waylandBounds!.width,
            height: waylandBounds!.height,
          }
        : OVERLAY_WINDOW_OPTS),
      ...(waylandBounds ? {} : { width: 800, height: 600 }),
      webPreferences: {
        allowRunningInsecureContent: false,
        webviewTag: true,
        spellcheck: false,
      },
    });

    if (waylandBounds) {
      this.window.setBounds(waylandBounds);
      // Set once at creation; never toggled during show/hide to avoid the
      // compositor treating each SetZOrderLevel call as an activation event.
      // The level string ("screen-saver" etc.) is macOS/Windows-only and is
      // silently ignored on Linux — all truthy levels map to kFloatingWindow.
      this.window.setAlwaysOnTop(true);
      // visibleOnFullScreen option is macOS-only and ignored on Linux.
      this.window.setVisibleOnAllWorkspaces(true);
    }

    this.window.setMenu(
      Menu.buildFromTemplate([
        { role: "editMenu" },
        { role: "reload" },
        { role: "toggleDevTools" },
      ]),
    );

    this.window.webContents.on("before-input-event", this.handleExtraCommands);
    this.window.webContents.on(
      "console-message",
      (_event, level, message, line, sourceId) => {
        const source = sourceId ? ` ${sourceId}:${line}` : "";
        this.logger.write(`debug [Renderer:${level}]${source} ${message}`);
        console.log(`[Renderer:${level}]${source} ${message}`);
      },
    );
    this.window.webContents.on(
      "did-attach-webview",
      (_, webviewWebContents) => {
        webviewWebContents.on("before-input-event", this.handleExtraCommands);
        webviewWebContents.on(
          "console-message",
          (_event, level, message, line, sourceId) => {
            const source = sourceId ? ` ${sourceId}:${line}` : "";
            this.logger.write(`debug [WebView:${level}]${source} ${message}`);
            console.log(`[WebView:${level}]${source} ${message}`);
          },
        );
      },
    );

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    this.installWaylandBlurHandler();
    if (this.windowTitle) {
      this.poeWindow.attach(this.window, this.windowTitle);
    }

    if (this.appPagePort !== undefined) {
      this.loadAppPage(this.appPagePort);
    }
  }

  loadAppPage(port: number) {
    this.appPagePort = port;
    const url =
      process.env.VITE_DEV_SERVER_URL || `http://localhost:${port}/index.html`;

    if (!this.window) {
      shell.openExternal(url);
      return;
    }

    if (process.env.VITE_DEV_SERVER_URL) {
      this.window.loadURL(url);
      this.window.webContents.openDevTools({ mode: "detach", activate: false });
    } else {
      this.window.loadURL(url);
    }
  }

  assertOverlayActive = (opts: { force?: boolean } = {}) => {
    if (isWayland() && this.wasExplicitlyHidden && !opts.force) return;

    if (!this.isInteractable || (isWayland() && !this.window?.isVisible())) {
      this.wasExplicitlyHidden = false;
      this.isInteractable = true;
      if (isWayland()) {
        const display = screen.getDisplayNearestPoint(
          screen.getCursorScreenPoint(),
        );
        this.window?.setBounds(display.bounds);
        if (this.window?.isMinimized()) {
          this.window.restore();
        }
        // show() maps the surface. focus() (Activate via xdg_activation_v1)
        // is intentionally omitted: when PoE2 is fullscreen it either fights
        // the activation request or KWin denies it. Either way the overlay
        // should appear without fighting for keyboard focus.
        // showInactive() is officially unsupported on Wayland so we use show().
        // setIgnoreMouseEvents() is a no-op on Wayland (no Electron code path).
        this.window?.show();
        this.poeWindow.isActive = false;
        this.emitFocusChange();
        return;
      }
      OverlayController.activateOverlay();
      this.poeWindow.isActive = false;
    }
  };

  assertGameActive = () => {
    if (this.isInteractable) {
      this.isInteractable = false;
      if (isWayland()) {
        this.wasExplicitlyHidden = true;
        // hide() unmaps the Wayland surface, returning focus to the compositor's
        // previous active window (the game). setIgnoreMouseEvents() is a no-op
        // on Wayland so hide() is the only input suppression available.
        this.window?.hide();
        this.poeWindow.isActive = true;
        this.emitFocusChange();
        return;
      }
      OverlayController.focusTarget();
      this.poeWindow.isActive = true;
    }
  };

  toggleActiveState = () => {
    const now = Date.now();
    if (now - this.lastToggleAt < 250) return;
    this.lastToggleAt = now;

    this.isOverlayKeyUsed = true;
    if (isWayland() && this.wasExplicitlyHidden) {
      this.assertOverlayActive({ force: true });
    } else if (this.isInteractable) {
      this.assertGameActive();
    } else {
      this.assertOverlayActive({ force: true });
    }
  };

  suppressNextDeactivate() {
    if (!isWayland() || !this.isInteractable) return;
    this.window?.show();
  }

  updateOpts(overlayKey: string, windowTitle: string) {
    this.overlayKey = overlayKey;
    this.windowTitle = windowTitle;
    this.poeWindow.attach(this.window, this.windowTitle);
    this.installWaylandBlurHandler();
  }

  private installWaylandBlurHandler() {
    if (!isWayland() || !this.window || this.waylandBlurHandlerInstalled)
      return;

    this.waylandBlurHandlerInstalled = true;
    this.window.on("blur", () => {
      if (!this.isInteractable) return;
      this.isOverlayKeyUsed = true;
      this.assertGameActive();
    });
  }

  private handleExtraCommands = (
    event: Electron.Event,
    input: Electron.Input,
  ) => {
    if (input.type !== "keyDown") return;

    let { code, control: ctrlKey, shift: shiftKey, alt: altKey } = input;

    if (code.startsWith("Key")) {
      code = code.slice("Key".length);
    } else if (code.startsWith("Digit")) {
      code = code.slice("Digit".length);
    }

    if (shiftKey && altKey) code = `Shift + Alt + ${code}`;
    else if (ctrlKey && shiftKey) code = `Ctrl + Shift + ${code}`;
    else if (ctrlKey && altKey) code = `Ctrl + Alt + ${code}`;
    else if (altKey) code = `Alt + ${code}`;
    else if (ctrlKey) code = `Ctrl + ${code}`;
    else if (shiftKey) code = `Shift + ${code}`;

    switch (code) {
      case "Escape":
      case "Ctrl + W": {
        event.preventDefault();
        this.server.sendEventTo("broadcast", {
          name: "MAIN->OVERLAY::hide-exclusive-widget",
          payload: undefined,
        });
        process.nextTick(this.assertGameActive);
        break;
      }
      case this.overlayKey: {
        event.preventDefault();
        process.nextTick(this.toggleActiveState);
        break;
      }
    }
  };

  private handleOverlayAttached = (hasAccess?: boolean) => {
    if (hasAccess === false) {
      this.logger.write(
        "error [Overlay] PoE2 is running with administrator rights",
      );

      dialog.showErrorBox(
        "PoE2 window - No access",
        // ----------------------
        "Path of Exile 2 is running with administrator rights.\n" +
          "\n" +
          "You need to restart Exiled Exchange 2 with administrator rights.",
      );
    } else {
      this.server.sendEventTo("broadcast", {
        name: "MAIN->OVERLAY::overlay-attached",
        payload: undefined,
      });
    }
  };

  private handlePoeWindowActiveChange = (isActive: boolean) => {
    if (isWayland()) return;

    if (isActive && this.isInteractable) {
      this.isInteractable = false;
    }
    this.emitFocusChange(isActive);
  };

  private emitFocusChange(isActive = this.poeWindow.isActive) {
    this.server.sendEventTo("broadcast", {
      name: "MAIN->OVERLAY::focus-change",
      payload: {
        game: isActive,
        overlay: this.isInteractable,
        usingHotkey: this.isOverlayKeyUsed,
        isWayland: isWayland(),
      },
    });
    this.isOverlayKeyUsed = false;
  }
}

function isWayland(): boolean {
  return (
    process.platform === "linux" &&
    (process.env.XDG_SESSION_TYPE === "wayland" ||
      Boolean(process.env.WAYLAND_DISPLAY))
  );
}
