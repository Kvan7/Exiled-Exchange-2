import { DefaultAdapter } from "./default";
import { ISectionAdapter } from "./ISectionAdapter";
import { ThaiAdapter } from "./thai";

export function createAdapter(lang: string): ISectionAdapter {
    switch (lang) {
        case "th":
            return new ThaiAdapter();
        default:
            return new DefaultAdapter(); // default adapter is just a simple passthrough
    }
}