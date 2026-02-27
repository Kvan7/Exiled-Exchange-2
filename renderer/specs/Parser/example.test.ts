import { expect, test } from "vitest";
import { init } from "@/assets/data";
import { setupTests } from "@specs/vitest.setup";
function sum(a: number, b: number) {
  return a + b;
}

test("adds 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});

test("init", async () => {
  setupTests();
  await init("en");
});
