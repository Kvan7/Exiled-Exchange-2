import path from "path";
import { app, Tray, Menu, shell, nativeImage, dialog } from "electron";
import type { ServerEvents } from "./server";

export class AppTray {
  public overlayKey = "Shift + Space";
  private tray: Tray;
  private openSettings?: () => void;
  serverPort = 0;

  constructor(server: ServerEvents) {
    let trayImage = nativeImage.createFromPath(
      path.join(
        __dirname,
        process.env.STATIC!,
        process.platform === "win32" ? "icon.ico" : "icon.png",
      ),
    );

    if (process.platform === "darwin") {
      // Mac image size needs to be smaller, or else it looks huge. Size
      // guideline is from https://iconhandbook.co.uk/reference/chart/osx/
      trayImage = trayImage.resize({ width: 22, height: 22 });
    }

    this.tray = new Tray(trayImage);
    this.tray.setToolTip(`Exiled Exchange 2 v${app.getVersion()}`);
    this.rebuildMenu();

    server.onEventAnyClient("CLIENT->MAIN::user-action", ({ action }) => {
      if (action === "quit") {
        app.quit();
      }
    });
  }

  setOpenSettingsHandler(handler: () => void) {
    this.openSettings = handler;
    this.rebuildMenu();
  }

  rebuildMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Settings/League",
        click: () => {
          if (
            this.openSettings &&
            (process.env.WAYLAND_DISPLAY || process.env.VITE_DEV_SERVER_URL)
          ) {
            this.openSettings();
            return;
          }

          dialog.showMessageBox({
            title: "Settings",
            message: `Open Path of Exile 2 and press "${this.overlayKey}". Click on the button with cog icon there.`,
          });
        },
      },
      {
        label: "Open in Browser",
        click: () => {
          shell.openExternal(`http://127.0.0.1:${this.serverPort}`);
        },
      },
      { type: "separator" },
      {
        label: "Open config folder",
        click: () => {
          shell.openPath(path.join(app.getPath("userData"), "apt-data"));
        },
      },
      {
        label: "Quit",
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }
}
