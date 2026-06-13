"use strict";

import { app, systemPreferences } from "electron";
import { uIOhook } from "uiohook-napi";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  startServer,
  eventPipe,
  server,
  setDebugOverlayCaptureProvider,
  setDebugOverlayStateProvider,
  setLinuxHotkeyHelperStatusProvider,
} from "./server";
import { Logger } from "./RemoteLogger";
import { GameWindow } from "./windowing/GameWindow";
import { OverlayWindow } from "./windowing/OverlayWindow";
import { GameConfig } from "./host-files/GameConfig";
import { Shortcuts } from "./shortcuts/Shortcuts";
import { AppUpdater } from "./AppUpdater";
import { AppTray } from "./AppTray";
import { OverlayVisibility } from "./windowing/OverlayVisibility";
import { GameLogWatcher } from "./host-files/GameLogWatcher";
import { HttpProxy } from "./proxy";
import { installExtension, VUEJS_DEVTOOLS } from "electron-devtools-installer";
import { FileWriter } from "./host-files/FileWriter";

if (!app.requestSingleInstanceLock()) {
  app.exit();
}

if (process.platform !== "darwin") {
  app.disableHardwareAcceleration();
}
if (!process.env.VITE_DEV_SERVER_URL) {
  app.enableSandbox();
}
let tray: AppTray;

(async () => {
  if (process.platform === "darwin") {
    async function ensureAccessibilityPermission(): Promise<boolean> {
      if (systemPreferences.isTrustedAccessibilityClient(false)) return true;

      // Trigger the system prompt
      systemPreferences.isTrustedAccessibilityClient(true);

      const maxWaitTime = 15000; // 15 seconds
      const startTime = Date.now();

      return await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (systemPreferences.isTrustedAccessibilityClient(false)) {
            clearInterval(interval);
            resolve(true);
          }

          // Stop waiting if time runs out
          if (Date.now() - startTime > maxWaitTime) {
            clearInterval(interval);
            resolve(false);
          }
        }, 1000);
      });
    }
    const hasPermission = await ensureAccessibilityPermission();
    if (!hasPermission) {
      console.warn("Accessibility permission not granted, exiting");
      app.quit();
      return;
    }
    console.log("Accessibility permission granted, starting app");
  }

  app.on("ready", async () => {
    tray = new AppTray(eventPipe);
    const logger = new Logger(eventPipe);
    const gameConfig = new GameConfig(eventPipe, logger);
    const poeWindow = new GameWindow();
    const appUpdater = new AppUpdater(eventPipe);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _httpProxy = new HttpProxy(server, logger);
    const fileWriter = new FileWriter(eventPipe, logger);
    const gameLogWatcher = new GameLogWatcher(eventPipe, logger, fileWriter);

    if (process.env.VITE_DEV_SERVER_URL) {
      try {
        await installExtension(VUEJS_DEVTOOLS);
        logger.write("info Vue Devtools installed");
      } catch (error) {
        logger.write(`error installing Vue Devtools: ${error}`);
        console.log(`error installing Vue Devtools: ${error}`);
      }
    }
    process.addListener("uncaughtException", (err) => {
      logger.write(`error [uncaughtException] ${err.message}, ${err.stack}`);
    });
    process.addListener("unhandledRejection", (reason) => {
      logger.write(`error [unhandledRejection] ${(reason as Error).stack}`);
    });

    setTimeout(
      async () => {
        const overlay = new OverlayWindow(eventPipe, logger, poeWindow);
        setDebugOverlayCaptureProvider(() => overlay.captureDebugPng());
        setDebugOverlayStateProvider(() => overlay.debugState());
        tray.setOpenSettingsHandler(() => {
          overlay.openSettings();
        });
        // eslint-disable-next-line no-new
        new OverlayVisibility(eventPipe, overlay, gameConfig);
        const shortcuts = await Shortcuts.create(
          logger,
          overlay,
          poeWindow,
          gameConfig,
          eventPipe,
        );
        setLinuxHotkeyHelperStatusProvider(() => shortcuts.helperStatus);
        eventPipe.onEventAnyClient(
          "CLIENT->MAIN::update-host-config",
          (cfg) => {
            cfg.linuxShortcutBackend ??= defaultWaylandShortcutBackend();
            if (cfg.linuxShortcutBackend?.backend === "linux-evdev-helper") {
              cfg.linuxShortcutBackend.devices = mergeDiscoveredInputDevices(
                cfg.linuxShortcutBackend.devices,
              );
            }
            overlay.updateOpts(cfg.overlayKey, cfg.windowTitle);
            shortcuts.updateActions(
              cfg.shortcuts,
              cfg.stashScroll,
              cfg.logKeys,
              cfg.restoreClipboard,
              cfg.language,
              cfg.linuxShortcutBackend,
            );
            shortcuts.updateDelay(cfg.initialDelay);
            gameLogWatcher.restart(cfg.clientLog ?? "", cfg.readClientLog);
            gameConfig.readConfig(cfg.gameConfig ?? "");
            appUpdater.checkAtStartup();
            tray.overlayKey = cfg.overlayKey;
            fileWriter.restart(cfg.libraryAlpha, cfg.libraryOutputPath);
          },
        );
        uIOhook.start();
        console.log("uIOhook started");
        const port = await startServer(appUpdater, logger);
        // TODO: move up (currently crashes)
        logger.write(`info ${os.type()} ${os.release} / v${app.getVersion()}`);
        overlay.loadAppPage(port);
        tray.serverPort = port;
      },
      // fixes(linux): window is black instead of transparent
      process.platform === "linux" ? 1000 : 0,
    );
  });
})();

function defaultWaylandShortcutBackend() {
  if (process.platform !== "linux" || !process.env.WAYLAND_DISPLAY) {
    return undefined;
  }

  const devices = process.env.EXILED_EXCHANGE_LINUX_HOTKEY_DEVICES
    ? process.env.EXILED_EXCHANGE_LINUX_HOTKEY_DEVICES.split(",")
        .map((device) => device.trim())
        .filter(Boolean)
    : discoverKeyboardEventDevices();

  return {
    backend: "linux-evdev-helper" as const,
    mode: "enabled" as const,
    elevation: "pkexec" as const,
    devices: mergeDiscoveredInputDevices(devices),
    enableUinput: false as const,
  };
}

function mergeDiscoveredInputDevices(configured: string[] | undefined) {
  return Array.from(
    new Set([...(configured ?? []), ...discoverKeyboardEventDevices()]),
  ).sort();
}

function discoverKeyboardEventDevices() {
  const devices = new Set<string>();
  for (const dir of ["/dev/input/by-path", "/dev/input/by-id"]) {
    try {
      for (const entry of fs.readdirSync(dir)) {
        if (!entry.endsWith("-event-kbd")) continue;
        const device = fs.realpathSync(path.join(dir, entry));
        if (/^\/dev\/input\/event[0-9]+$/.test(device)) {
          devices.add(device);
        }
      }
    } catch {}
  }

  try {
    for (const entry of fs.readdirSync("/dev/input")) {
      if (/^event[0-9]+$/.test(entry)) {
        devices.add(path.join("/dev/input", entry));
      }
    }
  } catch {}

  return Array.from(devices).sort();
}
