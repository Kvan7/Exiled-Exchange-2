import { expect, it } from "vitest";
import { init } from "@/assets/data";
import { setupTests } from "@specs/vitest.setup";
function sum(a: number, b: number) {
  return a + b;
}

it("adds 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});

it("init", async () => {
  setupTests();
  await init("en");
});
