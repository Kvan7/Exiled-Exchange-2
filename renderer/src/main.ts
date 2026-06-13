import { createApp, watch } from "vue";
import App from "./web/App.vue";
import * as I18n from "./web/i18n";
import * as Data from "./assets/data";
import { initConfig, AppConfig } from "./web/Config";
import { Host } from "./web/background/IPC";

function markBoot(step: string, error?: unknown) {
  if (!import.meta.env.DEV) return;
  (window as unknown as { __EE2_BOOT?: unknown }).__EE2_BOOT = {
    step,
    error: error instanceof Error ? error.message : String(error ?? ""),
    at: Date.now(),
  };
}

(async function () {
  try {
    markBoot("initConfig:start");
    await initConfig();
    markBoot("i18n:start");
    const i18nPlugin = await I18n.init(AppConfig().language);
    markBoot("data:start");
    await Data.init(AppConfig().language);
    markBoot("host:init");
    await Host.init();

    watch(
      () => AppConfig().language,
      async () => {
        await Data.loadForLang(AppConfig().language);
        await I18n.loadLang(AppConfig().language);
      },
    );

    markBoot("mount:start");
    const app = createApp(App);
    app.use(i18nPlugin);
    app.mount("#app");
    markBoot("mounted");
    if (import.meta.env.DEV) {
      app.config.performance = true;
      console.error("DEV MODE");
    }
  } catch (error) {
    markBoot("error", error);
    console.error(error);
  }
})();
