export interface ICvAdapter {
  loadImage: ((filePath: string) => Promise<ICvMat>) &
    ((buffer: Buffer) => Promise<ICvMat>);
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- temp
export interface ICvMat {}
