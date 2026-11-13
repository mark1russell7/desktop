/**
 * The options of the windows and the views: the page has no Node.js, operates in a sandbox, and is isolated from its
 * preload script.
 *
 * @packageDocumentation
 */
import type { BrowserWindowConstructorOptions, WebPreferences } from "electron";

/** The preferences of each window and view. The page has no Node.js and no `<webview>`, and it operates in a sandbox. */
const ISOLATED: WebPreferences = {
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
  nodeIntegrationInWorker: false,
  webSecurity: true,
  allowRunningInsecureContent: false,
  webviewTag: false,
};

/** The options of a window that `windowOptions` lets the caller set. The web preferences are not part of them. */
export type WindowOptions = Omit<BrowserWindowConstructorOptions, "webPreferences">;

/**
 * This function gives the options of the window of the app. The page has no Node.js, operates in a sandbox, and is
 * isolated from the preload script. Only the preload script gets the message ports of the main process.
 *
 * The window is 1200 by 800 and hidden by default. `showWhenReady` shows it at the first paint. The `options` replace
 * these defaults. They cannot change the web preferences.
 *
 * @param preload - The path of the preload script.
 * @param options - The size, the title and the other options of the window.
 */
export function windowOptions(preload: string, options: WindowOptions = {}): BrowserWindowConstructorOptions {
  return { width: 1200, height: 800, show: false, ...options, webPreferences: { preload, ...ISOLATED } };
}

/**
 * This function gives the preferences of a view of a site that the app does not trust. The view has no preload script,
 * no Node.js and a sandbox. Its session is not the session of the page, so the site cannot read the data of the page.
 *
 * @param partition - The session of the views, for example `persist:sites`. It must not be empty.
 */
export function siteViewPreferences(partition: string): WebPreferences {
  if (partition === "") throw new RangeError("The partition of a site view must not be empty: the empty partition is the session of the page.");
  return { partition, ...ISOLATED };
}

/** The size of a capture window, in pixels of its content. A size of `@mark1russell7/layout-contract` has these fields. */
export interface CaptureSize {
  readonly w: number;
  readonly h: number;
}

/**
 * This function gives the options of a window that captures a site off the screen. The window has the preferences of
 * `siteViewPreferences`. It has no place in the taskbar, and it cannot get the keys.
 *
 * @param size - The size of the content of the window.
 * @param partition - The session of the views of the sites.
 */
export function captureWindowOptions(size: CaptureSize, partition: string): BrowserWindowConstructorOptions {
  return {
    width: size.w,
    height: size.h,
    useContentSize: true,
    show: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: { ...siteViewPreferences(partition), offscreen: true },
  };
}

/**
 * The longest time that a window stays hidden, in milliseconds. A window shows at the first paint of its page. A fault
 * of the GPU process can stop that paint, so after this time the window shows without it.
 */
export const SHOW_TIMEOUT_MS = 4000;

/** The part of a window that `showWhenReady` uses. A `BrowserWindow` has it. */
export interface ShownWindow {
  once(event: "ready-to-show", listener: () => void): unknown;
  isDestroyed(): boolean;
  isVisible(): boolean;
  show(): void;
}

/**
 * This function shows a hidden window at the first paint of its page. Without a paint in `timeoutMs`, it shows the
 * window all the same and tells `log` why. A window that closed before stays closed.
 *
 * @param window - The hidden window.
 * @param timeoutMs - The longest wait for the first paint, for example `SHOW_TIMEOUT_MS`.
 * @param log - The function that gets the message when the window shows before its first paint.
 */
export function showWhenReady(window: ShownWindow, timeoutMs: number, log: (message: string) => void): void {
  const show = (): void => {
    if (!window.isDestroyed() && !window.isVisible()) window.show();
  };
  window.once("ready-to-show", show);
  setTimeout(() => {
    if (window.isDestroyed() || window.isVisible()) return;
    log(`the page did not paint in ${String(timeoutMs)} ms, so the window shows before its first paint`);
    show();
  }, timeoutMs).unref();
}
