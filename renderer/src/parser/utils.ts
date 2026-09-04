export function combinations<T>(arr: T[]): T[][] {
  return arr.reduce<T[][]>(
    (acc, curr) => [...acc, ...acc.map((a) => [...a, curr])],
    [[]],
  );
}
