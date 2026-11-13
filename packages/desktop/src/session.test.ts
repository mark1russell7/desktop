import { describe, expect, it } from "vitest";
import { type DownloadSession, type PermissionSession, refuseDownloads, refusePermissions } from "./session.ts";

describe("refusePermissions", () => {
  it("refuses each request and each check", () => {
    let request: Parameters<PermissionSession["setPermissionRequestHandler"]>[0] | undefined;
    let check: Parameters<PermissionSession["setPermissionCheckHandler"]>[0] | undefined;
    refusePermissions({ setPermissionRequestHandler: (each) => (request = each), setPermissionCheckHandler: (each) => (check = each) });

    const answers: boolean[] = [];
    for (const permission of ["media", "notifications", "geolocation", "clipboard-read"]) request?.({}, permission, (granted) => answers.push(granted));
    expect(answers).toEqual([false, false, false, false]);
    expect(check?.()).toBe(false);
  });
});

describe("refuseDownloads", () => {
  it("cancels each download of the session", () => {
    let listener: Parameters<DownloadSession["on"]>[1] | undefined;
    const events: string[] = [];
    refuseDownloads({ on: (event, each) => ((listener = each), events.push(event)) });
    expect(events).toEqual(["will-download"]);
    const item = { cancelled: false, cancel: () => (item.cancelled = true) };
    const event = { prevented: false, preventDefault: () => (event.prevented = true) };
    listener?.(event, item);
    expect(event.prevented).toBe(true);
    expect(item.cancelled).toBe(true);
  });
});
