import path from "path";
import { app } from "electron";
import { ServerEvents } from "../server";
import { promises as fs, existsSync } from "fs";
import { Logger } from "../RemoteLogger";

enum FileChannel {
  Item = "item",
  ClientLog = "client-log",
}

export class FileWriter {
  // NOTE: not just for csv now, but keeping for back combat
  private defaultUploadsPath = path.join(
    app.getPath("userData"),
    "apt-data",
    "csv-data",
  );

  private uploadsPath = this.defaultUploadsPath;

  private _state: {
    itemFile: fs.FileHandle | null;
    clientLogFile: fs.FileHandle | null;
  } = { itemFile: null, clientLogFile: null };

  private _enabled = false;

  constructor(
    private server: ServerEvents,
    private logger: Logger,
  ) {
    this.server.onEventAnyClient("CLIENT->MAIN::write-data", async (e) => {
      if (!this._enabled) return;
      if (
        e.action !== "log-item" &&
        e.action !== "session" &&
        e.action !== "client-log-event"
      )
        return;
      if (e.action === "client-log-event") {
        if (!this._state.clientLogFile) {
          this.openChannel(this.uploadsPath, FileChannel.ClientLog, true);
        }
        this.writeLine(e.data, FileChannel.ClientLog);
        if (e.close) {
          this.closeChannel(FileChannel.ClientLog);
        }
        return;
      }

      if (e.action === "log-item") {
        this.writeLine(e.text, FileChannel.Item);
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
        this.closeChannel(FileChannel.Item);
      }
    });
  }

  async restart(enabled: boolean, outputPath: string | null) {
    this._enabled = enabled;
    this.uploadsPath = outputPath ?? this.defaultUploadsPath;
    if (!this.uploadsPath.length) {
      this.uploadsPath = this.defaultUploadsPath;
    }
  }

  private async writeSessionStart(name: string, header: string) {
    try {
      if (!existsSync(this.uploadsPath)) {
        await fs.mkdir(this.uploadsPath, { recursive: true });
      }
      const filePath = path.join(this.uploadsPath, name + ".csv");
      if (await this.openChannel(filePath, FileChannel.Item)) {
        this.writeLine(header, FileChannel.Item);
      }
    } catch {
      this.logger.write("error [FileWriter] Failed to create session file.");
    }
  }

  private closeChannel(channel: FileChannel) {
    switch (channel) {
      case FileChannel.Item:
        if (!this._state.itemFile) {
          this.logger.write("error [FileWriter] Channel item already closed.");
          return;
        }
        this._state.itemFile.close();
        this._state.itemFile = null;
        break;
      case FileChannel.ClientLog:
        if (!this._state.clientLogFile) {
          this.logger.write(
            "error [FileWriter] Channel client-log already closed.",
          );
          return;
        }
        this._state.clientLogFile.close();
        this._state.clientLogFile = null;
        break;

      default:
        this.logger.write("error [FileWriter] Invalid channel.");
        break;
    }
  }

  private writeLine(line: string, channel: FileChannel) {
    switch (channel) {
      case FileChannel.Item:
        if (!this._state.itemFile) {
          this.logger.write(
            "error [FileWriter] Unable to write to channel item, channel closed.",
          );
          return;
        }
        this._state.itemFile.write(line + "\n");
        break;
      case FileChannel.ClientLog:
        if (!this._state.clientLogFile) {
          this.logger.write(
            "error [FileWriter] Unable to write to channel client-log, channel closed.",
          );
          return;
        }
        this._state.clientLogFile.write(line + "\n");
        break;

      default:
        this.logger.write("error [FileWriter] Invalid channel.");
        break;
    }
  }

  /**
   * Opens a channel, 'w' if file doesn't exist, 'a' if it does
   * @param filePath path to file
   * @param channel Which channel to open
   * @param overwrite if it should open in 'w' always
   * @returns true if a file was created, false if it already existed
   */
  private async openChannel(
    filePath: string,
    channel: FileChannel,
    overwrite: boolean = false,
  ): Promise<boolean> {
    const mode = overwrite || !existsSync(filePath) ? "w" : "a";

    const file = await fs.open(filePath, mode);
    switch (channel) {
      case FileChannel.Item:
        this._state.itemFile = file;
        break;
      case FileChannel.ClientLog:
        this._state.clientLogFile = file;
        break;

      default:
        this.logger.write("error [FileWriter] Invalid channel.");
        return false;
    }
    return mode === "w";
  }
}
