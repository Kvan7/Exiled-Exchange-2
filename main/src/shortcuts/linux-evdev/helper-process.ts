import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { app } from "electron";
import { buildLaunchConfig } from "./config";
import { buildHelperSpawnCommand } from "./launch-command";
import { NdjsonParser } from "./ndjson";
import type { Logger } from "../../RemoteLogger";
import type {
  HelperEvent,
  LinuxEvdevHelperConfig,
  ShortcutActionWithId,
} from "./types";

export class LinuxEvdevHelperProcess extends EventEmitter {
  private child?: ChildProcessWithoutNullStreams;
  private parser = new NdjsonParser<HelperEvent>(
    (message) => this.handleMessage(message),
    (line, error) => {
      this.logger.write(
        `warn [linux-evdev-helper] Ignoring invalid helper output: ${error.message}: ${line}`,
      );
    },
  );

  constructor(
    private logger: Logger,
    private config: LinuxEvdevHelperConfig,
    private actions: ShortcutActionWithId[],
  ) {
    super();
  }

  start() {
    if (process.platform !== "linux") {
      throw new Error("linux-evdev-helper is only available on Linux");
    }

    const launchConfig = buildLaunchConfig(this.config, this.actions);
    const helperPath = resolveHelperPath(this.config.helperPath);
    const spawnCommand = buildHelperSpawnCommand(
      helperPath,
      this.config.elevation ?? "pkexec",
    );

    this.child = spawn(spawnCommand.command, spawnCommand.args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    this.child.stdout.on("data", (chunk) => this.parser.push(chunk));
    this.child.stderr.on("data", (chunk) => {
      for (const line of chunk.toString().split(/\r?\n/)) {
        if (line.trim()) {
          this.logger.write(`warn [linux-evdev-helper] ${line.trim()}`);
        }
      }
    });
    this.child.on("error", (error) => {
      this.logger.write(`error [linux-evdev-helper] ${error.message}`);
      this.emit("error-event", error);
    });
    this.child.on("exit", (code, signal) => {
      this.parser.flush();
      this.child = undefined;
      if (code !== 0 && signal == null) {
        this.logger.write(
          `error [linux-evdev-helper] exited with code ${code ?? "unknown"}`,
        );
      }
      this.emit("exit", code, signal);
    });

    this.child.stdin.end(`${JSON.stringify(launchConfig)}\n`);
  }

  stop() {
    const child = this.child;
    this.child = undefined;
    if (!child || child.killed) return;
    child.kill("SIGTERM");
  }

  private handleMessage(message: HelperEvent) {
    if (message.type === "error") {
      this.logger.write(
        `error [linux-evdev-helper] ${message.code}: ${message.message}${
          message.device ? ` (${message.device})` : ""
        }`,
      );
    }
    this.emit("message", message);
  }
}

export function resolveHelperPath(helperPath?: string) {
  const configured = helperPath ?? process.env.EXILED_EXCHANGE_LINUX_HOTKEY_HELPER;
  if (configured) {
    if (!path.isAbsolute(configured)) {
      throw new Error("linux-evdev-helper helperPath must be absolute");
    }
    return configured;
  }

  if (app.isPackaged) {
    return path.join(process.resourcesPath, "app.asar.unpacked", "linux-evdev-helper");
  }

  const sourceHelper = path.resolve(
    process.cwd(),
    "../native/linux-evdev-helper/linux-evdev-helper",
  );
  if (fs.existsSync(sourceHelper)) return sourceHelper;

  const distHelper = path.resolve(process.cwd(), "dist/linux-evdev-helper");
  if (fs.existsSync(distHelper)) return distHelper;

  return sourceHelper;
}
