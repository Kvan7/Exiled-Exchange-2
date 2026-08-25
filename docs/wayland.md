# Electron BrowserWindow API on Wayland — Reference for EE2 Overlay

Traced against Electron (Chromium 151.0.7894.0) source at
`~/Sources/electron`. All file references are relative to that repo.

---

## Method-by-method trace

### `show()`

**Source:** `shell/browser/native_window_views.cc:587`

```cpp
void NativeWindowViews::Show() {
  widget()->native_widget_private()->Show(GetRestoredState(), gfx::Rect());
  widget()->Activate();   // explicit activation request
  NotifyWindowShow();
  if (x11_util::IsX11())
    widget()->SetZOrderLevel(widget()->GetZOrderLevel());
}
```

`widget()->Activate()` calls `platform_window()->Activate()`, which on Wayland
issues an `xdg_activation_v1` token request to the compositor. Whether the
compositor grants focus is up to it. KWin honors the request only when it
considers the token valid (i.e., it originated from a genuine user interaction
event on the current active surface). Activation requests that arrive without a
compositor-endorsed token may be silently ignored or cause KWin to flash the
taskbar entry instead.

**Official docs note:** "On Wayland (Linux), the desktop environment may show
a notification or flash the app icon if the window or app is not already
focused."

**Verdict:** Works on Wayland. Maps the surface and requests focus. Whether
focus is granted depends on compositor focus-stealing prevention policy. Do
not use `show()` when you want the overlay to appear without disturbing the
focused game — see the EE2 pattern below.

---

### `showInactive()`

**Source:** `shell/browser/native_window_views.cc:609`

```cpp
void NativeWindowViews::ShowInactive() {
  widget()->ShowInactive();   // no Activate() call
  NotifyWindowShow();
  if (x11_util::IsX11())
    widget()->SetZOrderLevel(widget()->GetZOrderLevel());
}
```

Unlike `Show()`, this does not call `Activate()`. The intent is to map the
window surface without requesting focus.

**Official docs:** `win.showInactive()` — **"Not supported on Wayland (Linux)."**

On Wayland the behavior is undefined. There is no `xdg_toplevel` protocol
equivalent of X11's `_NET_WM_USER_TIME` suppress-activation hint. In practice
the window may map without focus or may behave identically to `show()`.

**Verdict:** Officially unsupported. Behavior is undefined on Wayland. Do not
rely on it.

---

### `focus()`

**Source:** `shell/browser/native_window_views.cc:571`

```cpp
void NativeWindowViews::Focus(bool focus) {
  if (!IsVisible()) return;   // no-op if window is hidden
  if (focus) {
    widget()->Activate();
  } else {
    widget()->Deactivate();
  }
}
```

**Critical guard:** `focus()` is a silent no-op if the window is not yet
visible. Always call `show()` first.

On Wayland, `Activate()` sends another `xdg_activation_v1` request. Against a
fullscreen game, KWin either denies it (overlay stays unfocused) or briefly
grants it (game immediately fights to reclaim focus). Either outcome is wrong
for an overlay that is supposed to sit passively on top of a running game.

**Verdict:** Functionally works on Wayland when the window is visible. Do NOT
use it in a game overlay context — it sends a compositor activation request
that creates a focus battle with the game. See EE2 findings below.

---

### `hide()`

**Source:** `shell/browser/native_window_views.cc:625`

```cpp
void NativeWindowViews::Hide() {
  widget()->Hide();
  NotifyWindowHide();
}
```

Clean, no platform guards. Unmaps the Wayland surface. The compositor returns
keyboard focus to whichever window previously held it.

**Verdict:** Works correctly on Wayland. The preferred close mechanism for an
overlay.

---

### `moveTop()`

**Source:** `shell/browser/native_window_views.cc:1035`

```cpp
void NativeWindowViews::MoveTop() {
  // TODO(julien.isorce): fix chromium in order to use existing widget()->StackAtTop().
#if BUILDFLAG(IS_WIN)
  ::SetWindowPos(..., SWP_NOACTIVATE | ...);
#else
  if (x11_util::IsX11())
    electron::MoveWindowToForeground(static_cast<x11::Window>(...));
#endif
}
```

The Wayland branch is entirely absent.

**Official docs:** `win.moveTop()` — **"Not supported on Wayland (Linux)."**

**Verdict:** Confirmed no-op on Wayland.

---

### `setAlwaysOnTop(true, level)`

**Source:** `shell/browser/api/electron_api_base_window.cc:569`,
`shell/browser/native_window_views.cc:1169`

```cpp
void BaseWindow::SetAlwaysOnTop(bool top, gin::Arguments* args) {
  std::string level = "floating";
  ui::ZOrderLevel z_order =
      top ? ui::ZOrderLevel::kFloatingWindow : ui::ZOrderLevel::kNormal;
  window_->SetAlwaysOnTop(z_order, level, relative_level);
}

void NativeWindowViews::SetAlwaysOnTop(
    const ui::ZOrderLevel z_order,
    const std::string& level,
    const int relativeLevel) {
  widget()->SetZOrderLevel(z_order);
  // level string only used for Windows behind_task_bar_ logic
}
```

**The `level` parameter (`"screen-saver"` etc.) is `_macOS_ _Windows_` only.**
On Linux the string is silently discarded. All truthy level values map
identically to `ui::ZOrderLevel::kFloatingWindow`.

`widget()->SetZOrderLevel(kFloatingWindow)` goes through Chromium's ozone
layer to the Wayland platform window. The compositor effect is undefined —
there is no `zwlr_layer_shell_v1` in use.

**Official docs:** `win.setAlwaysOnTop()` — **"Not supported on Wayland (Linux)."**

**Verdict:** Level string has no effect on Linux. The boolean may produce a
compositor-dependent stacking hint. Set it once at window creation and do not
toggle it on every show/hide: each `SetZOrderLevel` call routes to the platform
window and may trigger a compositor recompositing cycle, which on some versions
of KWin manifests as a brief focus change.

---

### `setVisibleOnAllWorkspaces(true)`

**Source:** `shell/browser/api/electron_api_base_window.cc:817`,
`shell/browser/native_window_views.cc:1681`

```cpp
void NativeWindowViews::SetVisibleOnAllWorkspaces(
    bool visible,
    bool visibleOnFullScreen,
    bool skipTransformProcessType) {
  widget()->SetVisibleOnAllWorkspaces(visible);
  // visibleOnFullScreen and skipTransformProcessType silently ignored on Linux
}
```

**`visibleOnFullScreen: true` is `_macOS_` only.** On Linux the option is
accepted at the JS layer and discarded before the native call. The `visible`
boolean does have effect on Wayland via whatever sticky-workspace protocol the
compositor supports.

**Verdict:** Works on Linux. The boolean is operative. The `visibleOnFullScreen`
option does nothing on Linux — omit it or pass it for macOS compatibility only.

---

### `setIgnoreMouseEvents(bool)`

**Source:** `shell/browser/native_window_views.cc:1371`

```cpp
void NativeWindowViews::SetIgnoreMouseEvents(bool ignore, bool forward) {
#if BUILDFLAG(IS_WIN)
  // WS_EX_TRANSPARENT | WS_EX_LAYERED
#else
  if (x11_util::IsX11()) {
    // X11 Shape extension — sets a 1x1 input region
  }
#endif
}
```

The Wayland branch is entirely absent.

**Verdict:** Confirmed no-op on Wayland. Mouse passthrough cannot be controlled
from Electron on Wayland. Surface visibility (`hide()`) is the only available
input suppression mechanism.

---

### `globalShortcut.register()` on Wayland

`globalShortcut` is not a BrowserWindow method but its behavior on Wayland is
critical for EE2.

On a Wayland session that includes XWayland (which PoE2 runs under), Electron's
`globalShortcut.register()` falls back to `XGrabKey` on the X11 display. This
has two consequences:

1. **Double-fire.** Any shortcut registered via `globalShortcut` that is also
   handled by the evdev helper fires twice: once from the evdev helper and once
   from the `globalShortcut` callback. The `globalShortcut` callback has no
   `poeWindow.isActive` gate — it calls `runAction()` unconditionally. For
   `toggle-overlay` this means the overlay opens and immediately closes in the
   same event cycle.

2. **XGrabKey interference.** `XGrabKey` temporarily diverts the grabbed keys
   away from the focused XWayland window (PoE2). This disrupts PoE2's own key
   handling and can manifest as input stuttering or focus loss in the game.

**Verdict:** Do not call `globalShortcut.register()` on Wayland. The evdev
helper (`linux-evdev-wayland-helper`) is the correct hotkey backend for
Wayland and already handles all registered actions.

---

## Summary table

| API | Wayland status | Notes |
|-----|---------------|-------|
| `show()` | Works | Requests focus via xdg_activation_v1; may fight fullscreen game |
| `showInactive()` | **Not supported** | Officially unsupported; undefined behavior |
| `focus()` | Works (if visible) | Sends activation request; causes focus battle with fullscreen game |
| `hide()` | Works | Clean surface unmap; compositor returns focus to previous window |
| `moveTop()` | **No-op** | No Wayland code path |
| `setAlwaysOnTop(true, level)` | Partial | Level string ignored; bool may have compositor-dependent effect |
| `setVisibleOnAllWorkspaces(true)` | Works | `visibleOnFullScreen` param is macOS-only, ignored on Linux |
| `setIgnoreMouseEvents(bool)` | **No-op** | No Wayland code path; use `hide()` instead |
| `globalShortcut.register()` | **Do not use** | Falls back to XGrabKey; double-fires with evdev helper, disrupts XWayland input |

---

## EE2 overlay pattern on Wayland

### What went wrong and why

**`electron-overlay-window` calling `showInactive()` on XWayland focus events.**
`OverlayController.attachByTitle(window, title)` stores a reference to the
Electron BrowserWindow and registers internal listeners on the library's event
emitter. When the library's native X11 code detects PoE2 (running under
XWayland) gaining focus, it calls `this.electronWindow.showInactive()` directly
— bypassing all application-level guards. On a Wayland session this caused the
overlay to appear every time PoE2 gained focus, with no way to stop it short of
not calling `attachByTitle`. Fix: skip `OverlayController.attachByTitle()` on
Wayland entirely. `GameWindow.attach()` gates the call with `!isWayland()`.

**`globalShortcut` double-firing toggle actions.**
After each `assertGameActive()` call, `poeWindow.isActive` changes to `true`,
which fires `active-change(true)`, which triggers `Shortcuts.register()`. On
Wayland this was registering all actions via `globalShortcut`, which uses
XGrabKey under XWayland. The `globalShortcut` callback calls `runAction()`
with no activity gate. Combined with the evdev helper also firing the same
hotkey, `toggle-overlay` would open and immediately close. Fix:
`Shortcuts.register()` and `unregister()` now return early on Wayland.

**`focus()` and `setAlwaysOnTop` toggling causing activation fights.**
Calling `focus()` after `show()` sends `xdg_activation_v1`. Against a
fullscreen game this either fails silently (overlay stays unfocused) or
triggers a brief focus steal that PoE2 immediately reverses — causing the blur
handler to fire, which hides the overlay, which re-registers shortcuts, which
re-caused the problem above. Separately, toggling `setAlwaysOnTop` on every
show/hide call causes KWin to re-evaluate the window's compositor layer on
each call, which can manifest as a focus event. Fix: `focus()` is not called
on Wayland; `setAlwaysOnTop` is called once at window creation.

**`moveTop()` and `setIgnoreMouseEvents()` being no-ops.**
Both were present in earlier iterations of the code. Neither has a Wayland
code path. Removed.

### The correct Wayland pattern for EE2

**Window creation (once):**
```typescript
new BrowserWindow({
  show: false, frame: false, transparent: true,
  alwaysOnTop: true, focusable: true, skipTaskbar: true,
  ...
})
window.setAlwaysOnTop(true)           // set once; never toggled
window.setVisibleOnAllWorkspaces(true) // set once; never toggled
```

**Open:**
```typescript
window.setBounds(display.bounds)
window.show()   // maps surface; no focus() call — game keeps keyboard focus
```

**Close:**
```typescript
window.hide()   // unmaps surface; compositor returns focus to game
```

**Hotkeys:** evdev helper (`linux-evdev-wayland-helper`) only. `globalShortcut`
is not registered on Wayland.

**Game focus tracking:** `GameWindow._isActive` is initialized to `true` on
Wayland (game assumed focused at startup). `OverlayWindow.assertOverlayActive()`
sets it `false`; `assertGameActive()` sets it `true`. `OverlayController`
focus/blur events are ignored on Wayland — the library's X11 detection is
unreliable in a mixed Wayland/XWayland session and its `attachByTitle` path
would call `showInactive()` on our window.
