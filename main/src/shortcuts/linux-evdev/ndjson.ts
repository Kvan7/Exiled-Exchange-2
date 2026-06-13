export class NdjsonParser<T> {
  private buffer = "";

  constructor(
    private onMessage: (message: T) => void,
    private onInvalidLine: (line: string, error: Error) => void,
  ) {}

  push(chunk: string | Buffer) {
    this.buffer += chunk.toString();
    for (;;) {
      const newline = this.buffer.indexOf("\n");
      if (newline === -1) return;

      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;

      try {
        this.onMessage(JSON.parse(line) as T);
      } catch (error) {
        this.onInvalidLine(line, error as Error);
      }
    }
  }

  flush() {
    const line = this.buffer.trim();
    this.buffer = "";
    if (!line) return;

    try {
      this.onMessage(JSON.parse(line) as T);
    } catch (error) {
      this.onInvalidLine(line, error as Error);
    }
  }
}

