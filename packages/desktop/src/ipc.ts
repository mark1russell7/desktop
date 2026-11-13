/**
 * The checks of a message between the page and the main process: its type, and the frame that sent it.
 *
 * @packageDocumentation
 */
import { allowsNavigation } from "./navigation.ts";

/**
 * This function tells if a value is a message of a type: an object with the field `type`. A message from the page is
 * data that the main process does not trust, so each handler checks it first.
 *
 * @param value - The data of the message.
 * @param type - The type that the handler reads.
 */
export function isMessage<T extends string>(value: unknown, type: T): value is { readonly type: T } {
  return typeof value === "object" && value !== null && (value as { readonly type?: unknown }).type === type;
}

/** The part of an IPC event that `allowsSender` reads. An `IpcMainEvent` has it. */
export interface IpcSender {
  readonly senderFrame: { readonly url: string } | null;
}

/**
 * This function tells if an IPC message comes from a frame at the origin of the page. A frame of a different origin, or
 * a frame that is gone, gives false.
 *
 * @param page - The address of the page of the app.
 * @param event - The IPC event.
 */
export function allowsSender(page: string, event: IpcSender): boolean {
  const frame = event.senderFrame;
  return frame !== null && allowsNavigation(page, frame.url);
}
