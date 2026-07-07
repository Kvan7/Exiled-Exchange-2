export interface ICvAdapter {
  loadImage: ((filePath: string) => Promise<ICvMat>) &
    ((buffer: Buffer) => Promise<ICvMat>);
}

export interface ICvMat {}
