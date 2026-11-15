/**
 * The demos of the home page. Each demo reads its controls, calls the model, and shows the result.
 *
 * @packageDocumentation
 */
import { byId, copyText, h, setupTheme } from "@mark1russell7/site-pages/chrome";
import { NET_ERRORS, type KeyInput } from "@mark1russell7/desktop";
import {
  DEMO_PAGE,
  MORE_NET_ERRORS,
  checkMessage,
  directives,
  givesKeysBack,
  keyInputOf,
  keyText,
  loadFailure,
  navigate,
  netErrorName,
  refusingSession,
  requestPage,
  windowResult,
  type WindowKind,
} from "./model.ts";

setupTheme(byId<HTMLButtonElement>("theme"), "theme");

const copy = byId<HTMLButtonElement>("copy");
copy.addEventListener("click", () => {
  void copyText(copy, byId("install").textContent ?? "");
});

/** This function fills a row of buttons. A click on a button starts `pick` with its value. */
function chips(id: string, values: readonly (readonly [label: string, value: string])[], pick: (value: string) => void): void {
  const host = byId(id);
  host.replaceChildren(
    ...values.map(([label, value]) => {
      const button = h("button", { type: "button", class: "chip", title: value }, label);
      button.addEventListener("click", () => pick(value));
      return button;
    }),
  );
}

/** This function makes the line of one verdict: a mark, a title and a reason. */
function verdict(ok: boolean, okText: string, noText: string, title: string, reason: string): HTMLElement {
  return h(
    "div",
    { class: ok ? "verdict ok" : "verdict no" },
    h("span", { class: "mark", "aria-hidden": "true" }, ok ? "✓" : "✕"),
    h("div", {}, h("b", {}, `${title}: ${ok ? okText : noText}.`), " ", reason),
  );
}

/** This function sets the value of a field and sends an `input` event. */
function setField(field: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  field.value = value;
  field.dispatchEvent(new Event("input"));
}

// 1. Navigation

const navTarget = byId<HTMLInputElement>("nav-target");
function showNavigation(): void {
  const target = navTarget.value.trim();
  const result = navigate(DEMO_PAGE, target);
  const origin = result.targetOrigin === undefined ? "The text is not an address." : `The address has the origin ${result.targetOrigin}.`;
  const same = result.targetOrigin === result.pageOrigin;
  byId("nav-result").replaceChildren(
    verdict(
      result.window,
      "goes",
      "stopped",
      "Window of the app",
      `${origin} The page has the origin ${result.pageOrigin ?? "none"}${same ? ", the same" : ""}.`,
    ),
    verdict(
      result.site,
      "goes",
      "stopped",
      "View of a site",
      result.site ? "A site can go to each http and https address." : "A site goes only to http and https addresses.",
    ),
  );
}
navTarget.addEventListener("input", showNavigation);
chips(
  "nav-chips",
  [
    ["Another page of the app", "app://page/settings.html"],
    ["A website", "https://example.com/login"],
    ["Another host", "app://evil/index.html"],
    ["javascript:", "javascript:alert(document.cookie)"],
    ["A file", "file:///C:/Windows/System32/"],
    ["A browser page", "chrome://settings"],
  ],
  (value) => setField(navTarget, value),
);
showNavigation();

// 2. The page scheme

const pageAddress = byId<HTMLInputElement>("page-address");
let pageRequest = 0;
async function showPage(): Promise<void> {
  const ticket = ++pageRequest;
  const result = await requestPage(pageAddress.value.trim());
  if (ticket !== pageRequest) return;
  const served = result.status === 200;
  const rows: [string, string][] = [
    ["After the URL parser", result.parsed ?? "not an address"],
    ["The file of pageFile", result.file ?? "none: out of the folder, another host or another scheme"],
    ["Status", served ? "200 OK" : "404 Not found"],
  ];
  if (result.contentType !== undefined) rows.push(["Content-Type", result.contentType]);
  if (result.policy !== undefined) rows.push(["Content-Security-Policy", result.policy]);
  byId("page-result").replaceChildren(
    h("div", { class: served ? "status ok" : "status no" }, served ? "Served" : "Refused"),
    h("dl", {}, ...rows.flatMap(([term, value]) => [h("dt", {}, term), h("dd", {}, h("code", {}, value))])),
    h("pre", { class: "body", "aria-label": "The body of the response" }, result.body),
  );
}
pageAddress.addEventListener("input", () => void showPage());
chips(
  "page-chips",
  [
    ["The root", "app://page/"],
    ["A script", "app://page/main.js"],
    ["../ in the path", "app://page/../package.json"],
    ["An encoded /", "app://page/..%2Fpackage.json"],
    ["An encoded \\", "app://page/..%5Cpackage.json"],
    ["A missing file", "app://page/secret.txt"],
    ["Another host", "app://other/index.html"],
  ],
  (value) => setField(pageAddress, value),
);
void showPage();

// 3. The content security policy

byId("csp").replaceChildren(...directives().map((each) => h("li", {}, h("code", {}, each.text), h("span", {}, each.meaning))));

// 4. The window options

const WINDOW_SAMPLES: Readonly<Record<WindowKind, { label: string; text: string; call: string }>> = {
  app: {
    label: "The options, as JSON",
    text: JSON.stringify({ title: "Notes", width: 900, webPreferences: { nodeIntegration: true, sandbox: false } }, null, 2),
    call: "new BrowserWindow(windowOptions(preload, options))",
  },
  site: { label: "The partition of the session of the sites", text: "persist:sites", call: "new WebContentsView({ webPreferences: siteViewPreferences(partition) })" },
  capture: { label: "The size, then the partition", text: "1280x720, persist:capture", call: "new BrowserWindow(captureWindowOptions(size, partition))" },
};
const winInput = byId<HTMLTextAreaElement>("win-input");
const winTabs = [...document.querySelectorAll<HTMLButtonElement>("[data-kind]")];
let winKind: WindowKind = "app";
const winText: Record<WindowKind, string> = { app: WINDOW_SAMPLES.app.text, site: WINDOW_SAMPLES.site.text, capture: WINDOW_SAMPLES.capture.text };

function showWindow(): void {
  winText[winKind] = winInput.value;
  const result = windowResult(winKind, winInput.value);
  const parts: HTMLElement[] = [];
  if (result.error !== undefined) parts.push(verdict(false, "", "no options", "Error", result.error));
  for (const each of result.refused) {
    parts.push(verdict(false, "", "refused", `webPreferences.${each.key}`, `You asked for ${JSON.stringify(each.asked)}. The window gets ${JSON.stringify(each.got)}.`));
  }
  if (result.options !== undefined) parts.push(h("pre", { class: "json", "aria-label": "The options" }, JSON.stringify(result.options, null, 2)));
  byId("win-result").replaceChildren(...parts);
}
function selectWindow(kind: WindowKind): void {
  winKind = kind;
  for (const tab of winTabs) tab.setAttribute("aria-selected", String(tab.dataset["kind"] === kind));
  byId("win-label").textContent = WINDOW_SAMPLES[kind].label;
  byId("win-call").textContent = WINDOW_SAMPLES[kind].call;
  winInput.rows = kind === "app" ? 9 : 1;
  winInput.value = winText[kind];
  showWindow();
}
for (const tab of winTabs) tab.addEventListener("click", () => selectWindow(tab.dataset["kind"] as WindowKind));
winInput.addEventListener("input", showWindow);
selectWindow("app");

// 5. Load failures

const loadCode = byId<HTMLInputElement>("load-code");
function showLoad(): void {
  const code = Number(loadCode.value);
  if (loadCode.value.trim() === "" || !Number.isInteger(code)) {
    byId("load-result").replaceChildren(h("p", {}, "Type a whole number, for example -102."));
    return;
  }
  const { failure, advice } = loadFailure(code);
  const name = netErrorName(code);
  byId("load-result").replaceChildren(
    h("p", { class: "reason" }, h("code", {}, `failureOf(${String(code)})`), " gives ", h("b", {}, failure === undefined ? "undefined" : `"${failure}"`)),
    h("p", {}, name === undefined ? "The demo does not know the name of this code." : `${name}. ${advice}`),
    ...(name === undefined ? [h("p", {}, advice)] : []),
  );
}
loadCode.addEventListener("input", showLoad);
chips(
  "load-chips",
  [...Object.entries(NET_ERRORS), ...Object.entries(MORE_NET_ERRORS)].map(([name, code]) => [`${String(code)} ${name}`, String(code)] as const),
  (value) => setField(loadCode, value),
);
showLoad();

// 6. IPC messages

const ipcJson = byId<HTMLInputElement>("ipc-json");
const ipcType = byId<HTMLInputElement>("ipc-type");
const ipcFrame = byId<HTMLInputElement>("ipc-frame");
function showMessage(): void {
  const frame = ipcFrame.value.trim();
  const result = checkMessage(ipcJson.value, ipcType.value, frame === "" ? null : frame);
  byId("ipc-result").replaceChildren(
    result.error === undefined
      ? verdict(result.typed, "yes", "no", "isMessage", result.typed ? `The data is an object with type "${ipcType.value}".` : `The data is not an object with type "${ipcType.value}".`)
      : verdict(false, "", "no", "isMessage", `The text is not JSON: ${result.error}`),
    verdict(
      result.sender,
      "yes",
      "no",
      "allowsSender",
      frame === "" ? "The frame is gone, so the message has no sender." : result.sender ? "The frame is at the origin of the page." : "The frame is not at the origin of the page.",
    ),
    h("p", { class: result.typed && result.sender ? "outcome ok" : "outcome no" }, result.typed && result.sender ? "The handler reads the message." : "The handler drops the message."),
  );
}
for (const field of [ipcJson, ipcType, ipcFrame]) field.addEventListener("input", showMessage);
chips(
  "ipc-chips",
  [
    ["The page", "app://page/index.html"],
    ["A frame of a site", "https://ads.example/frame.html"],
    ["A frame that is gone", ""],
  ],
  (value) => setField(ipcFrame, value),
);
showMessage();

// 7. Keys

const keysLog = byId("keys-log");
function logKey(input: KeyInput): void {
  const back = givesKeysBack(input);
  keysLog.prepend(h("li", { class: back ? "ok" : "no" }, h("kbd", {}, keyText(input)), back ? " gives the keys back to the app." : " stays with the site."));
  while (keysLog.children.length > 5) keysLog.lastElementChild?.remove();
}
byId("keys-box").addEventListener("keydown", (event) => {
  if (event.key === "Tab") return;
  event.preventDefault();
  logKey(keyInputOf(event));
});
chips(
  "keys-chips",
  [
    ["Escape", "Escape"],
    ["Ctrl+Escape", "Ctrl+Escape"],
    ["Alt+Escape", "Alt+Escape"],
    ["The key a", "a"],
  ],
  (value) => {
    const key = value.split("+").pop() ?? value;
    logKey({ type: "keyDown", key, control: value.startsWith("Ctrl+"), alt: value.startsWith("Alt+"), meta: false });
  },
);

// 8. Permissions and downloads

const session = refusingSession();
const permLog = byId("perm-log");
function logPermission(text: string, refused: boolean): void {
  permLog.prepend(h("li", { class: refused ? "ok" : "no" }, text));
  while (permLog.children.length > 5) permLog.lastElementChild?.remove();
}
chips(
  "perm-chips",
  [
    ["Camera and microphone", "media"],
    ["Notifications", "notifications"],
    ["Location", "geolocation"],
    ["Read the clipboard", "clipboard-read"],
    ["A download", "download"],
  ],
  (value) => {
    if (value === "download") {
      const { prevented, cancelled } = session.download();
      logPermission(prevented && cancelled ? "A download: the session stopped it and cancelled the item." : "A download: the session let it go.", prevented && cancelled);
      return;
    }
    const granted = session.request(value);
    logPermission(`The permission "${value}": ${granted ? "granted" : "refused"}.`, !granted);
  },
);
