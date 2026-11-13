import { describe, expect, it } from "vitest";
import { returnsKeys } from "./keys.ts";

describe("returnsKeys", () => {
  it("gives the keys back to the page with Escape and no modifier", () => {
    const key = { type: "keyDown", key: "Escape", control: false, alt: false, meta: false };
    expect(returnsKeys(key)).toBe(true);
    expect(returnsKeys({ ...key, type: "keyUp" })).toBe(false);
    expect(returnsKeys({ ...key, control: true })).toBe(false);
    expect(returnsKeys({ ...key, alt: true })).toBe(false);
    expect(returnsKeys({ ...key, meta: true })).toBe(false);
    expect(returnsKeys({ ...key, key: "ArrowLeft" })).toBe(false);
  });
});
