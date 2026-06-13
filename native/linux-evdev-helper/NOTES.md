# Linux evdev helper notes

## Virtual keyboards and remappers

Do not assume the physical keyboard event node is where usable key events are
delivered.

On systems using tools such as `keyd`, `kmonad`, `kanata`, interception tools,
or other input remappers, the physical keyboard may still appear under
`/dev/input/event*` and report normal key capabilities through `EVIOCGBIT`, but
actual remapped key events can be emitted by a separate virtual keyboard device.

Example observed setup:

- Physical keyboard:
  `/dev/input/event16` named `iQunix iQunix F96 Mechanical keyboard`
- Virtual keyboard:
  `/dev/input/event24` named `keyd virtual keyboard`

The physical keyboard reported capabilities for Ctrl, D, N, Period, and Space,
but did not emit the expected key events during testing. The actual events came
from the `keyd virtual keyboard` device.

## Discovery rule

The app should launch the helper with the union of:

- devices explicitly saved in config
- keyboard devices discovered from `/dev/input/by-path` and `/dev/input/by-id`
- current `/dev/input/event*` devices

The helper still only emits configured hotkey activations, not arbitrary key
streams, so watching additional input devices is acceptable for this backend.
It is necessary for remapped keyboards and virtual input devices.

## Debugging

Debug event logging is not compiled into the normal helper binary. Build the
separate debug binary first:

```sh
make -C native/linux-evdev-helper debug
```

Use the standalone wrapper:

```sh
cd main
npm run test:linux-evdev-helper -- --debug-events
```

If needed, force every event device:

```sh
npm run test:linux-evdev-helper -- --debug-events --all-devices
```

In debug mode the helper prints opened device names, selected key
capabilities, raw key events, current modifier state, and hotkey match attempts
to stderr. Normal app launches and public builds should not include
`--debug-events`.
