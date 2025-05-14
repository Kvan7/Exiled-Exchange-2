export interface ISectionAdapter {
    transform(line: string): string;
}

export interface MappingRule {
    pattern: RegExp;
    replacement: string | ((match: RegExpMatchArray) => string);
}