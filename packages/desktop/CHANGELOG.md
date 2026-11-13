# Changelog of @mark1russell7/desktop

## 0.1.0

The first version. The code comes from the app pairrank (`packages/desktop/src/index.ts` and `packages/desktop/src/main.ts`).

- `windowOptions`, `siteViewPreferences` and `captureWindowOptions` give windows and views with a sandbox and context isolation.
- `showWhenReady` shows a window at its first paint, or after a time limit.
- `CONTENT_SECURITY_POLICY`, `PAGE_SCHEME_PRIVILEGES`, `pageFile`, `pageHandler` and `pageUrlOf` serve the page under `app://page/`.
- `allowsNavigation`, `allowsSiteNavigation`, `restrictNavigation`, `denyWindows` and `refuseWebviews` are the rules of navigation.
- `refusePermissions` and `refuseDownloads` are the rules of a session.
- `failureOf` and `NET_ERRORS` give the reason of a failed load.
- `isMessage` and `allowsSender` check an IPC message.
- `returnsKeys` gives the keys back to the app from a view of a site.

Runtime dependencies: `@mark1russell7/files`. Peer dependency: `electron`, for its types only.
