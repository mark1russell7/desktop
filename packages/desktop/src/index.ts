/**
 * The safe defaults of the main process of an Electron app. The package has the content security policy, the options of
 * the windows and the rules of navigation. It also refuses permissions and downloads, serves the page under `app://`,
 * reads the Chromium net error codes and checks IPC messages.
 *
 * Each function takes the narrow part of an Electron object that it uses, so a test can give a fake. Electron is a
 * peer dependency for its types only. This package does not install it.
 *
 * @packageDocumentation
 */
export { isMessage, allowsSender, type IpcSender } from "./ipc.ts";
export { returnsKeys, type KeyInput } from "./keys.ts";
export {
  allowsNavigation,
  allowsSiteNavigation,
  denyWindows,
  refuseWebviews,
  restrictNavigation,
  type NavigatingContents,
  type PreventableEvent,
  type WebviewContents,
  type WindowOpenContents,
} from "./navigation.ts";
export { NET_ERRORS, failureOf, type LoadFailure } from "./net-error.ts";
export {
  CONTENT_SECURITY_POLICY,
  PAGE_SCHEME,
  PAGE_SCHEME_PRIVILEGES,
  PAGE_URL,
  pageFile,
  pageHandler,
  pageUrlOf,
  type PageHandlerOptions,
} from "./page.ts";
export { refuseDownloads, refusePermissions, type DownloadSession, type PermissionSession } from "./session.ts";
export {
  SHOW_TIMEOUT_MS,
  captureWindowOptions,
  showWhenReady,
  siteViewPreferences,
  windowOptions,
  type CaptureSize,
  type ShownWindow,
  type WindowOptions,
} from "./window.ts";
