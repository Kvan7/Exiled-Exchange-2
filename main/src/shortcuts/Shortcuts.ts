import { screen, globalShortcut } from "electron";
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
import type {
  LinuxHotkeyHelperStatus,
  LinuxShortcutBackendConfig,
  LinuxHotkeyHelperDebugEvent,
  ShortcutAction,
} from "../../../ipc/types";
import type { Logger } from "../RemoteLogger";
import type { OverlayWindow } from "../windowing/OverlayWindow";
import type { GameWindow } from "../windowing/GameWindow";
import type { GameConfig } from "../host-files/GameConfig";
import type { ServerEvents } from "../server";
import { LinuxEvdevHelperProcess } from "./linux-evdev/helper-process";
import { selectLinuxEvdevBackend } from "./linux-evdev/backend-selection";
import { resolveHelperPath } from "./linux-evdev/helper-process";
import { buildHelperSpawnCommand } from "./linux-evdev/launch-command";
import type { HelperEvent, ShortcutActionWithId } from "./linux-evdev/types";

type UiohookKeyT = keyof typeof UiohookKey;
const UiohookToName = Object.fromEntries(
  Object.entries(UiohookKey).map(([k, v]) => [v, k]),
);

export class Shortcuts {
  private actions: ShortcutAction[] = [];
  private linuxShortcutBackend?: LinuxShortcutBackendConfig;
  private linuxHelper?: LinuxEvdevHelperProcess;
  private linuxHelperError: string | null = null;
  private stashScroll = false;
  private logKeys = false;
  private areaTracker: WidgetAreaTracker;
  private clipboard: HostClipboard;

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
            this.unregister();
            this.register();
          } else {
            this.unregister();
            this.registerOverlayShortcut();
          }
        }
      });
    });

    this.server.onEventAnyClient("CLIENT->MAIN::user-action", (e) => {
      if (e.action === "stash-search") {
        stashSearch(e.text, this.clipboard, this.overlay);
      } else if (e.action === "restart-linux-hotkey-helper") {
        this.restartLinuxHelper();
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

  get helperStatus(): LinuxHotkeyHelperStatus {
    const isWayland = Boolean(process.env.WAYLAND_DISPLAY);
    const configured =
      process.platform === "linux" &&
      this.linuxShortcutBackend?.backend === "linux-evdev-helper";
    const elevation = this.linuxShortcutBackend?.elevation ?? "pkexec";
    const command = configured ? this.helperCommandText(elevation) : null;

    return {
      isWayland,
      configured,
      running: Boolean(this.linuxHelper),
      elevation,
      command,
      capturing: configured
        ? this.actions.map((action) => action.shortcut)
        : [],
      error: this.linuxHelperError,
    };
  }

  updateActions(
    actions: ShortcutAction[],
    stashScroll: boolean,
    logKeys: boolean,
    restoreClipboard: boolean,
    language: string,
    linuxShortcutBackend?: LinuxShortcutBackendConfig,
  ) {
    const shouldRefreshActiveBackend = this.poeWindow.isActive;
    if (shouldRefreshActiveBackend && this.linuxHelper) {
      this.logger.write(
        "info [linux-evdev-helper] Restarting helper because hotkeys changed.",
      );
    }

    this.stopLinuxHelper();
    if (shouldRefreshActiveBackend) {
      this.unregister();
    }

    this.linuxShortcutBackend = linuxShortcutBackend;
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

    if (this.shouldRunLinuxHelper()) {
      this.startLinuxHelper("wayland");
    } else if (shouldRefreshActiveBackend) {
      this.register();
    } else {
      this.registerOverlayShortcut();
    }
  }

  private register() {
    if (this.linuxHelper) return;

    const selection = selectLinuxEvdevBackend(
      process.platform,
      this.linuxShortcutBackend,
      0,
    );
    if (selection.useHelper) {
      this.startLinuxHelper("explicit");
      return;
    }

    const failed = this.registerElectronShortcuts();
    const fallbackSelection = selectLinuxEvdevBackend(
      process.platform,
      this.linuxShortcutBackend,
      failed,
    );
    if (fallbackSelection.useHelper) {
      globalShortcut.unregisterAll();
      this.startLinuxHelper("register-failed");
    }
  }

  private registerElectronShortcuts() {
    let failed = 0;
    for (const entry of this.actions) {
      const isOk = globalShortcut.register(
        shortcutToElectron(entry.shortcut),
        () => this.runAction(entry),
      );

      if (!isOk) {
        failed += 1;
        this.logger.write(
          `error [Shortcuts] Failed to register a shortcut "${entry.shortcut}". It is already registered by another application.`,
        );
      }

      if (entry.action.type === "test-only") {
        globalShortcut.unregister(shortcutToElectron(entry.shortcut));
      }
    }

    return failed;
  }

  private registerOverlayShortcut() {
    const entry = this.actions.find(
      (entry) => entry.action.type === "toggle-overlay",
    );
    if (!entry) return;

    const isOk = globalShortcut.register(
      shortcutToElectron(entry.shortcut),
      () => this.runAction(entry),
    );
    if (!isOk) {
      this.logger.write(
        `error [Shortcuts] Failed to register overlay shortcut "${entry.shortcut}". It is already registered by another application.`,
      );
    }
  }

  private unregister() {
    if (!this.shouldRunLinuxHelper()) {
      this.stopLinuxHelper();
    }
    globalShortcut.unregisterAll();
  }

  private startLinuxHelper(reason: string) {
    if (!this.linuxShortcutBackend) return;
    this.stopLinuxHelper();

    const actions = this.actionsWithIds();
    const byId = new Map(actions.map(({ id, entry }) => [id, entry]));
    this.linuxHelper = new LinuxEvdevHelperProcess(
      this.logger,
      this.linuxShortcutBackend,
      actions,
    );
    this.emitHelperDebugEvent({
      kind: "start",
      message: `starting helper via ${reason}`,
    });
    this.linuxHelper.on("message", (message: HelperEvent) => {
      if (message.type === "ready") {
        this.emitHelperDebugEvent({
          kind: "ready",
          message: `ready; devices=${message.devices.length}, hotkeys=${message.hotkeys}`,
        });
        this.linuxHelperError = null;
        this.logger.write(
          `info [linux-evdev-helper] ready via ${reason}; devices=${message.devices.length}, hotkeys=${message.hotkeys}`,
        );
        this.emitHelperStatus();
      } else if (message.type === "hotkey") {
        this.emitHelperDebugEvent({
          kind: "hotkey",
          id: message.id,
          accelerator: message.accelerator,
          helperTs: message.ts,
          message: `received ${message.accelerator}`,
        });
        const entry = byId.get(message.id);
        if (!entry) {
          this.logger.write(
            `warn [linux-evdev-helper] Ignoring unknown hotkey id "${message.id}"`,
          );
          return;
        }
        if (
          !this.poeWindow.isActive &&
          entry.action.type !== "toggle-overlay"
        ) {
          return;
        }
        this.runAction(entry);
      } else if (message.type === "error") {
        this.emitHelperDebugEvent({
          kind: "error",
          code: message.code,
          device: message.device,
          message: message.message,
        });
      }
    });
    this.linuxHelper.on("error-event", (error: Error) => {
      this.emitHelperDebugEvent({
        kind: "error",
        message: error.message,
      });
      this.linuxHelperError = "helper process failed to start";
      this.stopLinuxHelper();
      if (this.poeWindow.isActive) {
        this.registerElectronShortcuts();
      }
      this.emitHelperStatus();
    });
    this.linuxHelper.on(
      "exit",
      (code: number | null, signal: string | null) => {
        this.emitHelperDebugEvent({
          kind: "exit",
          exitCode: code,
          signal,
          message: `helper exited with ${signal ?? `code ${code ?? "unknown"}`}`,
        });
        this.linuxHelper = undefined;
        this.emitHelperStatus();
        if (!this.shouldRunLinuxHelper() && this.poeWindow.isActive) {
          this.registerElectronShortcuts();
        }
      },
    );

    try {
      this.linuxHelper.start();
    } catch (error) {
      this.linuxHelperError = (error as Error).message;
      this.logger.write(`error [linux-evdev-helper] ${this.linuxHelperError}`);
      this.stopLinuxHelper();
      if (!this.shouldRunLinuxHelper() && this.poeWindow.isActive) {
        this.registerElectronShortcuts();
      }
      this.emitHelperStatus();
    }
    this.emitHelperStatus();
  }

  private stopLinuxHelper() {
    this.linuxHelper?.removeAllListeners();
    this.linuxHelper?.stop();
    this.linuxHelper = undefined;
  }

  private actionsWithIds(): ShortcutActionWithId[] {
    const configured = this.linuxShortcutBackend?.hotkeys ?? [];
    return this.actions.map((entry, index) => ({
      id:
        configured.find((hotkey) => hotkey.accelerator === entry.shortcut)
          ?.id ?? `shortcut-${index}`,
      entry,
    }));
  }

  private restartLinuxHelper() {
    if (!this.shouldRunLinuxHelper()) {
      this.emitHelperStatus();
      return;
    }
    this.logger.write(
      "info [linux-evdev-helper] Restart requested from settings.",
    );
    this.startLinuxHelper("manual-restart");
  }

  private shouldRunLinuxHelper() {
    return (
      process.platform === "linux" &&
      Boolean(process.env.WAYLAND_DISPLAY) &&
      this.linuxShortcutBackend?.backend === "linux-evdev-helper"
    );
  }

  private helperCommandText(
    elevation: LinuxShortcutBackendConfig["elevation"] = "pkexec",
  ) {
    try {
      const helperPath = resolveHelperPath(
        this.linuxShortcutBackend?.helperPath,
      );
      const command = buildHelperSpawnCommand(helperPath, elevation);
      return [command.command, ...command.args].join(" ");
    } catch (error) {
      return `error: ${(error as Error).message}`;
    }
  }

  private emitHelperStatus() {
    this.server.sendEventTo("broadcast", {
      name: "MAIN->CLIENT::linux-hotkey-helper-state",
      payload: this.helperStatus,
    });
  }

  private emitHelperDebugEvent(event: Omit<LinuxHotkeyHelperDebugEvent, "at">) {
    this.server.sendEventTo("broadcast", {
      name: "MAIN->CLIENT::linux-hotkey-helper-debug-event",
      payload: {
        at: Date.now(),
        ...event,
      },
    });
  }

  private runAction(entry: ShortcutAction) {
    if (this.logKeys) {
      this.logger.write(`debug [Shortcuts] Action type: ${entry.action.type}`);
    }

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
