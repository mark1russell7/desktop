/**
 * The model of the demos: each function uses the real functions of `@mark1russell7/desktop` and gives the result
 * that the page shows. The Electron objects are fakes, as in the tests of the package.
 *
 * @packageDocumentation
 */
import {
  CONTENT_SECURITY_POLICY,
  NET_ERRORS,
  allowsNavigation,
  allowsSender,
  allowsSiteNavigation,
  captureWindowOptions,
  failureOf,
  isMessage,
  pageFile,
  pageHandler,
  refuseDownloads,
  refusePermissions,
  restrictNavigation,
  returnsKeys,
  siteViewPreferences,
  windowOptions,
  type KeyInput,
  type LoadFailure,
  type PreventableEvent,
} from "@mark1russell7/desktop";

/** The address of the page of the app in the demos. */
export const DEMO_PAGE = "app://page/index.html";

/** The origin of an address as `scheme//host`, or `undefined` when the text is not an address. */
export function originText(address: string): string | undefined {
  try {
    const url = new URL(address);
    return `${url.protocol}//${url.host}`;
  } catch {
    return undefined;
  }
}

/** The result of a navigation in the window of the app and in the view of a site. */
export interface NavigationResult {
  /** This value is true when the guard of the window lets the navigation go. */
  readonly window: boolean;
  /** This value is true when the guard of a site view lets the navigation go. */
  readonly site: boolean;
  /** The origin of the page, or `undefined` when the page is not an address. */
  readonly pageOrigin: string | undefined;
  /** The origin of the target, or `undefined` when the target is not an address. */
  readonly targetOrigin: string | undefined;
}

/**
 * This function sends one `will-navigate` event through `restrictNavigation` on a fake `WebContents`. It gives true
 * when the guard does not start `preventDefault`.
 */
export function guardLets(rule: (url: string) => boolean, target: string): boolean {
  let listener: ((event: PreventableEvent, url: string) => void) | undefined;
  restrictNavigation(
    {
      on: (_event, each) => {
        listener = each;
      },
    },
    rule,
  );
  let stopped = false;
  listener?.(
    {
      preventDefault: () => {
        stopped = true;
      },
    },
    target,
  );
  return !stopped;
}

/** This function gives the result of a navigation from `page` to `target` for the two guards. */
export function navigate(page: string, target: string): NavigationResult {
  return {
    window: guardLets((url) => allowsNavigation(page, url), target),
    site: guardLets(allowsSiteNavigation, target),
    pageOrigin: originText(page),
    targetOrigin: originText(target),
  };
}

/** The folder of the page in the demo of the page scheme. */
export const DEMO_ROOT = "/opt/notes/page";

/** The files of the fake disk. The file `package.json` is out of the folder of the page. */
export const DEMO_FILES: Readonly<Record<string, string>> = {
  "/opt/notes/page/index.html": '<!doctype html>\n<script type="module" src="main.js"></script>\n',
  "/opt/notes/page/main.js": 'document.title = "Notes";\n',
  "/opt/notes/page/style.css": "body { margin: 0; }\n",
  "/opt/notes/package.json": '{ "name": "notes", "secret": "out of the page folder" }\n',
};

const TYPES: Readonly<Record<string, string>> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json",
};

function contentType(file: string): string {
  return TYPES[file.slice(file.lastIndexOf(".") + 1)] ?? "application/octet-stream";
}

const handler = pageHandler(DEMO_ROOT, {
  contentType,
  readFile: (file) => {
    // The page uses the POSIX rules. The tests on Windows use the rules of Windows, so the fake disk takes each separator.
    const text = DEMO_FILES[file.replaceAll("\\", "/")];
    return text === undefined ? Promise.reject(new Error(`no file ${file}`)) : Promise.resolve(new TextEncoder().encode(text));
  },
});

/** The result of one request to the page scheme. */
export interface PageResult {
  /** The address after the URL parser, or `undefined` when the text is not an address. */
  readonly parsed: string | undefined;
  /** The file that `pageFile` gives, or `undefined`. */
  readonly file: string | undefined;
  /** The status of the response of `pageHandler`. */
  readonly status: number;
  /** The content type of the response, or `undefined` for a 404. */
  readonly contentType: string | undefined;
  /** The content security policy of the response, or `undefined` for a 404. */
  readonly policy: string | undefined;
  /** The body of the response. */
  readonly body: string;
}

/** This function sends a request for `address` to the handler of the page scheme. */
export async function requestPage(address: string): Promise<PageResult> {
  let request: Request;
  try {
    request = new Request(address);
  } catch {
    return { parsed: undefined, file: undefined, status: 404, contentType: undefined, policy: undefined, body: "Not found" };
  }
  const response = await handler(request);
  return {
    parsed: request.url,
    file: pageFile(DEMO_ROOT, request.url),
    status: response.status,
    contentType: response.headers.get("content-type") ?? undefined,
    policy: response.headers.get("content-security-policy") ?? undefined,
    body: await response.text(),
  };
}

/** One directive of the content security policy, with its meaning in plain words. */
export interface Directive {
  readonly text: string;
  readonly meaning: string;
}

const MEANINGS: Readonly<Record<string, string>> = {
  "default-src": "Each type of resource that has no rule of its own loads from nowhere.",
  "script-src": "Scripts load only from the folder of the page. No inline script and no eval run.",
  "style-src": "Style sheets load only from the folder of the page. No inline style applies.",
  "img-src": "Images load from the folder of the page and from data: addresses.",
  "base-uri": "The page cannot change the base address of its links.",
  "form-action": "A form cannot send its data to an address.",
  "frame-ancestors": "No other page can show this page in a frame.",
};

/** This function gives the directives of `CONTENT_SECURITY_POLICY`, each with its meaning. */
export function directives(policy: string = CONTENT_SECURITY_POLICY): readonly Directive[] {
  return policy
    .split(";")
    .map((each) => each.trim())
    .filter((each) => each !== "")
    .map((text) => ({ text, meaning: MEANINGS[text.split(/\s+/)[0] ?? ""] ?? "" }));
}

/** The kinds of window in the demo of the window options. */
export type WindowKind = "app" | "site" | "capture";

/** The result of the demo of the window options. */
export interface WindowResult {
  /** The options, or `undefined` after an error. */
  readonly options: unknown;
  /** The error, for example a JSON text that does not parse. */
  readonly error: string | undefined;
  /** The web preferences that the caller asked for and did not get. */
  readonly refused: readonly { readonly key: string; readonly asked: unknown; readonly got: unknown }[];
}

/** The preload script of the demo window. */
export const DEMO_PRELOAD = "/opt/notes/preload.js";

/**
 * This function gives the options of a window of `kind` from the text of the visitor. For the app window, the text is
 * the JSON of the options. For a site view, it is the partition. For a capture window, it is the size, `1280x720`.
 */
export function windowResult(kind: WindowKind, text: string): WindowResult {
  try {
    if (kind === "site") return { options: siteViewPreferences(text), error: undefined, refused: [] };
    if (kind === "capture") {
      const [, w, h, partition] = /^\s*(\d+)\s*[x×]\s*(\d+)\s*(?:,\s*(.*))?$/.exec(text) ?? [];
      if (w === undefined || h === undefined) return { options: undefined, error: "Write the size as 1280x720, then a comma and the partition.", refused: [] };
      return { options: captureWindowOptions({ w: Number(w), h: Number(h) }, (partition ?? "persist:capture").trim()), error: undefined, refused: [] };
    }
    const asked: unknown = JSON.parse(text);
    if (typeof asked !== "object" || asked === null || Array.isArray(asked)) return { options: undefined, error: "The options are a JSON object.", refused: [] };
    // The type of windowOptions has no webPreferences. A JavaScript caller can still give them, so the demo does too.
    const options = windowOptions(DEMO_PRELOAD, asked as Parameters<typeof windowOptions>[1]);
    const askedPrefs = (asked as { readonly webPreferences?: unknown }).webPreferences;
    const got = options.webPreferences as Readonly<Record<string, unknown>>;
    const refused =
      typeof askedPrefs === "object" && askedPrefs !== null
        ? Object.entries(askedPrefs)
            .filter(([key, value]) => got[key] !== value)
            .map(([key, value]) => ({ key, asked: value, got: got[key] }))
        : [];
    return { options, error: undefined, refused };
  } catch (error) {
    return { options: undefined, error: error instanceof Error ? error.message : String(error), refused: [] };
  }
}

/** The names of some Chromium net error codes that are not in `NET_ERRORS`, for the demo. */
export const MORE_NET_ERRORS: Readonly<Record<string, number>> = {
  NAME_NOT_RESOLVED: -105,
  INTERNET_DISCONNECTED: -106,
  CERT_DATE_INVALID: -201,
};

/** This function gives the name of a Chromium net error code, or `undefined` for a code that the demo does not know. */
export function netErrorName(code: number): string | undefined {
  for (const [name, value] of [...Object.entries(NET_ERRORS), ...Object.entries(MORE_NET_ERRORS)]) if (value === code) return `ERR_${name}`;
  return undefined;
}

/** This function tells what an app does after a failed load, from the result of `failureOf`. */
export function failureAdvice(failure: LoadFailure | undefined): string {
  switch (failure) {
    case undefined:
      return "A new load replaced this load. The app does nothing.";
    case "timeout":
      return "The site did not answer in time. The app tries again later.";
    case "refused":
      return "The site, the network or a rule refused the load. Another try gets the same result, so the app tells the user.";
    case "network":
      return "A different fault: no name, no route or a bad certificate. The app shows the error.";
  }
}

/** This function gives the result of `failureOf` and the advice for a code. */
export function loadFailure(code: number): { readonly failure: LoadFailure | undefined; readonly advice: string } {
  const failure = failureOf(code);
  return { failure, advice: failureAdvice(failure) };
}

/** The result of the checks of one IPC message. */
export interface MessageResult {
  /** The error of the JSON text, or `undefined` when it parses. */
  readonly error: string | undefined;
  /** This value is true when `isMessage` accepts the data. */
  readonly typed: boolean;
  /** This value is true when `allowsSender` accepts the frame. */
  readonly sender: boolean;
}

/** This function checks a message: its JSON text, the type of the handler, and the address of the frame that sent it. */
export function checkMessage(json: string, type: string, frameUrl: string | null, page: string = DEMO_PAGE): MessageResult {
  const sender = allowsSender(page, { senderFrame: frameUrl === null ? null : { url: frameUrl } });
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error), typed: false, sender };
  }
  return { error: undefined, typed: isMessage(value, type), sender };
}

/** This function gives the key input of Electron for a key press of the browser. */
export function keyInputOf(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "metaKey">): KeyInput {
  return { type: "keyDown", key: event.key, control: event.ctrlKey, alt: event.altKey, meta: event.metaKey };
}

/** This function tells if a key press gives the keys back to the app, with `returnsKeys`. */
export function givesKeysBack(input: KeyInput): boolean {
  return returnsKeys(input);
}

/** The text of a key press, for example `Ctrl+Escape`. */
export function keyText(input: KeyInput): string {
  const parts = [input.control ? "Ctrl" : "", input.alt ? "Alt" : "", input.meta ? "Meta" : "", input.key === " " ? "Space" : input.key];
  return parts.filter((part) => part !== "").join("+");
}

/** A fake session of Electron, with the handlers that `refusePermissions` and `refuseDownloads` set. */
export interface FakeSession {
  /** This function asks for a permission, and gives the answer of the session. */
  request(permission: string): boolean;
  /** This function checks a permission, and gives the answer of the session. */
  check(): boolean;
  /** This function starts a download, and tells if the session stopped it and cancelled the item. */
  download(): { readonly prevented: boolean; readonly cancelled: boolean };
}

/** This function makes a fake session, and applies `refusePermissions` and `refuseDownloads` to it. */
export function refusingSession(): FakeSession {
  let onRequest: ((contents: unknown, permission: string, callback: (granted: boolean) => void) => void) | undefined;
  let onCheck: (() => boolean) | undefined;
  let onDownload: ((event: PreventableEvent, item: { cancel(): void }) => void) | undefined;
  const session = {
    setPermissionRequestHandler: (handler: typeof onRequest) => {
      onRequest = handler;
    },
    setPermissionCheckHandler: (handler: () => boolean) => {
      onCheck = handler;
    },
    on: (_event: "will-download", listener: (event: PreventableEvent, item: { cancel(): void }) => void) => {
      onDownload = listener;
    },
  };
  refusePermissions(session);
  refuseDownloads(session);
  return {
    request: (permission) => {
      let granted = true;
      onRequest?.(undefined, permission, (answer) => {
        granted = answer;
      });
      return granted;
    },
    check: () => onCheck?.() ?? true,
    download: () => {
      let prevented = false;
      let cancelled = false;
      onDownload?.(
        {
          preventDefault: () => {
            prevented = true;
          },
        },
        {
          cancel: () => {
            cancelled = true;
          },
        },
      );
      return { prevented, cancelled };
    },
  };
}
