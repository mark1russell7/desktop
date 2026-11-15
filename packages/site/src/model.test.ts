import { CONTENT_SECURITY_POLICY } from "@mark1russell7/desktop";
import { describe, expect, it } from "vitest";
import {
  DEMO_PAGE,
  checkMessage,
  directives,
  givesKeysBack,
  keyInputOf,
  keyText,
  loadFailure,
  navigate,
  netErrorName,
  refusingSession,
  requestPage,
  windowResult,
} from "./model.ts";

describe("the navigation demo", () => {
  it("keeps the window at the origin of its page", () => {
    expect(navigate(DEMO_PAGE, "app://page/settings.html")).toMatchObject({ window: true, site: false });
    expect(navigate(DEMO_PAGE, "https://example.com/")).toMatchObject({ window: false, site: true });
    expect(navigate(DEMO_PAGE, "app://other/index.html")).toMatchObject({ window: false, site: false });
  });

  it("stops javascript:, file: and the pages of the browser in each guard", () => {
    for (const target of ["javascript:alert(1)", "file:///etc/passwd", "chrome://settings", "not an address"]) {
      expect(navigate(DEMO_PAGE, target)).toMatchObject({ window: false, site: false });
    }
  });

  it("gives the origins of the page and of the target", () => {
    expect(navigate(DEMO_PAGE, "https://example.com/a")).toMatchObject({ pageOrigin: "app://page", targetOrigin: "https://example.com" });
    expect(navigate(DEMO_PAGE, "no").targetOrigin).toBeUndefined();
  });
});

describe("the page scheme demo", () => {
  it("serves a file of the page folder with the content security policy", async () => {
    const result = await requestPage("app://page/main.js");
    expect(result.status).toBe(200);
    expect(result.contentType).toBe("text/javascript; charset=utf-8");
    expect(result.policy).toBe(CONTENT_SECURITY_POLICY);
    expect(result.body).toContain("Notes");
  });

  it("serves index.html for the root of the scheme", async () => {
    expect((await requestPage("app://page/")).status).toBe(200);
  });

  it("gives 404 for an encoded path out of the folder, a backslash and another host", async () => {
    for (const address of ["app://page/..%2Fpackage.json", "app://page/..%5Cpackage.json", "app://other/index.html", "https://page/index.html"]) {
      const result = await requestPage(address);
      expect(result.status, address).toBe(404);
      expect(result.policy, address).toBeUndefined();
    }
  });

  it("shows that the URL parser removes a plain ../ before the handler sees it", async () => {
    const result = await requestPage("app://page/../package.json");
    expect(result.parsed).toBe("app://page/package.json");
    expect(result.status).toBe(404);
  });

  it("gives 404 for a text that is not an address", async () => {
    expect(await requestPage("page")).toMatchObject({ parsed: undefined, status: 404 });
  });
});

describe("the policy demo", () => {
  it("gives each directive of the policy with a meaning", () => {
    const list = directives();
    expect(list.map((each) => each.text).join("; ")).toBe(CONTENT_SECURITY_POLICY);
    for (const each of list) expect(each.meaning, each.text).not.toBe("");
  });
});

describe("the window demo", () => {
  it("refuses the web preferences of the caller", () => {
    const result = windowResult("app", '{"title":"Notes","webPreferences":{"nodeIntegration":true,"sandbox":false}}');
    expect(result.error).toBeUndefined();
    expect(result.refused).toEqual([
      { key: "nodeIntegration", asked: true, got: false },
      { key: "sandbox", asked: false, got: true },
    ]);
    expect(result.options).toMatchObject({ title: "Notes", show: false, webPreferences: { preload: "/opt/notes/preload.js" } });
  });

  it("tells the error of bad JSON and of an empty partition", () => {
    expect(windowResult("app", "{").error).toBeDefined();
    expect(windowResult("app", "[]").error).toBe("The options are a JSON object.");
    expect(windowResult("site", "").error).toContain("partition");
    expect(windowResult("site", "persist:sites").options).toMatchObject({ partition: "persist:sites", sandbox: true });
  });

  it("reads the size of a capture window", () => {
    expect(windowResult("capture", "390x844, persist:shots").options).toMatchObject({ width: 390, height: 844, webPreferences: { partition: "persist:shots", offscreen: true } });
    expect(windowResult("capture", "big").error).toBeDefined();
  });
});

describe("the load failure demo", () => {
  it("gives the reason and the advice of each code", () => {
    expect(loadFailure(-7).failure).toBe("timeout");
    expect(loadFailure(-102).failure).toBe("refused");
    expect(loadFailure(-105).failure).toBe("network");
    expect(loadFailure(-3)).toMatchObject({ failure: undefined, advice: expect.stringContaining("replaced") });
  });

  it("names the codes that it knows", () => {
    expect(netErrorName(-102)).toBe("ERR_CONNECTION_REFUSED");
    expect(netErrorName(-105)).toBe("ERR_NAME_NOT_RESOLVED");
    expect(netErrorName(-999)).toBeUndefined();
  });
});

describe("the message demo", () => {
  it("checks the type and the sender frame", () => {
    expect(checkMessage('{"type":"save"}', "save", "app://page/index.html")).toEqual({ error: undefined, typed: true, sender: true });
    expect(checkMessage('{"type":"save"}', "open", "https://example.com/")).toEqual({ error: undefined, typed: false, sender: false });
    expect(checkMessage('"save"', "save", null)).toEqual({ error: undefined, typed: false, sender: false });
    expect(checkMessage("{", "save", "app://page/").error).toBeDefined();
  });
});

describe("the key demo", () => {
  it("gives the keys back only for Escape with no modifier", () => {
    expect(givesKeysBack(keyInputOf({ key: "Escape", ctrlKey: false, altKey: false, metaKey: false }))).toBe(true);
    expect(givesKeysBack(keyInputOf({ key: "Escape", ctrlKey: true, altKey: false, metaKey: false }))).toBe(false);
    expect(givesKeysBack(keyInputOf({ key: "a", ctrlKey: false, altKey: false, metaKey: false }))).toBe(false);
    expect(keyText(keyInputOf({ key: "Escape", ctrlKey: true, altKey: true, metaKey: false }))).toBe("Ctrl+Alt+Escape");
    expect(keyText(keyInputOf({ key: " ", ctrlKey: false, altKey: false, metaKey: false }))).toBe("Space");
  });
});

describe("the session demo", () => {
  it("refuses each permission and each download", () => {
    const session = refusingSession();
    expect(session.request("media")).toBe(false);
    expect(session.request("notifications")).toBe(false);
    expect(session.check()).toBe(false);
    expect(session.download()).toEqual({ prevented: true, cancelled: true });
  });
});
