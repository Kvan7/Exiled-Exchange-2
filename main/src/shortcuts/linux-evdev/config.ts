import { parseAccelerator } from "./accelerator";
import type {
  LinuxEvdevHelperConfig,
  LinuxEvdevHelperLaunchConfig,
  ShortcutActionWithId,
} from "./types";

export function buildLaunchConfig(
  config: LinuxEvdevHelperConfig,
  actions: ShortcutActionWithId[],
  devicesFromEnv = process.env.EXILED_EXCHANGE_LINUX_HOTKEY_DEVICES,
): LinuxEvdevHelperLaunchConfig {
  if (config.enableUinput) {
    throw new Error("linux-evdev-helper uinput support is not implemented yet");
  }

  const devices = config.devices ?? parseListEnv(devicesFromEnv);
  if (!devices.length) {
    throw new Error("linux-evdev-helper requires at least one input device");
  }
  for (const device of devices) {
    if (!/^\/dev\/input\/event[0-9]+$/.test(device)) {
      throw new Error(`linux-evdev-helper device must be /dev/input/event*: ${device}`);
    }
  }

  const actionAccelerators = new Set(actions.map(({ entry }) => entry.shortcut));
  const configuredHotkeys = config.hotkeys?.length
    ? config.hotkeys.filter((hotkey) => actionAccelerators.has(hotkey.accelerator))
    : actions.map(({ id, entry }) => ({
        id,
        accelerator: entry.shortcut,
        passthrough: true,
      }));

  if (!configuredHotkeys.length) {
    throw new Error("linux-evdev-helper has no matching app hotkeys to register");
  }

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

function parseListEnv(value: string | undefined): string[] {
  return value
    ? value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];
}
