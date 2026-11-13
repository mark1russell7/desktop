/**
 * The page of the app: the scheme `app://page/` that serves one folder, its content security policy, and the address
 * of the page.
 *
 * @packageDocumentation
 */
import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { isInside } from "@mark1russell7/files";
import type { CustomScheme } from "electron";

/** The scheme of the page of the app. The main process serves the folder of the page under `app://page/`. */
export const PAGE_SCHEME = "app";

/** The address of the first page of the app. */
export const PAGE_URL = "app://page/index.html";

/**
 * The privileges of the page scheme for `protocol.registerSchemesAsPrivileged`. The scheme is standard and secure, as
 * `https` is, and `fetch` can read it. Electron needs this before the app is ready.
 */
export const PAGE_SCHEME_PRIVILEGES: CustomScheme = {
  scheme: PAGE_SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true },
};

/**
 * The content security policy of each file of the page. The page loads only its own scripts and styles. It has no
 * inline script and no connection to a server.
 */
export const CONTENT_SECURITY_POLICY: string = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

/**
 * This function gives the address of the page of the window. Only a development run reads the environment variable
 * `PAGE_URL`, for example the address of Vite. A packaged app ignores the variable, so the environment cannot give the
 * window another page.
 *
 * @param packaged - The value of `app.isPackaged`.
 * @param env - The environment variables, for example `process.env`.
 */
export function pageUrlOf(packaged: boolean, env: Readonly<Record<string, string | undefined>>): string {
  const variable = env["PAGE_URL"];
  return packaged || variable === undefined || variable === "" ? PAGE_URL : variable;
}

/**
 * This function gives the file of a request to the page scheme. It gives `undefined` when the request is not for a
 * file in the folder of the page. A path that goes out of the folder, also with an encoded `..`, gives `undefined`. A
 * backslash also gives `undefined`, so the rule is the same on Windows and on Linux.
 *
 * @param root - The folder of the page.
 * @param address - The address of the request.
 */
export function pageFile(root: string, address: string): string | undefined {
  let url: URL;
  let path: string;
  try {
    url = new URL(address);
    path = decodeURIComponent(url.pathname);
  } catch {
    return undefined;
  }
  if (url.protocol !== `${PAGE_SCHEME}:` || url.host !== "page" || path.includes("\0") || path.includes("\\")) return undefined;
  const base = normalize(root);
  const file = normalize(join(base, path === "/" ? "index.html" : path));
  return isInside(base, file) ? file : undefined;
}

/** The options of `pageHandler`. */
export interface PageHandlerOptions {
  /** This function gives the content type of a file. A module script must have a JavaScript type. */
  readonly contentType: (file: string) => string;
  /** This value is the content security policy of each file. The default is `CONTENT_SECURITY_POLICY`. */
  readonly contentSecurityPolicy?: string | undefined;
  /** This function reads a file. The default is `readFile` of `node:fs/promises`. A test can give a fake. */
  readonly readFile?: ((file: string) => Promise<Uint8Array>) | undefined;
}

/**
 * This function gives the handler of the page scheme for `protocol.handle`. The handler serves the files of one folder
 * with the content security policy. A request out of the folder, or for a file that is not there, gets 404.
 *
 * @param root - The folder of the page.
 * @param options - The content type of each file, the policy and the reader of the files.
 */
export function pageHandler(root: string, options: PageHandlerOptions): (request: Request) => Promise<Response> {
  const policy = options.contentSecurityPolicy ?? CONTENT_SECURITY_POLICY;
  const read = options.readFile ?? readFile;
  return async (request) => {
    const file = pageFile(root, request.url);
    if (file === undefined) return new Response("Not found", { status: 404 });
    let body: Uint8Array;
    try {
      body = await read(file);
    } catch {
      return new Response("Not found", { status: 404 });
    }
    return new Response(body, { headers: { "content-type": options.contentType(file), "content-security-policy": policy } });
  };
}
