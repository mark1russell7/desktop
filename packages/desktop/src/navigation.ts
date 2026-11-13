/**
 * The rules of navigation: where a window or a view can go, and the guards that apply the rules to a `WebContents`.
 *
 * @packageDocumentation
 */

/** This function gives the origin of an address, or `undefined` when the text is not an address. */
function originOf(address: string): string | undefined {
  try {
    const url = new URL(address);
    // A standard scheme such as app: has the origin "null" in Node.js, so the origin is the scheme and the host
    return `${url.protocol}//${url.host}`;
  } catch {
    return undefined;
  }
}

/**
 * This function tells if the window of the app can go to an address. The window stays at the origin of its page.
 *
 * @param page - The address of the page of the window.
 * @param target - The address of the navigation.
 */
export function allowsNavigation(page: string, target: string): boolean {
  const origin = originOf(page);
  return origin !== undefined && originOf(target) === origin;
}

/**
 * This function tells if the view of a site can go to an address. A site goes only to `http` and `https` addresses,
 * not to `file`, to the page scheme, to `javascript` or to the pages of the browser.
 *
 * @param target - The address of the navigation.
 */
export function allowsSiteNavigation(target: string): boolean {
  try {
    const { protocol } = new URL(target);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/** An event that the listener can stop. */
export interface PreventableEvent {
  preventDefault(): void;
}

/** The part of a `WebContents` that `denyWindows` uses. */
export interface WindowOpenContents {
  setWindowOpenHandler(handler: () => { action: "deny" }): void;
}

/** This function makes a `WebContents` open no new window. A link or a script that opens a window does nothing. */
export function denyWindows(contents: WindowOpenContents): void {
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
}

/** The part of a `WebContents` that `restrictNavigation` uses. */
export interface NavigatingContents {
  on(event: "will-navigate", listener: (event: PreventableEvent, url: string) => void): unknown;
}

/**
 * This function stops each navigation of a `WebContents` that `allows` refuses. The main frame stays at its page.
 *
 * @param contents - The `WebContents` of a window or a view.
 * @param allows - The rule, for example `(url) => allowsNavigation(page, url)` or `allowsSiteNavigation`.
 */
export function restrictNavigation(contents: NavigatingContents, allows: (url: string) => boolean): void {
  contents.on("will-navigate", (event, url) => {
    if (!allows(url)) event.preventDefault();
  });
}

/** The part of a `WebContents` that `refuseWebviews` uses. */
export interface WebviewContents {
  on(event: "will-attach-webview", listener: (event: PreventableEvent) => void): unknown;
}

/** This function makes a `WebContents` attach no `<webview>`. A page cannot get a view with weaker preferences. */
export function refuseWebviews(contents: WebviewContents): void {
  contents.on("will-attach-webview", (event) => event.preventDefault());
}
