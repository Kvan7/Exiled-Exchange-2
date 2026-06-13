import type { ShortcutAction } from "../../../../ipc/types";
import type { ParsedAccelerator } from "./accelerator";

export interface LinuxEvdevHotkeyConfig {
  id: string;
  accelerator: string;
  passthrough?: boolean;
}

export interface LinuxEvdevHelperConfig {
  backend: "linux-evdev-helper";
  mode?: "enabled" | "fallback";
  elevation?: "pkexec" | "sudo" | "none";
  helperPath?: string;
  devices?: string[];
  hotkeys?: LinuxEvdevHotkeyConfig[];
  enableUinput?: false;
}

export interface LinuxEvdevHelperLaunchConfig {
  backend: "linux-evdev-helper";
  parentPid: number;
  devices: string[];
  hotkeys: Array<LinuxEvdevHotkeyConfig & ParsedAccelerator>;
  enableUinput: false;
}

export interface LinuxEvdevBackendSelection {
  useHelper: boolean;
  reason: "disabled" | "explicit" | "register-failed" | "unsupported-platform";
}

export type HelperEvent =
  | {
      type: "ready";
      devices: string[];
      hotkeys: number;
    }
  | {
      type: "hotkey";
      id: string;
      accelerator: string;
      ts: number;
    }
  | {
      type: "error";
      code: string;
      message: string;
      device?: string;
    };

export interface ShortcutActionWithId {
  id: string;
  entry: ShortcutAction;
}
