/**
 * The rules of a session: no permission and no download.
 *
 * @packageDocumentation
 */
import type { PreventableEvent } from "./navigation.ts";

/** The part of a session of Electron that `refusePermissions` uses. */
export interface PermissionSession {
  setPermissionRequestHandler(handler: (webContents: unknown, permission: string, callback: (granted: boolean) => void) => void): void;
  setPermissionCheckHandler(handler: () => boolean): void;
}

/**
 * This function makes a session refuse each permission: the camera, the microphone, the notifications and the others.
 * A request gets no, and a check gets false.
 */
export function refusePermissions(session: PermissionSession): void {
  session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.setPermissionCheckHandler(() => false);
}

/** The part of a session of Electron that `refuseDownloads` uses. */
export interface DownloadSession {
  on(event: "will-download", listener: (event: PreventableEvent, item: { cancel(): void }) => void): unknown;
}

/** This function makes a session refuse each download. Thus the pages of the session put no file on the disk. */
export function refuseDownloads(session: DownloadSession): void {
  session.on("will-download", (event, item) => {
    event.preventDefault();
    item.cancel();
  });
}
