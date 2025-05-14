import { ISectionAdapter } from "./ISectionAdapter";

export class DefaultAdapter implements ISectionAdapter {
    transform(line: string): string {
        return line;
    }
}