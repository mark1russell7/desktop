/**
 * The Node.js functions that the demos do not use, for the browser build. `@mark1russell7/desktop` and
 * `@mark1russell7/files` import them at the top of their modules. The demos call only the functions that use
 * `node:path`, so each function of this module throws.
 *
 * @packageDocumentation
 */

function absent(name: string): never {
  throw new Error(`The demo runs in a browser, so ${name} of Node.js is not available.`);
}

/** This function replaces `readFile` of `node:fs/promises`. It throws. */
export function readFile(): Promise<Uint8Array> {
  return Promise.reject(new Error("The demo runs in a browser, so readFile of Node.js is not available."));
}

/** This function replaces `lstat` of `node:fs/promises`. It throws. */
export function lstat(): Promise<never> {
  return Promise.reject(new Error("The demo runs in a browser, so lstat of Node.js is not available."));
}

/** This function replaces `readdir` of `node:fs/promises`. It throws. */
export function readdir(): Promise<never> {
  return Promise.reject(new Error("The demo runs in a browser, so readdir of Node.js is not available."));
}

/** This function replaces `existsSync` of `node:fs`. It throws. */
export function existsSync(): boolean {
  return absent("existsSync");
}

/** This function replaces `lstatSync` of `node:fs`. It throws. */
export function lstatSync(): never {
  return absent("lstatSync");
}

/** This function replaces `readdirSync` of `node:fs`. It throws. */
export function readdirSync(): never {
  return absent("readdirSync");
}

/** This function replaces `statSync` of `node:fs`. It throws. */
export function statSync(): never {
  return absent("statSync");
}

/** This function replaces `homedir` of `node:os`. It throws. */
export function homedir(): string {
  return absent("homedir");
}
