import type {
  IpcEvent,
  IpcEventPayload,
  LinuxHotkeyHelperDebugEvent,
  UpdateInfo,
  HostState,
} from "@ipc/types";
import { shallowRef } from "vue";
import Sockette from "sockette";

class HostTransport {
  private evBus = new EventTarget();
  private socket!: Sockette;
  logs = shallowRef("");
  version = shallowRef("0.0.00000");
  updateInfo = shallowRef<UpdateInfo>({ state: "initial" });
  linuxHotkeyHelperEventLog = shallowRef("");
  linuxHotkeyHelper = shallowRef<HostState["linuxHotkeyHelper"]>({
    isWayland: false,
    configured: false,
    running: false,
    elevation: "pkexec",
    command: null,
    capturing: [],
    error: null,
  });

  async init() {
    this.onEvent("MAIN->CLIENT::log-entry", (entry) => {
      this.logs.value += entry.message;
    });
    this.onEvent("MAIN->CLIENT::updater-state", (info) => {
      this.updateInfo.value = info;
    });
    this.onEvent("MAIN->CLIENT::linux-hotkey-helper-state", (state) => {
      this.linuxHotkeyHelper.value = state;
    });
    this.onEvent("MAIN->CLIENT::linux-hotkey-helper-debug-event", (event) => {
      this.appendLinuxHotkeyHelperEvent(event);
    });
    await new Promise((resolve) => {
      this.socket = new Sockette(`ws://${window.location.host}/events`, {
        onmessage: (e) => {
          this.selfDispatch(JSON.parse(e.data));
        },
        onopen: resolve,
      });
    });
  }

  private appendLinuxHotkeyHelperEvent(event: LinuxHotkeyHelperDebugEvent) {
    const time = new Date(event.at).toLocaleTimeString();
    const fields = [
      event.kind,
      event.id ? `id=${event.id}` : null,
      event.accelerator ? `accelerator=${event.accelerator}` : null,
      event.code ? `code=${event.code}` : null,
      event.device ? `device=${event.device}` : null,
      event.exitCode !== undefined ? `exitCode=${event.exitCode}` : null,
      event.signal ? `signal=${event.signal}` : null,
      event.helperTs !== undefined ? `helperTs=${event.helperTs}` : null,
      event.message,
    ].filter(Boolean);
    const lines = `${this.linuxHotkeyHelperEventLog.value}${time} ${fields.join(
      " ",
    )}\n`.split("\n");
    this.linuxHotkeyHelperEventLog.value = lines.slice(-200).join("\n");
  }

  selfDispatch(event: IpcEvent) {
    this.evBus.dispatchEvent(
      new CustomEvent(event.name, {
        detail: event.payload,
      }),
    );
  }

  sendEvent(event: IpcEvent) {
    this.socket.send(JSON.stringify(event));
  }

  onEvent<Name extends IpcEvent["name"]>(
    name: Name,
    cb: (payload: IpcEventPayload<Name>) => void,
  ): AbortController {
    const controller = new AbortController();
    if (!this.isElectron && name.startsWith("MAIN->OVERLAY")) {
      return controller;
    }

    this.evBus.addEventListener(
      name,
      (e) => {
        cb((e as CustomEvent<IpcEventPayload<Name>>).detail);
      },
      { signal: controller.signal },
    );
    return controller;
  }

  async getConfig(): Promise<string | null> {
    const response = await fetch("/config");
    const config = (await response.json()) as HostState;
    // TODO: refactor this
    this.version.value = config.version;
    this.updateInfo.value = config.updater;
    this.linuxHotkeyHelper.value = config.linuxHotkeyHelper;
    return config.contents;
  }

  async importFile(file: File): Promise<string> {
    const response = await fetch(`/uploads/${file.name}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: file,
    });
    const body = (await response.json()) as { name: string };
    return body.name;
  }

  proxy: (typeof window)["fetch"] = async (url, init) => {
    return await window.fetch(`/proxy/${url as string}`, init);
  };

  get isElectron() {
    return navigator.userAgent.includes("Electron");
  }
}

export const MainProcess = new HostTransport();
export const Host = MainProcess;
