import type { ServerEvents } from "../server";
import { app } from "electron";
import fs from "fs/promises";
import path from "path";

export class ConfigStore {
  private cfgPath = path.join(
    app.getPath("userData"),
    "apt-data",
    "config.json",
  );

  constructor(server: ServerEvents) {
    server.onEventAnyClient("CLIENT->MAIN::save-config", (cfg) => {
      this.save(cfg.contents, cfg.isTemporary);
      server.sendEventTo("broadcast", {
        name: "MAIN->CLIENT::config-changed",
        payload: { contents: cfg.contents },
      });
    });
  }

  async load(): Promise<string | null> {
    let contents: string | null = null;
    try {
      contents = await fs.readFile(this.cfgPath, "utf8");
    } catch {}
    return contents;
  }

  private async save(contents: string, tmp: boolean) {
    const cfgPath = tmp ? `${this.cfgPath}.tmp` : this.cfgPath;
    try {
      await fs.mkdir(path.dirname(cfgPath), { recursive: true });
      await fs.writeFile(cfgPath, contents);
    } catch {
      app.exit(1);
    }
  }
}
