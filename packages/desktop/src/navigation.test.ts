import { describe, expect, it } from "vitest";
import {
  type NavigatingContents,
  type PreventableEvent,
  type WebviewContents,
  allowsNavigation,
  allowsSiteNavigation,
  denyWindows,
  refuseWebviews,
  restrictNavigation,
} from "./navigation.ts";

const PAGE = "app://page/index.html";

/** An event that records a stop. */
function event(): PreventableEvent & { prevented: boolean } {
  const result = { prevented: false, preventDefault: () => (result.prevented = true) };
  return result;
}

describe("allowsNavigation", () => {
  it("keeps the window at the origin of its page", () => {
    expect(allowsNavigation(PAGE, "app://page/settings.html")).toBe(true);
    expect(allowsNavigation(PAGE, "app://other/index.html")).toBe(false);
    expect(allowsNavigation(PAGE, "https://example.com/")).toBe(false);
    expect(allowsNavigation("http://localhost:5173/", "http://localhost:5173/a")).toBe(true);
    expect(allowsNavigation("http://localhost:5173/", "http://localhost:5174/")).toBe(false);
    expect(allowsNavigation(PAGE, "not an address")).toBe(false);
    expect(allowsNavigation("not an address", "not an address")).toBe(false);
  });
});

describe("allowsSiteNavigation", () => {
  it("lets a site go only to web addresses", () => {
    expect(allowsSiteNavigation("https://a.example/next")).toBe(true);
    expect(allowsSiteNavigation("http://a.example/")).toBe(true);
    for (const url of ["file:///C:/secret.txt", PAGE, "javascript:alert(1)", "chrome://settings", "not an address"]) {
      expect(allowsSiteNavigation(url), url).toBe(false);
    }
  });
});

describe("denyWindows", () => {
  it("opens no new window", () => {
    let handler: (() => { action: "deny" }) | undefined;
    denyWindows({ setWindowOpenHandler: (each) => (handler = each) });
    expect(handler?.()).toEqual({ action: "deny" });
  });
});

describe("restrictNavigation", () => {
  it("stops each navigation that the rule refuses, and lets the others go", () => {
    let listener: Parameters<NavigatingContents["on"]>[1] | undefined;
    const events: string[] = [];
    restrictNavigation({ on: (name, each) => ((listener = each), events.push(name)) }, (url) => allowsNavigation(PAGE, url));
    expect(events).toEqual(["will-navigate"]);

    const inside = event();
    listener?.(inside, "app://page/settings.html");
    expect(inside.prevented).toBe(false);

    const outside = event();
    listener?.(outside, "https://example.com/");
    expect(outside.prevented).toBe(true);
  });
});

describe("refuseWebviews", () => {
  it("attaches no webview", () => {
    let listener: Parameters<WebviewContents["on"]>[1] | undefined;
    const events: string[] = [];
    refuseWebviews({ on: (name, each) => ((listener = each), events.push(name)) });
    expect(events).toEqual(["will-attach-webview"]);
    const attach = event();
    listener?.(attach);
    expect(attach.prevented).toBe(true);
  });
});
