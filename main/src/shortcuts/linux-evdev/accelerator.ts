import { isModKey } from "../../../../ipc/KeyToCode";

export interface ParsedAccelerator {
  accelerator: string;
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

const KEY_ALIASES: Record<string, string> = {
  CONTROL: "Ctrl",
  CTRL: "Ctrl",
  COMMAND: "Meta",
  CMD: "Meta",
  SUPER: "Meta",
  META: "Meta",
  OPTION: "Alt",
  ALT: "Alt",
  SHIFT: "Shift",
  SPACE: "Space",
  ESC: "Escape",
  ESCAPE: "Escape",
  RETURN: "Enter",
  ENTER: "Enter",
  DELETE: "Delete",
  DEL: "Delete",
  BACKSPACE: "Backspace",
  TAB: "Tab",
  HOME: "Home",
  END: "End",
  PAGEUP: "PageUp",
  PAGEDOWN: "PageDown",
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
  UP: "ArrowUp",
  DOWN: "ArrowDown",
};

const VALID_NAMED_KEYS = new Set([
  "Backspace",
  "Tab",
  "Enter",
  "CapsLock",
  "Escape",
  "Space",
  "PageUp",
  "PageDown",
  "End",
  "Home",
  "ArrowLeft",
  "ArrowUp",
  "ArrowRight",
  "ArrowDown",
  "Insert",
  "Delete",
  "Semicolon",
  "Equal",
  "Comma",
  "Minus",
  "Period",
  "Slash",
  "Backquote",
  "BracketLeft",
  "Backslash",
  "BracketRight",
  "Quote",
]);

export function parseAccelerator(accelerator: string): ParsedAccelerator {
  const parts = accelerator
    .split(/\s*\+\s*/)
    .map((part) => normalizeKey(part))
    .filter((part) => part.length > 0);

  if (!parts.length) {
    throw new Error("Accelerator is empty");
  }

  let ctrl = false;
  let shift = false;
  let alt = false;
  let meta = false;
  const keys: string[] = [];

  for (const part of parts) {
    if (part === "Ctrl") ctrl = true;
    else if (part === "Shift") shift = true;
    else if (part === "Alt") alt = true;
    else if (part === "Meta") meta = true;
    else keys.push(part);
  }

  if (keys.length !== 1) {
    throw new Error(`Accelerator must contain one non-modifier key: ${accelerator}`);
  }

  const key = keys[0];
  if (isModKey(key) || key === "Meta") {
    throw new Error(`Accelerator must not use only modifiers: ${accelerator}`);
  }

  return {
    accelerator: acceleratorFromParts({ key, ctrl, shift, alt, meta }),
    key,
    ctrl,
    shift,
    alt,
    meta,
  };
}

export function acceleratorFromParts(accel: Omit<ParsedAccelerator, "accelerator">) {
  return [
    accel.ctrl ? "Ctrl" : null,
    accel.shift ? "Shift" : null,
    accel.alt ? "Alt" : null,
    accel.meta ? "Meta" : null,
    accel.key,
  ]
    .filter(Boolean)
    .join(" + ");
}

function normalizeKey(key: string): string {
  const upper = key.trim().toUpperCase();
  if (!upper) return "";
  if (KEY_ALIASES[upper]) return KEY_ALIASES[upper];
  if (/^[A-Z0-9]$/.test(upper)) return upper;
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(upper)) return upper;
  if (/^NUMPAD[0-9]$/.test(upper)) return `Numpad${upper.slice("NUMPAD".length)}`;
  if (VALID_NAMED_KEYS.has(key)) return key;

  const pascal = upper[0] + upper.slice(1).toLowerCase();
  if (VALID_NAMED_KEYS.has(pascal)) return pascal;

  throw new Error(`Unsupported accelerator key: ${key}`);
}

