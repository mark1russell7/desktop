// The probe of the home page for `site-pages check`: it uses each demo as a visitor does, at each width of the check.
declare const check: (name: string, ok: boolean, detail?: unknown) => void;
declare const $: (selector: string) => HTMLElement | null;
declare const $$: (selector: string) => HTMLElement[];
declare const click: (element: Element | string | null) => void;
declare const type: (element: Element | string | null, text: string) => void;
declare const until: (fn: () => unknown, ms?: number) => Promise<boolean>;

/** This function gives the text of an element, or an empty text. */
const text = (selector: string): string => $(selector)?.textContent ?? "";
/** This function finds a button of a row by its text. */
const chip = (row: string, label: string): HTMLElement | null => $$(`#${row} button`).find((element) => element.textContent === label) ?? null;

type("#nav-target", "app://page/settings.html");
check("the window goes to another page of the app", await until(() => $$("#nav-result .sp-verdict.sp-pass").length === 1 && text("#nav-result").includes("Window of the app: goes")), text("#nav-result"));
click(chip("nav-chips", "javascript:"));
check("each guard stops javascript:", await until(() => $$("#nav-result .sp-verdict.sp-fail").length === 2), text("#nav-result"));

click(chip("page-chips", "A script"));
check("the page scheme serves main.js with the policy", await until(() => text("#page-result").includes("200 OK") && text("#page-result").includes("default-src 'none'")), text("#page-result"));
click(chip("page-chips", "An encoded /"));
check("an encoded / out of the folder gets 404", await until(() => text("#page-result").includes("404 Not found")), text("#page-result"));

check("the policy shows 7 directives", $$("#csp li").length === 7, $$("#csp li").length);

check("the window refuses nodeIntegration", text("#win-result").includes("webPreferences.nodeIntegration: refused"), text("#win-result"));
click("#win-site");
type("#win-input", "");
check("an empty partition gives no options", await until(() => text("#win-result").includes("The options: none.")), text("#win-result"));
click("#win-app");

click(chip("load-chips", "-7 TIMED_OUT"));
check("the code -7 is a timeout", await until(() => text("#load-result").includes('"timeout"')), text("#load-result"));

click(chip("ipc-chips", "A frame of a site"));
check("a message from a frame of a site is dropped", await until(() => text("#ipc-result").includes("The handler drops the message.")), text("#ipc-result"));

click(chip("keys-chips", "Escape"));
click(chip("keys-chips", "Ctrl+Escape"));
check("only Escape gives the keys back", $$("#keys-log .ok").length === 1 && $$("#keys-log .no").length === 1, text("#keys-log"));

click(chip("perm-chips", "Camera and microphone"));
click(chip("perm-chips", "A download"));
check("the session refuses the camera and the download", $$("#perm-log .ok").length === 2, text("#perm-log"));

export {};
