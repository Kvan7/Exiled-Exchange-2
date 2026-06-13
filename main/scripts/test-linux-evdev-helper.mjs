#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argValue(name) {
  const prefix = `${name}=`;
  const arg = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function splitList(value) {
  return value
    ? value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];
}

function defaultConfigPath() {
  return path.join(
    os.homedir(),
    ".config",
    "exiled-exchange-2",
    "apt-data",
    "config.json",
  );
}

function defaultHelperPath() {
  const helperName = process.argv.includes("--debug-events")
    ? "linux-evdev-helper-debug"
    : "linux-evdev-helper";
  const source = path.resolve(rootDir, "..", "native", "linux-evdev-helper", helperName);
  if (fs.existsSync(source)) return source;
  return path.resolve(rootDir, "dist", helperName);
}

function discoverKeyboardEventDevices() {
  const devices = new Set();
  if (process.argv.includes("--all-devices")) {
    try {
      for (const entry of fs.readdirSync("/dev/input")) {
        if (/^event[0-9]+$/.test(entry)) devices.add(path.join("/dev/input", entry));
      }
    } catch {}
    return Array.from(devices).sort();
  }

  for (const dir of ["/dev/input/by-path", "/dev/input/by-id"]) {
    try {
      for (const entry of fs.readdirSync(dir)) {
        if (!entry.endsWith("-event-kbd")) continue;
        const device = fs.realpathSync(path.join(dir, entry));
        if (/^\/dev\/input\/event[0-9]+$/.test(device)) devices.add(device);
      }
    } catch {}
  }

  if (!devices.size) {
    try {
      for (const entry of fs.readdirSync("/dev/input")) {
        if (/^event[0-9]+$/.test(entry)) devices.add(path.join("/dev/input", entry));
      }
    } catch {}
  }

  return Array.from(devices).sort();
}

function normalizeKey(key) {
  const aliases = new Map([
    ["Esc", "Escape"],
    ["Del", "Delete"],
    ["Ins", "Insert"],
    ["Return", "Enter"],
    ["Left", "ArrowLeft"],
    ["Right", "ArrowRight"],
    ["Up", "ArrowUp"],
    ["Down", "ArrowDown"],
    [".", "Period"],
    [",", "Comma"],
    ["/", "Slash"],
    ["\\", "Backslash"],
    ["-", "Minus"],
    ["=", "Equal"],
    ["`", "Backquote"],
    ["'", "Quote"],
    [";", "Semicolon"],
    ["[", "BracketLeft"],
    ["]", "BracketRight"],
  ]);

  if (aliases.has(key)) return aliases.get(key);
  if (/^[a-z]$/.test(key)) return key.toUpperCase();
  return key;
}

function parseAccelerator(accelerator) {
  const parts = accelerator
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const mods = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
  };
  let key = null;

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === "ctrl" || lower === "control" || lower === "cmdorctrl") mods.ctrl = true;
    else if (lower === "shift") mods.shift = true;
    else if (lower === "alt" || lower === "option") mods.alt = true;
    else if (lower === "super" || lower === "meta" || lower === "cmd" || lower === "command") mods.meta = true;
    else if (key == null) key = normalizeKey(part);
    else throw new Error(`unsupported accelerator with multiple non-modifier keys: ${accelerator}`);
  }

  if (!key) throw new Error(`modifier-only accelerator is not supported: ${accelerator}`);

  const normalized = [
    mods.ctrl ? "Ctrl" : null,
    mods.shift ? "Shift" : null,
    mods.alt ? "Alt" : null,
    mods.meta ? "Super" : null,
    key,
  ]
    .filter(Boolean)
    .join(" + ");

  return { accelerator: normalized, key, ...mods };
}

function addAction(actions, shortcut, id, type) {
  if (!shortcut || typeof shortcut !== "string" || shortcut.trim() === "") return;
  actions.push({ id, shortcut: shortcut.trim(), type });
}

function actionsFromConfig(config) {
  const actions = [];
  addAction(actions, config.overlayKey, "overlay", "toggle-overlay");

  for (const widget of config.widgets ?? []) {
    if (widget.wmType === "price-check") {
      const hold = widget.hotkeyHold ? `${widget.hotkeyHold} + ` : "";
      addAction(actions, `${hold}${widget.hotkey}`, "price-check", "copy-item");
      addAction(actions, widget.hotkeyLocked, "price-check-locked", "copy-item");
    } else if (widget.wmType === "item-check") {
      addAction(actions, widget.hotkey, "item-check", "trigger-event");
    } else if (widget.wmType === "delve-grid") {
      addAction(actions, widget.toggleKey, "delve-grid", "trigger-event");
    } else if (widget.wmType === "stash-search") {
      for (const [index, entry] of (widget.entries ?? []).entries()) {
        addAction(actions, entry.hotkey, `stash-search-${index}`, "stash-search");
      }
    } else if (widget.wmType === "timer") {
      addAction(actions, widget.toggleKey, `timer-toggle-${widget.wmId}`, "trigger-event");
      addAction(actions, widget.resetKey, `timer-reset-${widget.wmId}`, "trigger-event");
    } else if (widget.wmType === "item-search") {
      addAction(actions, widget.ocrGemsKey, "ocr-gems", "ocr-text");
    }
  }

  const byShortcut = new Map();
  for (const action of actions) {
    if (!byShortcut.has(action.shortcut)) byShortcut.set(action.shortcut, action);
  }
  return Array.from(byShortcut.values());
}

function backendConfig(config) {
  return (
    config.linuxShortcutBackend ?? {
      backend: "linux-evdev-helper",
      mode: "enabled",
      elevation: "pkexec",
      enableUinput: false,
    }
  );
}

function launchConfigFromSettings(config) {
  const backend = backendConfig(config);
  const actions = actionsFromConfig(config);
  const actionAccelerators = new Set(actions.map((action) => action.shortcut));
  const configuredHotkeys = backend.hotkeys?.length
    ? backend.hotkeys.filter((hotkey) => actionAccelerators.has(hotkey.accelerator))
    : actions.map((action) => ({
        id: action.id,
        accelerator: action.shortcut,
        passthrough: true,
      }));

  const devices =
    process.argv.includes("--all-devices")
      ? discoverKeyboardEventDevices()
      : splitList(process.env.EXILED_EXCHANGE_LINUX_HOTKEY_DEVICES).length > 0
      ? splitList(process.env.EXILED_EXCHANGE_LINUX_HOTKEY_DEVICES)
      : Array.from(
          new Set([...(backend.devices ?? []), ...discoverKeyboardEventDevices()]),
        ).sort();

  if (!devices.length) throw new Error("no /dev/input/event* keyboard devices found");
  for (const device of devices) {
    if (!/^\/dev\/input\/event[0-9]+$/.test(device)) {
      throw new Error(`invalid evdev path: ${device}`);
    }
  }
  if (!configuredHotkeys.length) throw new Error("no settings hotkeys found for helper");

  return {
    backend: "linux-evdev-helper",
    parentPid: process.pid,
    devices,
    enableUinput: false,
    hotkeys: configuredHotkeys.map((hotkey) => ({
      ...hotkey,
      ...parseAccelerator(hotkey.accelerator),
    })),
  };
}

function spawnCommand(helperPath, elevation) {
  const helperArgs = ["--replace-existing"];
  if (process.argv.includes("--debug-events")) helperArgs.push("--debug-events");
  if (elevation === "none") return { command: helperPath, args: helperArgs };
  if (elevation === "sudo") return { command: "sudo", args: ["-A", helperPath, ...helperArgs] };
  return { command: "pkexec", args: [helperPath, ...helperArgs] };
}

function formatEvent(event) {
  if (event.type === "hotkey") {
    return `HOTKEY id=${event.id} accelerator=${event.accelerator} ts=${event.ts}`;
  }
  if (event.type === "ready") {
    return `READY devices=${event.devices.length} hotkeys=${event.hotkeys}`;
  }
  if (event.type === "error") {
    return `ERROR code=${event.code} message=${event.message}${event.device ? ` device=${event.device}` : ""}`;
  }
  return JSON.stringify(event);
}

const configPath = path.resolve(argValue("--config") ?? process.env.EXILED_EXCHANGE_CONFIG ?? defaultConfigPath());
const helperPath = path.resolve(argValue("--helper") ?? process.env.EXILED_EXCHANGE_LINUX_HOTKEY_HELPER ?? defaultHelperPath());
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const backend = backendConfig(config);
const launchConfig = launchConfigFromSettings(config);
const command = spawnCommand(helperPath, backend.elevation ?? "pkexec");

console.log(`Config: ${configPath}`);
console.log(`Helper: ${helperPath}`);
console.log(`Command: ${command.command} ${command.args.join(" ")}`);
console.log(`Devices: ${launchConfig.devices.join(", ")}`);
console.log(`Hotkeys: ${launchConfig.hotkeys.map((hotkey) => `${hotkey.id}=${hotkey.accelerator}`).join(", ")}`);

const child = spawn(command.command, command.args, {
  stdio: ["pipe", "pipe", "pipe"],
});

let stdoutBuffer = "";
child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk.toString("utf8");
  for (;;) {
    const index = stdoutBuffer.indexOf("\n");
    if (index === -1) break;
    const line = stdoutBuffer.slice(0, index).trim();
    stdoutBuffer = stdoutBuffer.slice(index + 1);
    if (!line) continue;
    try {
      console.log(formatEvent(JSON.parse(line)));
    } catch (error) {
      console.log(`INVALID ${line} (${error.message})`);
    }
  }
});

child.stderr.on("data", (chunk) => {
  for (const line of chunk.toString("utf8").split(/\r?\n/)) {
    if (line.trim()) console.error(`helper stderr: ${line.trim()}`);
  }
});

child.on("error", (error) => {
  console.error(`failed to launch helper: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  console.log(`Helper exited: ${signal ?? `code ${code ?? "unknown"}`}`);
});

child.stdin.end(`${JSON.stringify(launchConfig)}\n`);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill("SIGTERM");
    setTimeout(() => process.exit(signal === "SIGINT" ? 130 : 143), 250);
  });
}
