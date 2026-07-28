import { magicBasetype } from "@/parser/magic-name";
import { beforeEach, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";

describe("Check Magic Name (en)", () => {
  beforeEach(async () => {
    setupTests();
    await init("en");
  });
  it("Should parse normal name", () => {
    const name = "Rattling Sceptre";
    expect(magicBasetype(name)).toBe("Rattling Sceptre");
  });
  it("Should parse magic name with suffix", () => {
    const name = "Cultist Greathammer of Nourishment";
    expect(magicBasetype(name)).toBe("Cultist Greathammer");
  });
  it("Should parse magic name with prefix", () => {
    const name = "Pulsing Antler Focus";
    expect(magicBasetype(name)).toBe("Antler Focus");
  });
  it("Should parse magic name with prefix and suffix", () => {
    const name = "Reaver's Temple Maul of Stunning";
    expect(magicBasetype(name)).toBe("Temple Maul");
  });
});

describe("Check Magic Name (cmn-Hant)", () => {
  beforeEach(async () => {
    setupTests({ language: "cmn-Hant" });
    await init("cmn-Hant");
  });
  it("Should parse normal name", () => {
    const name = "雜響權杖";
    expect(magicBasetype(name)).toBe("雜響權杖");
  });
  it("Should parse magic name with suffix", () => {
    const name = "營養之教徒巨錘";
    expect(magicBasetype(name)).toBe("教徒巨錘");
  });
  it("Should parse magic name with prefix", () => {
    const name = "脈衝的靈鹿法器";
    expect(magicBasetype(name)).toBe("靈鹿法器");
  });
  it("Should parse magic name with prefix and suffix", () => {
    const name = "掠奪者的擊暈之神殿重錘";
    expect(magicBasetype(name)).toBe("神殿重錘");
  });
});

describe("Check Magic Name (cmn-Hant) when UI returns english name", () => {
  beforeEach(async () => {
    setupTests({ language: "cmn-Hant" });
    await init("cmn-Hant");
  });
  it("Should parse normal name", () => {
    const name = "Rattling Sceptre";
    expect(magicBasetype(name)).toBe("Rattling Sceptre");
  });
  it("Should parse magic name with suffix", () => {
    const name = "Cultist Greathammer of Nourishment";
    expect(magicBasetype(name)).toBe("Cultist Greathammer");
  });
  it("Should parse magic name with prefix", () => {
    const name = "Pulsing Antler Focus";
    expect(magicBasetype(name)).toBe("Antler Focus");
  });
  it("Should parse magic name with prefix and suffix", () => {
    const name = "Reaver's Temple Maul of Stunning";
    expect(magicBasetype(name)).toBe("Temple Maul");
  });
});
