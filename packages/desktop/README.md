# @mark1russell7/desktop

The safe defaults of the main process of an Electron app. The package has the content security policy, the options of the windows and the rules of navigation. It also refuses permissions and downloads, serves a folder under `app://`, reads the Chromium net error codes and checks IPC messages.

```sh
npm install @mark1russell7/desktop
```

Electron is a peer dependency. The package uses only its types, so it does not install Electron and it does not bundle it. Each function takes the narrow part of an Electron object that it uses. Thus a test can give a fake object.

## The windows

`windowOptions` gives the options of the window of the app. The page has no Node.js, operates in a sandbox and is isolated from the preload script. The caller can set the size, the title and the other options, but not the web preferences.

```ts
import { app, BrowserWindow } from "electron";
import { SHOW_TIMEOUT_MS, showWhenReady, windowOptions } from "@mark1russell7/desktop";

const window = new BrowserWindow(windowOptions(preload, { width: 1400, height: 900, title: "My app" }));
showWhenReady(window, SHOW_TIMEOUT_MS, console.warn);
```

| Function | What it gives |
| --- | --- |
| `windowOptions(preload, options?)` | The options of the window of the app. It is hidden until `showWhenReady` shows it. |
| `siteViewPreferences(partition)` | The preferences of a view of a site that the app does not trust: no preload script and its own session. |
| `captureWindowOptions(size, partition)` | The options of a window that captures a site off the screen. |
| `showWhenReady(window, timeoutMs, log)` | It shows a window at its first paint, or after the time limit. |

## The page

The main process serves the folder of the page under `app://page/`. Each file gets the content security policy. Register the scheme before the app is ready, and give the handler a function for the content types.

```ts
import { app, protocol } from "electron";
import { PAGE_SCHEME, PAGE_SCHEME_PRIVILEGES, pageHandler, pageUrlOf } from "@mark1russell7/desktop";

protocol.registerSchemesAsPrivileged([PAGE_SCHEME_PRIVILEGES]);
await app.whenReady();
protocol.handle(PAGE_SCHEME, pageHandler(pageFolder, { contentType }));
await window.loadURL(pageUrlOf(app.isPackaged, process.env));
```

- With `CONTENT_SECURITY_POLICY`, the page has no inline script, no connection and no frame.
- `pageFile(root, address)` gives the file of a request, or `undefined` for a path out of the folder.
- `pageHandler(root, options)` gives 404 for a path out of the folder and for a file that is not there.
- `pageUrlOf(packaged, env)` reads the variable `PAGE_URL` only in a development run.

The package has no table of content types. The caller gives the function, for example from its HTTP server.

## The rules

```ts
import { app, session } from "electron";
import * as desktop from "@mark1russell7/desktop";

for (const each of [session.defaultSession, session.fromPartition("persist:sites")]) {
  desktop.refusePermissions(each);
  desktop.refuseDownloads(each);
}
app.on("web-contents-created", (_event, contents) => {
  desktop.refuseWebviews(contents);
  // The views of the sites have their own rules, for example allowsSiteNavigation
  if (contents.session !== session.defaultSession) return;
  desktop.denyWindows(contents);
  desktop.restrictNavigation(contents, (url) => desktop.allowsNavigation(page, url));
});
```

| Function | What it does |
| --- | --- |
| `allowsNavigation(page, target)` | It tells if the window can go to an address. The window stays at the origin of its page. |
| `allowsSiteNavigation(target)` | It tells if a view of a site can go to an address. A site goes only to `http` and `https` addresses. |
| `restrictNavigation(contents, allows)` | It stops each navigation that the rule refuses. |
| `denyWindows(contents)` | The contents open no new window. |
| `refuseWebviews(contents)` | The contents attach no `<webview>`. |
| `refusePermissions(session)` | The session refuses each permission request and check. |
| `refuseDownloads(session)` | The session cancels each download. |
| `returnsKeys(input)` | It tells if a key press in a view of a site gives the keys back to the app: `Escape` with no modifier key. |

## Failed loads

`failureOf(code)` gives the reason of a failed load from its Chromium error code: `timeout`, `refused` or `network`. The code `-3` is a load that a new load replaced, so it gives `undefined`. `NET_ERRORS` has the names of the codes that the function reads.

## IPC messages

A message from the page is data that the main process does not trust.

- `isMessage(value, type)` tells if a value is an object with the field `type`. It narrows the type of the value.
- `allowsSender(page, event)` tells if a message comes from a frame at the origin of the page.

## License

MIT
