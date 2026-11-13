import { describe, expect, it } from "vitest";
import { allowsSender, isMessage } from "./ipc.ts";

const PAGE = "app://page/index.html";

describe("isMessage", () => {
  it("accepts an object with the type, and refuses each other value", () => {
    expect(isMessage({ type: "save", data: 1 }, "save")).toBe(true);
    for (const value of [{ type: "load" }, {}, null, undefined, "save", 1, ["save"]]) expect(isMessage(value, "save"), String(value)).toBe(false);
  });

  it("narrows the type of the value", () => {
    const value: unknown = { type: "save" };
    if (isMessage(value, "save")) {
      const type: "save" = value.type;
      expect(type).toBe("save");
    }
  });
});

describe("allowsSender", () => {
  it("accepts a frame at the origin of the page, and refuses another origin or a frame that is gone", () => {
    expect(allowsSender(PAGE, { senderFrame: { url: "app://page/index.html" } })).toBe(true);
    expect(allowsSender(PAGE, { senderFrame: { url: "app://page/other.html" } })).toBe(true);
    expect(allowsSender(PAGE, { senderFrame: { url: "https://example.com/" } })).toBe(false);
    expect(allowsSender(PAGE, { senderFrame: { url: "about:blank" } })).toBe(false);
    expect(allowsSender(PAGE, { senderFrame: null })).toBe(false);
  });
});
