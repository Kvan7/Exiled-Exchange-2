# Linux evdev hotkey helper

Exiled Exchange 2 normally uses Electron global shortcuts for app hotkeys. On
Wayland, global hotkeys are compositor and portal dependent, and shortcuts can
fail while Path of Exile has focus. The optional `linux-evdev-helper` backend
delegates hotkey capture to a small native helper that reads configured
`/dev/input/event*` keyboard devices with evdev.

This backend is Linux-only and opt-in. The Electron/Node process does not read
input devices directly and must not be run as root. The native helper runs as
root by default through an explicit privilege prompt, then reports only
configured hotkey activations to Node over stdout as newline-delimited JSON.

## Build

From the `main` package:

```sh
npm run build:linux-evdev-helper
```

Or directly:

```sh
make -C native/linux-evdev-helper
```

The helper has no Node, Electron, X11, Wayland, DBus, ncurses, GTK, or Qt
dependency. It uses C11, libc, and Linux input headers.

## Enable

The app keeps the existing shortcut backend unless this backend is configured
or the normal backend fails and this backend has a config.

Hidden config example:

```json
{
  "linuxShortcutBackend": {
    "backend": "linux-evdev-helper",
    "mode": "enabled",
    "elevation": "pkexec",
    "helperPath": "/absolute/path/to/linux-evdev-helper",
    "devices": ["/dev/input/event4", "/dev/input/event7"],
    "enableUinput": false
  }
}
```

`mode` defaults to `enabled`. Use `"fallback"` to try Electron global shortcuts
first and start the helper only when registration fails.

`elevation` defaults to `pkexec`, which opens a desktop authorization prompt
and runs only the helper as root. Use `"sudo"` only when `SUDO_ASKPASS` is
configured, because the app launches helpers in the background and cannot
service an interactive terminal password prompt. `"none"` is available only for
development or systems where device permissions are handled another way.

For development, the renderer can also pass the backend from Vite env vars:

```sh
VITE_LINUX_HOTKEY_BACKEND=linux-evdev-helper \
VITE_LINUX_HOTKEY_BACKEND_MODE=enabled \
VITE_LINUX_HOTKEY_ELEVATION=pkexec \
VITE_LINUX_HOTKEY_DEVICES=/dev/input/event4,/dev/input/event7 \
VITE_LINUX_HOTKEY_HELPER=/absolute/path/to/linux-evdev-helper \
npm run dev
```

If `hotkeys` is omitted, the app sends its current configured app hotkeys to the
helper. If `hotkeys` is supplied, Node intersects that list with the current app
hotkeys before launching the helper. Unknown or stale accelerators are not sent
to the helper, so the helper can emit only app-owned shortcut activations.

## Runtime hotkey changes

The helper configuration is one-shot by design. Node sends the active hotkey set
as JSON on stdin when the helper starts, then the helper emits only matching
activation events on stdout.

When the user changes hotkey settings while the game is active, the app stops
the current helper process and starts a new one with the freshly derived app
hotkey set. With the default `pkexec` elevation, this can show a privilege
prompt at app startup and after each active settings change. The helper does
not accept a general command channel and cannot be asked to run commands or
register arbitrary shortcuts after startup.

## Permissions

The helper must run as root. Do not run the Electron app as root, and do not
`chmod` input devices from JavaScript. By default, Node starts the helper with:

```sh
pkexec /absolute/path/to/linux-evdev-helper
```

For `elevation: "sudo"`, Node starts:

```sh
sudo -A /absolute/path/to/linux-evdev-helper
```

That requires `SUDO_ASKPASS` to be set to a graphical askpass helper.

Alternative group-based device access can still be used with
`elevation: "none"` for local development:

Example group-based udev rule, adjust group and device match for your system:

```udev
SUBSYSTEM=="input", KERNEL=="event*", ENV{ID_INPUT_KEYBOARD}=="1", GROUP="input", MODE="0640"
```

Then add your user to that group and re-login. This project does not install
udev rules automatically.

Check access with:

```sh
printf '%s\n' '{"devices":["/dev/input/event4"],"hotkeys":[{"id":"price-check","accelerator":"Ctrl + D","key":"D","ctrl":true,"shift":false,"alt":false,"meta":false}]}' \
  | pkexec native/linux-evdev-helper/linux-evdev-helper --check-permissions
```

## Limitations

- Linux only.
- Helper must run as root to read configured keyboard event devices.
- Does not solve overlay stacking or compositor-specific focus behavior.
- Ignores evdev repeat events; activations are emitted once on key press.
- uinput injection is not implemented in this pass. If added later, it should
  remain disabled by default, require `/dev/uinput` permissions, and expose only
  narrow configured sequences such as `Ctrl+C`.
