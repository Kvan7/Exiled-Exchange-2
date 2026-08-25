import { app, screen, globalShortcut } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import {
  LinuxEvdevHelper,
  type LinuxEvdevHelperEvent,
} from "linux-evdev-wayland-helper";
import { uIOhook, UiohookKey, UiohookWheelEvent } from "uiohook-napi";
import {
  isModKey,
  KeyToElectron,
  mergeTwoHotkeys,
} from "../../../ipc/KeyToCode";
import { typeInChat, stashSearch } from "./text-box";
import { WidgetAreaTracker } from "../windowing/WidgetAreaTracker";
import { HostClipboard } from "./HostClipboard";
import { OcrWorker } from "../vision/link-main";
import type { ShortcutAction } from "../../../ipc/types";
import type { Logger } from "../RemoteLogger";
import type { OverlayWindow } from "../windowing/OverlayWindow";
import type { GameWindow } from "../windowing/GameWindow";
import type { GameConfig } from "../host-files/GameConfig";
import type { ServerEvents } from "../server";

type UiohookKeyT = keyof typeof UiohookKey;
const UiohookToName = Object.fromEntries(
  Object.entries(UiohookKey).map(([k, v]) => [v, k]),
);

export class Shortcuts {
  private actions: ShortcutAction[] = [];
  private stashScroll = false;
  private logKeys = false;
  private areaTracker: WidgetAreaTracker;
  private clipboard: HostClipboard;
  private linuxHelper?: LinuxEvdevHelper;
  private linuxHelperRunning = false;
  private linuxHelperHotkeysKey: string | null = null;
  private linuxHelperActions = new Map<string, ShortcutAction>();

  static async create(
    logger: Logger,
    overlay: OverlayWindow,
    poeWindow: GameWindow,
    gameConfig: GameConfig,
    server: ServerEvents,
  ) {
    const ocrWorker = await OcrWorker.create();
    const shortcuts = new Shortcuts(
      logger,
      overlay,
      poeWindow,
      gameConfig,
      server,
      ocrWorker,
    );
    return shortcuts;
  }

  private constructor(
    private logger: Logger,
    private overlay: OverlayWindow,
    private poeWindow: GameWindow,
    private gameConfig: GameConfig,
    private server: ServerEvents,
    private ocrWorker: OcrWorker,
  ) {
    this.areaTracker = new WidgetAreaTracker(server, overlay);
    this.clipboard = new HostClipboard(logger);

    this.poeWindow.on("active-change", (isActive) => {
      process.nextTick(() => {
        if (isActive === this.poeWindow.isActive) {
          if (isActive) {
            this.register();
          } else {
            this.unregister();
          }
        }
      });
    });

    this.server.onEventAnyClient("CLIENT->MAIN::user-action", (e) => {
      if (e.action === "stash-search") {
        stashSearch(e.text, this.clipboard, this.overlay);
      }
    });

    uIOhook.on("keydown", (e) => {
      if (!this.logKeys) return;
      const pressed = eventToString(e);
      this.logger.write(`debug [Shortcuts] Keydown ${pressed}`);
    });
    uIOhook.on("keyup", (e) => {
      if (!this.logKeys) return;
      this.logger.write(
        `debug [Shortcuts] Keyup ${
          UiohookToName[e.keycode] || "not_supported_key"
        }`,
      );
    });

    uIOhook.on("wheel", (e) => {
      if (!e.ctrlKey || !this.poeWindow.isActive || !this.stashScroll) return;

      if (!isStashArea(e, this.poeWindow)) {
        if (e.rotation > 0) {
          uIOhook.keyTap(UiohookKey.ArrowRight);
        } else if (e.rotation < 0) {
          uIOhook.keyTap(UiohookKey.ArrowLeft);
        }
      }
    });
  }

  updateDelay(delay: number) {
    this.clipboard.updateDelay(delay);
  }

  updateActions(
    actions: ShortcutAction[],
    stashScroll: boolean,
    logKeys: boolean,
    restoreClipboard: boolean,
    language: string,
  ) {
    this.stashScroll = stashScroll;
    this.logKeys = logKeys;
    this.clipboard.updateOptions(restoreClipboard);
    this.ocrWorker.updateOptions(language);

    const copyItemShortcut = mergeTwoHotkeys(
      "Ctrl + C",
      this.gameConfig.showModsKey,
    );
    if (copyItemShortcut !== "Ctrl + C") {
      actions.push({
        shortcut: copyItemShortcut,
        action: { type: "test-only" },
      });
    }

    const allShortcuts = new Set([
      "Ctrl + C",
      "Ctrl + V",
      "Ctrl + A",
      "Ctrl + F",
      "Ctrl + Enter",
      "Home",
      "Delete",
      "Enter",
      "ArrowUp",
      "ArrowRight",
      "ArrowLeft",
      copyItemShortcut,
    ]);

    for (const action of actions) {
      if (
        allShortcuts.has(action.shortcut) &&
        action.action.type !== "test-only"
      ) {
        this.logger.write(
          `error [Shortcuts] Hotkey "${action.shortcut}" reserved by the game will not be registered.`,
        );
      }
    }
    actions = actions.filter((action) => !allShortcuts.has(action.shortcut));

    const duplicates = new Set<string>();
    for (const action of actions) {
      if (allShortcuts.has(action.shortcut)) {
        this.logger.write(
          `error [Shortcuts] It is not possible to use the same hotkey "${action.shortcut}" for multiple actions.`,
        );
        duplicates.add(action.shortcut);
      } else {
        allShortcuts.add(action.shortcut);
      }
    }
    this.actions = actions.filter(
      (action) =>
        !duplicates.has(action.shortcut) ||
        action.action.type === "toggle-overlay",
    );
    this.syncLinuxHelper();
    if (this.poeWindow.isActive) {
      this.unregister();
      this.register();
    }
  }

  private register() {
    // On Wayland, globalShortcut uses XGrabKey via XWayland. This double-fires
    // every action already handled by the evdev helper, and the XGrabKey grabs
    // interfere with PoE2's own input handling. The evdev helper is the sole
    // hotkey mechanism on Wayland.
    if (isWayland()) return;
    for (const entry of this.actions) {
      const isOk = globalShortcut.register(
        shortcutToElectron(entry.shortcut),
        () => {
          if (entry.keepModKeys) {
            const nonModKey = entry.shortcut
              .split(" + ")
              .filter((key) => !isModKey(key))[0];
            uIOhook.keyToggle(UiohookKey[nonModKey as UiohookKeyT], "up");
          } else {
            entry.shortcut
              .split(" + ")
              .reverse()
              .forEach((key) => {
                uIOhook.keyToggle(UiohookKey[key as UiohookKeyT], "up");
              });
          }
          this.runAction(entry);
        },
      );

      if (!isOk) {
        this.logger.write(
          `error [Shortcuts] Failed to register a shortcut "${entry.shortcut}". It is already registered by another application.`,
        );
      }

      if (entry.action.type === "test-only") {
        globalShortcut.unregister(shortcutToElectron(entry.shortcut));
      }
    }
  }

  private unregister() {
    if (isWayland()) return;
    globalShortcut.unregisterAll();
  }

  private syncLinuxHelper() {
    if (!isWayland()) return;

    // Register all configured hotkeys except test-only conflict-detection entries.
    // The helper runs while PoE has focus; once the overlay is shown poeWindow.isActive
    // becomes false and handleLinuxHelperEvent ignores events, leaving Electron's own
    // keyboard handling (handleExtraCommands in OverlayWindow) in charge.
    const eligible = this.actions.filter((a) => a.action.type !== "test-only");
    const hotkeys = eligible.map((action, i) => ({
      id: `action-${i}`,
      accelerator: action.shortcut,
    }));

    const hotkeysKey = JSON.stringify(hotkeys);
    if (hotkeysKey === this.linuxHelperHotkeysKey && this.linuxHelperRunning)
      return;
    this.linuxHelperHotkeysKey = hotkeysKey;
    this.linuxHelperActions = new Map(
      eligible.map((action, i) => [`action-${i}`, action]),
    );

    if (!this.linuxHelper) {
      this.linuxHelper = new LinuxEvdevHelper();
      this.linuxHelper.on("event", (event) => {
        this.handleLinuxHelperEvent(event);
      });
    }

    const isStarting = !this.linuxHelperRunning;
    this.logger.write(
      `info [linux-evdev-helper] ${isStarting ? "starting" : "updating"} ${hotkeys.length} hotkeys`,
    );

    const doWork = async () => {
      const helperPath = await stageHelperBinary(getLinuxEvdevHelperPath());
      if (this.linuxHelperRunning) {
        await this.linuxHelper!.setHotkeys(hotkeys);
      } else {
        await this.linuxHelper!.start({
          helperPath,
          hotkeys,
          allDevices: true,
          elevation: "pkexec",
          enableUinput: false,
          parentPid: process.pid,
        });
      }
    };

    doWork()
      .then(() => {
        this.linuxHelperRunning = true;
      })
      .catch((error) => {
        this.linuxHelperRunning = false;
        this.linuxHelperHotkeysKey = null;
        this.logger.write(
          `error [linux-evdev-helper] ${(error as Error).message}`,
        );
      });
  }

  private handleLinuxHelperEvent(event: LinuxEvdevHelperEvent) {
    if (event.type === "hotkey") {
      const entry = this.linuxHelperActions.get(event.id);
      if (!entry) return;
      // When the overlay is shown without keyboard focus (e.g. --ozone-platform=x11
      // or any compositor that ignores the activation request), poeWindow.isActive
      // stays false and blur never fires. Allow toggle-overlay through so the
      // hotkey can close the overlay it opened. All other actions require PoE focus.
      if (!this.poeWindow.isActive && entry.action.type !== "toggle-overlay") return;
      this.runAction(entry);
    } else if (event.type === "exit") {
      this.linuxHelperRunning = false;
      this.linuxHelperHotkeysKey = null;
    } else if (event.type === "error") {
      this.logger.write(`error [linux-evdev-helper] ${event.message}`);
    }
  }

  private runAction(entry: ShortcutAction) {
    if (this.logKeys) {
      this.logger.write(`debug [Shortcuts] Action type: ${entry.action.type}`);
    }
    if (entry.action.type === "toggle-overlay") {
      this.areaTracker.removeListeners();
      this.overlay.toggleActiveState();
    } else if (entry.action.type === "paste-in-chat") {
      typeInChat(entry.action.text, entry.action.send, this.clipboard);
    } else if (entry.action.type === "trigger-event") {
      this.server.sendEventTo("broadcast", {
        name: "MAIN->CLIENT::widget-action",
        payload: { target: entry.action.target },
      });
    } else if (entry.action.type === "stash-search") {
      stashSearch(entry.action.text, this.clipboard, this.overlay);
    } else if (entry.action.type === "copy-item") {
      const { action } = entry;
      const pressPosition = screen.getCursorScreenPoint();
      this.clipboard
        .readItemText()
        .then((clipboard) => {
          this.areaTracker.removeListeners();
          this.server.sendEventTo("last-active", {
            name: "MAIN->CLIENT::item-text",
            payload: {
              target: action.target,
              clipboard,
              position: pressPosition,
              focusOverlay: Boolean(action.focusOverlay),
            },
          });
          if (action.focusOverlay && this.overlay.wasUsedRecently) {
            this.overlay.assertOverlayActive();
          }
        })
        .catch(() => {});
      pressKeysToCopyItemText(
        entry.keepModKeys
          ? entry.shortcut.split(" + ").filter((key) => isModKey(key))
          : undefined,
        this.gameConfig.showModsKey,
      );
    } else if (
      entry.action.type === "ocr-text" &&
      entry.action.target === "heist-gems"
    ) {
      if (process.platform !== "win32") return;
      const { action } = entry;
      const pressTime = Date.now();
      const imageData = this.poeWindow.screenshot();
      this.ocrWorker
        .findHeistGems({
          width: this.poeWindow.bounds.width,
          height: this.poeWindow.bounds.height,
          data: imageData,
        })
        .then((result) => {
          this.server.sendEventTo("last-active", {
            name: "MAIN->CLIENT::ocr-text",
            payload: {
              target: action.target,
              pressTime,
              ocrTime: result.elapsed,
              paragraphs: result.recognized.map((p) => p.text),
            },
          });
        })
        .catch(() => {});
    }
  }
}

function isWayland(): boolean {
  return (
    process.platform === "linux" &&
    (process.env.XDG_SESSION_TYPE === "wayland" ||
      Boolean(process.env.WAYLAND_DISPLAY))
  );
}

function getLinuxEvdevHelperPath(): string | undefined {
  if (!app.isPackaged) return undefined;

  return path.join(
    process.resourcesPath,
    "app.asar.unpacked",
    "node_modules",
    "linux-evdev-wayland-helper",
    "native",
    "linux-evdev-helper",
    "linux-evdev-helper",
  );
}

// When running from an AppImage the helper binary lives inside a FUSE mount
// that is private to the mounting user. pkexec runs as root and cannot read
// files from that mount (FUSE does not honour root's DAC bypass without
// allow_other). Copy the binary to a world-accessible tmp path before exec-ing.
async function stageHelperBinary(
  sourcePath: string | undefined,
): Promise<string | undefined> {
  if (!sourcePath) return undefined;
  const dest = path.join(os.tmpdir(), "linux-evdev-helper");
  await fs.copyFile(sourcePath, dest);
  await fs.chmod(dest, 0o755);
  return dest;
}

function pressKeysToCopyItemText(
  pressedModKeys: string[] = [],
  showModsKey: string,
) {
  let keys = mergeTwoHotkeys("Ctrl + C", showModsKey).split(" + ");
  keys = keys.filter((key) => key !== "C");
  if (process.platform !== "darwin") {
    // On non-Mac platforms, don't toggle keys that are already being pressed.
    //
    // For unknown reasons, we need to toggle pressed keys on Mac for advanced
    // mod descriptions to be copied. You can test this by setting the shortcut
    // to "Alt + any letter". They'll work with this line, but not if it's
    // commented out.
    keys = keys.filter((key) => !pressedModKeys.includes(key));
  }

  for (const key of keys) {
    uIOhook.keyToggle(UiohookKey[key as UiohookKeyT], "down");
  }

  // finally press `C` to copy text
  uIOhook.keyTap(UiohookKey.C);

  // Timeout to enforce release of keys
  // Game was dropping the release inputs for some reason
  setTimeout(() => {
    keys.reverse();
    for (const key of keys) {
      uIOhook.keyToggle(UiohookKey[key as UiohookKeyT], "up");
    }
  }, 10);
}

function isStashArea(mouse: UiohookWheelEvent, poeWindow: GameWindow): boolean {
  if (
    !poeWindow.bounds ||
    mouse.x > poeWindow.bounds.x + poeWindow.uiSidebarWidth
  )
    return false;

  return (
    mouse.y > poeWindow.bounds.y + (poeWindow.bounds.height * 154) / 1600 &&
    mouse.y < poeWindow.bounds.y + (poeWindow.bounds.height * 1192) / 1600
  );
}

function eventToString(e: {
  keycode: number;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}) {
  const { ctrlKey, shiftKey, altKey } = e;

  let code = UiohookToName[e.keycode];
  if (!code) return "not_supported_key";

  if (code === "Shift" || code === "Alt" || code === "Ctrl") return code;

  if (ctrlKey && shiftKey && altKey) code = `Ctrl + Shift + Alt + ${code}`;
  else if (shiftKey && altKey) code = `Shift + Alt + ${code}`;
  else if (ctrlKey && shiftKey) code = `Ctrl + Shift + ${code}`;
  else if (ctrlKey && altKey) code = `Ctrl + Alt + ${code}`;
  else if (altKey) code = `Alt + ${code}`;
  else if (ctrlKey) code = `Ctrl + ${code}`;
  else if (shiftKey) code = `Shift + ${code}`;

  return code;
}

function shortcutToElectron(shortcut: string) {
  return shortcut
    .split(" + ")
    .map((k) => KeyToElectron[k as keyof typeof KeyToElectron])
    .join("+");
}
