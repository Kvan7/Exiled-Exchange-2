export const TIP_COUNT = 30; // v0.7.0

export function randomTip(): number {
  // random from 1 to TIP_COUNT
  return Math.floor(Math.random() * TIP_COUNT) + 1;
}
