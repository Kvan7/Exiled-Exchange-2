import type {
  IpcEvent,
  IpcEventPayload,
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

  async init() {
    this.onEvent("MAIN->CLIENT::log-entry", (entry) => {
      this.logs.value += entry.message;
    });
    this.onEvent("MAIN->CLIENT::updater-state", (info) => {
      this.updateInfo.value = info;
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
    const fullUrl = `/proxy/${url as string}`;
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await window.fetch(fullUrl, init);
        if (response.ok) return response;

        const ct = response.headers.get("content-type") ?? "?";
        const preview = await response.text().then(
          (t) => t.slice(0, 120).replace(/\s+/g, " "),
          () => "(unreadable)",
        );
        console.error(
          `[proxy] ${String(url)} attempt ${attempt}/3: ${response.status} ${response.statusText} ct=${ct} body="${preview}"`,
        );
        lastError = new Error(`${response.status} ${response.statusText}`);
      } catch (e) {
        console.error(
          `[proxy] ${String(url)} attempt ${attempt}/3: network error: ${String(e)}`,
        );
        lastError = e;
      }

      if (attempt < 3) {
        const signal = (init as RequestInit | undefined)?.signal;
        await new Promise<void>((resolve, reject) => {
          const id = setTimeout(resolve, 1000);
          signal?.addEventListener(
            "abort",
            () => {
              clearTimeout(id);
              reject(lastError);
            },
            { once: true },
          );
        });
      }
    }

    throw lastError;
  };

  get isElectron() {
    return navigator.userAgent.includes("Electron");
  }
}

export const MainProcess = new HostTransport();
export const Host = MainProcess;
