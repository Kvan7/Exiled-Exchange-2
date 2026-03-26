import path from "path";
import { app } from "electron";
import { ServerEvents } from "../server";
import { promises as fs, existsSync } from "fs";
import { Logger } from "../RemoteLogger";

export class FileWriter {
  private uploadsPath = path.join(
    app.getPath("userData"),
    "apt-data",
    "csv-data",
  );

  private _state: {
    file: fs.FileHandle;
  } | null = null;

  private _enabled = false;

  constructor(
    private server: ServerEvents,
    private logger: Logger,
  ) {
    this.server.onEventAnyClient("CLIENT->MAIN::write-data", async (e) => {
      if (!this._enabled) return;
      if (e.action !== "log-item" && e.action !== "session") return;
      if (e.action === "log-item") {
        this.writeLine(e.text);
        return;
      }
      // e.action === "session"
      if (e.start) {
        if (!e.name || !e.header) {
          this.logger.write("error [FileWriter] Invalid session start event.");
          return;
        }

        await this.writeSessionStart(e.name, e.header);
      } else {
        this.writeSessionEnd();
      }
    });
  }

  async restart(enabled: boolean) {
    this._enabled = enabled;
  }

  private async writeSessionStart(name: string, header: string) {
    try {
      if (!existsSync(this.uploadsPath)) {
        await fs.mkdir(this.uploadsPath, { recursive: true });
      }
      const filePath = path.join(this.uploadsPath, name + ".csv");
      if (!existsSync(filePath)) {
        const file = await fs.open(filePath, "w");
        this._state = { file };

        this.writeLine(header);
      } else {
        const file = await fs.open(filePath, "a");
        this._state = { file };
      }
    } catch {
      this.logger.write("error [FileWriter] Failed to create session file.");
    }
  }

  private writeSessionEnd() {
    if (!this._state) return;

    this._state.file.close();
    this._state = null;
  }

  private writeLine(line: string) {
    if (!this._state) return;

    this._state.file.write(line + "\n");
  }
}
