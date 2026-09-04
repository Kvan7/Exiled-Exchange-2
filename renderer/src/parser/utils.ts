export function combinations<T>(arr: T[]): T[][] {
  return arr.reduce<T[][]>(
    (acc, curr) => [...acc, ...acc.map((a) => [...a, curr])],
    [[]],
  );
}

export function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
