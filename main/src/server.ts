import { WebSocketServer, type WebSocket } from "ws";
import { type AddressInfo } from "net";
import { createServer } from "http";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import {
  IpcEvent,
  IpcEventPayload,
  HostState,
  LinuxHotkeyHelperStatus,
} from "../../ipc/types";
import { ConfigStore } from "./host-files/ConfigStore";
import { addFileUploadRoutes } from "./host-files/file-uploads";
import type { AppUpdater } from "./AppUpdater";
import type { Logger } from "./RemoteLogger";

export const server = createServer();
const websocketServer = new WebSocketServer({ noServer: true });
let lastActiveClient: WebSocket;
let debugOverlayCaptureProvider:
  | (() => Promise<Buffer | null>)
  | undefined;
let debugOverlayStateProvider:
  | (() => Promise<unknown>)
  | undefined;
let linuxHotkeyHelperStatusProvider = (): LinuxHotkeyHelperStatus => ({
  isWayland: Boolean(process.env.WAYLAND_DISPLAY),
  configured: false,
  running: false,
  elevation: "pkexec",
  command: null,
  capturing: [],
  error: null,
});

addFileUploadRoutes(server);

if (!process.env.VITE_DEV_SERVER_URL) {
  server.addListener("request", (req, res) => {
    if (
      req.url?.startsWith("/config") ||
      req.url?.startsWith("/uploads") ||
      req.url?.startsWith("/proxy")
    )
      return;

    const filePath = req.url === "/" ? "/index.html" : req.url!;
    switch (path.extname(filePath)) {
      case ".html":
        res.setHeader("content-type", "text/html");
        break;
      case ".js":
        res.setHeader("content-type", "text/javascript");
        break;
      case ".json":
        res.setHeader("content-type", "application/json");
        break;
      case ".svg":
        res.setHeader("content-type", "image/svg+xml");
        break;
    }

    fs.createReadStream(path.join(__dirname, filePath)).pipe(res);
  });
}

const evBus = new EventEmitter();

export function onEventAnyClient<Name extends IpcEvent["name"]>(
  name: Name,
  cb: (payload: IpcEventPayload<Name>) => void,
) {
  evBus.on(name, cb);
}

export function sendEventTo(
  target: "last-active" | "any" | "broadcast",
  event: IpcEvent,
) {
  const msg = JSON.stringify(event);
  if (target === "broadcast" || target === "any") {
    for (const client of websocketServer.clients) {
      client.send(msg);
    }
  } else if (lastActiveClient) {
    lastActiveClient.send(msg);
  }
}

export interface ServerEvents {
  onEventAnyClient: typeof onEventAnyClient;
  sendEventTo: typeof sendEventTo;
}
export const eventPipe = {
  onEventAnyClient,
  sendEventTo,
};

export function setLinuxHotkeyHelperStatusProvider(
  provider: () => LinuxHotkeyHelperStatus,
) {
  linuxHotkeyHelperStatusProvider = provider;
}

export function setDebugOverlayCaptureProvider(
  provider: () => Promise<Buffer | null>,
) {
  debugOverlayCaptureProvider = provider;
}

export function setDebugOverlayStateProvider(provider: () => Promise<unknown>) {
  debugOverlayStateProvider = provider;
}

server.on("upgrade", (req, socket, head) => {
  if (req.url !== "/events") {
    return req.destroy();
  }
  websocketServer.handleUpgrade(req, socket, head, (ws) => {
    websocketServer.emit("connection", ws, req);
  });
});

export async function startServer(
  appUpdater: AppUpdater,
  logger: Logger,
): Promise<number> {
  const configStore = new ConfigStore(eventPipe);

  websocketServer.on("connection", (socket) => {
    lastActiveClient = socket;
    socket.on("message", (bytes) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const event = JSON.parse(bytes.toString("utf-8")) as IpcEvent;
      if (event.name === "CLIENT->MAIN::used-recently") {
        lastActiveClient = socket;
      }
      evBus.emit(event.name, event.payload);
    });
    socket.on("close", () => {
      const clients = websocketServer.clients;
      if (clients.size === 1) {
        lastActiveClient = clients.values().next().value!;
        evBus.emit("CLIENT->MAIN::used-recently", { isOverlay: true });
      }
    });
    sendEventTo("last-active", {
      name: "MAIN->CLIENT::log-entry",
      payload: { message: logger.history },
    });
    sendEventTo("last-active", {
      name: "MAIN->CLIENT::linux-hotkey-helper-state",
      payload: linuxHotkeyHelperStatusProvider(),
    });
  });

  server.addListener("request", async (req, res) => {
    if (req.url === "/debug/overlay-screenshot" && process.env.VITE_DEV_SERVER_URL) {
      const image = await debugOverlayCaptureProvider?.();
      if (!image) {
        res.statusCode = 404;
        res.end("overlay window unavailable");
        return;
      }
      res.setHeader("content-type", "image/png");
      res.end(image);
      return;
    }

    if (req.url === "/debug/overlay-state" && process.env.VITE_DEV_SERVER_URL) {
      const state = await debugOverlayStateProvider?.();
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(state ?? null));
      return;
    }

    if (req.url === "/config") {
      res.setHeader("content-type", "application/json");
      const resBody: HostState = {
        version: app.getVersion(),
        updater: appUpdater.info,
        linuxHotkeyHelper: linuxHotkeyHelperStatusProvider(),
        contents: await configStore.load(),
      };
      res.end(JSON.stringify(resBody));
    }
  });

  let port = process.env.VITE_DEV_SERVER_URL ? 8584 : 0;
  let host = "127.0.0.1";
  // --listen=[host][:port]
  const listenOpt = process.argv.find((arg) => arg.startsWith("--listen"));
  if (listenOpt) {
    const [hostArg, portArg] = listenOpt.split("=")[1].split(":");
    if (hostArg) host = hostArg;
    if (portArg) port = parseInt(portArg, 10);
  }

  return await new Promise((resolve, reject) => {
    server
      .listen({ port, host })
      .once("error", reject)
      .once("listening", () => {
        resolve((server.address() as AddressInfo).port);
      });
  });
}
