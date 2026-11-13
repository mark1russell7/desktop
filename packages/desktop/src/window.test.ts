import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SHOW_TIMEOUT_MS, type ShownWindow, captureWindowOptions, showWhenReady, siteViewPreferences, windowOptions } from "./window.ts";

const ISOLATED = {
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
  nodeIntegrationInWorker: false,
  webSecurity: true,
  allowRunningInsecureContent: false,
  webviewTag: false,
};

describe("windowOptions", () => {
  it("gives the page no Node.js, a sandbox and an isolated preload script", () => {
    const options = windowOptions("preload.cjs");
    expect(options.webPreferences).toEqual({ preload: "preload.cjs", ...ISOLATED });
    expect(options).toMatchObject({ width: 1200, height: 800, show: false });
  });

  it("takes the size and the title of the window, but not its web preferences", () => {
    const window = { width: 1400, height: 900, minWidth: 720, title: "app", webPreferences: { sandbox: false, nodeIntegration: true } };
    // A caller in JavaScript, or a cast, can still give web preferences: they do not apply
    const options = windowOptions("preload.cjs", window as Parameters<typeof windowOptions>[1]);
    expect(options).toMatchObject({ width: 1400, height: 900, minWidth: 720, title: "app", show: false });
    expect(options.webPreferences).toEqual({ preload: "preload.cjs", ...ISOLATED });
  });
});

describe("siteViewPreferences", () => {
  it("gives a site no preload script, no Node.js, a sandbox and its own session", () => {
    const preferences = siteViewPreferences("persist:sites");
    expect(preferences).toEqual({ partition: "persist:sites", ...ISOLATED });
    expect(preferences.preload).toBeUndefined();
  });

  it("refuses the empty partition, which is the session of the page", () => {
    expect(() => siteViewPreferences("")).toThrow(RangeError);
  });
});

describe("captureWindowOptions", () => {
  it("renders off the screen, with the size of the capture and the rules of the views of the sites", () => {
    const options = captureWindowOptions({ w: 1280, h: 800 }, "persist:sites");
    expect(options).toMatchObject({ width: 1280, height: 800, useContentSize: true, show: false, skipTaskbar: true, focusable: false });
    expect(options.webPreferences).toEqual({ ...siteViewPreferences("persist:sites"), offscreen: true });
  });
});

describe("showWhenReady", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** A hidden window that records each show. `paint` starts its listener of the first paint. */
  function hiddenWindow(): ShownWindow & { shows: number; destroyed: boolean; paint: () => void } {
    let ready = (): void => {};
    const window = {
      shows: 0,
      destroyed: false,
      once: (_event: "ready-to-show", listener: () => void) => {
        ready = listener;
      },
      isDestroyed: () => window.destroyed,
      isVisible: () => window.shows > 0,
      show: () => {
        window.shows += 1;
      },
      paint: () => ready(),
    };
    return window;
  }

  it("shows the window at the first paint, and logs nothing", () => {
    const window = hiddenWindow();
    const log = vi.fn();
    showWhenReady(window, SHOW_TIMEOUT_MS, log);
    expect(window.shows).toBe(0);
    window.paint();
    expect(window.shows).toBe(1);
    vi.advanceTimersByTime(SHOW_TIMEOUT_MS);
    expect(window.shows).toBe(1);
    expect(log).not.toHaveBeenCalled();
  });

  it("shows the window after the time limit when the page does not paint, and tells why", () => {
    const window = hiddenWindow();
    const log = vi.fn();
    showWhenReady(window, 4000, log);
    vi.advanceTimersByTime(3999);
    expect(window.shows).toBe(0);
    vi.advanceTimersByTime(1);
    expect(window.shows).toBe(1);
    expect(log).toHaveBeenCalledWith("the page did not paint in 4000 ms, so the window shows before its first paint");
    window.paint();
    expect(window.shows).toBe(1);
  });

  it("does not show a window that closed", () => {
    const window = hiddenWindow();
    const log = vi.fn();
    showWhenReady(window, 4000, log);
    window.destroyed = true;
    vi.advanceTimersByTime(4000);
    window.paint();
    expect(window.shows).toBe(0);
    expect(log).not.toHaveBeenCalled();
  });
});
