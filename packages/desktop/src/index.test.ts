import type { BrowserWindow, IpcMainEvent, Input, Session, WebContents, protocol } from "electron";
import { describe, expect, it } from "vitest";
import * as desktop from "./index.ts";

/**
 * The type check of the tests (`tsconfig.test.json`) compiles this function, so each object of Electron must fit the
 * narrow part that a function of this package takes. Nothing calls the function: Electron is not installed here.
 */
function fitsElectron(window: BrowserWindow, contents: WebContents, session: Session, event: IpcMainEvent, input: Input, handle: typeof protocol.handle): void {
  desktop.showWhenReady(window, desktop.SHOW_TIMEOUT_MS, () => {});
  desktop.denyWindows(contents);
  desktop.restrictNavigation(contents, desktop.allowsSiteNavigation);
  desktop.refuseWebviews(contents);
  desktop.refusePermissions(session);
  desktop.refuseDownloads(session);
  desktop.allowsSender(desktop.PAGE_URL, event);
  desktop.returnsKeys(input);
  handle(desktop.PAGE_SCHEME, desktop.pageHandler("page", { contentType: () => "text/html" }));
}

describe("the entry of the package", () => {
  it("exports the functions and the constants", () => {
    expect(Object.keys(desktop).sort()).toEqual([
      "CONTENT_SECURITY_POLICY",
      "NET_ERRORS",
      "PAGE_SCHEME",
      "PAGE_SCHEME_PRIVILEGES",
      "PAGE_URL",
      "SHOW_TIMEOUT_MS",
      "allowsNavigation",
      "allowsSender",
      "allowsSiteNavigation",
      "captureWindowOptions",
      "denyWindows",
      "failureOf",
      "isMessage",
      "pageFile",
      "pageHandler",
      "pageUrlOf",
      "refuseDownloads",
      "refusePermissions",
      "refuseWebviews",
      "restrictNavigation",
      "returnsKeys",
      "showWhenReady",
      "siteViewPreferences",
      "windowOptions",
    ]);
    expect(typeof fitsElectron).toBe("function");
  });
});
