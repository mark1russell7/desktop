import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY, PAGE_SCHEME, PAGE_SCHEME_PRIVILEGES, PAGE_URL, pageFile, pageHandler, pageUrlOf } from "./page.ts";

const root = resolve("build", "page");

describe("pageFile", () => {
  it("gives the file of the page, and index.html for the root", () => {
    expect(pageFile(root, "app://page/page.js")).toBe(join(root, "page.js"));
    expect(pageFile(root, "app://page/")).toBe(join(root, "index.html"));
    expect(pageFile(root, "app://page/a%20b.css")).toBe(join(root, "a b.css"));
  });

  it("refuses a path out of the folder, another host and another scheme", () => {
    expect(pageFile(root, "app://page/..%2F..%2Fsecret.txt")).toBeUndefined();
    expect(pageFile(root, "app://page/..%5C..%5Csecret.txt")).toBeUndefined();
    // A sibling folder whose name starts with the name of the folder is out of the folder
    expect(pageFile(root, "app://page/..%2Fpage2%2Fsecret.txt")).toBeUndefined();
    expect(pageFile(root, "app://page/a%2F..%2F..%2Fsecret.txt")).toBeUndefined();
    expect(pageFile(root, "app://page/%00.js")).toBeUndefined();
    expect(pageFile(root, "app://page/%E0%A4%A")).toBeUndefined();
    expect(pageFile(root, "app://other/index.html")).toBeUndefined();
    expect(pageFile(root, "file:///etc/passwd")).toBeUndefined();
    expect(pageFile(root, "not an address")).toBeUndefined();
  });

  it("keeps a path that goes out and back into the folder", () => {
    expect(pageFile(root, "app://page/a%2F..%2Fpage.js")).toBe(join(root, "page.js"));
  });
});

describe("the scheme and the policy", () => {
  it("serve the page at app://page/ with a standard, secure scheme", () => {
    expect(PAGE_URL.startsWith(`${PAGE_SCHEME}://page/`)).toBe(true);
    expect(PAGE_SCHEME_PRIVILEGES).toEqual({ scheme: PAGE_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } });
  });

  it("allow no inline script and no connection", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).not.toContain("unsafe");
    expect(CONTENT_SECURITY_POLICY).not.toContain("connect-src");
  });
});

describe("pageUrlOf", () => {
  const vite = "http://localhost:5173/";

  it("reads PAGE_URL only in a development run", () => {
    expect(pageUrlOf(false, { PAGE_URL: vite })).toBe(vite);
    expect(pageUrlOf(true, { PAGE_URL: vite })).toBe(PAGE_URL);
    expect(pageUrlOf(true, { PAGE_URL: "https://attacker.example/" })).toBe(PAGE_URL);
  });

  it("gives the page of the app without the variable, or with an empty variable", () => {
    expect(pageUrlOf(false, {})).toBe(PAGE_URL);
    expect(pageUrlOf(false, { PAGE_URL: "" })).toBe(PAGE_URL);
    expect(pageUrlOf(true, {})).toBe(PAGE_URL);
  });
});

describe("pageHandler", () => {
  const contentType = (file: string): string => (file.endsWith(".js") ? "text/javascript" : "text/html");
  let folder: string | undefined;

  afterEach(() => {
    if (folder !== undefined) rmSync(folder, { recursive: true, force: true });
    folder = undefined;
  });

  it("serves a file of the folder with its type and the policy", async () => {
    folder = mkdtempSync(join(tmpdir(), "desktop-page-"));
    writeFileSync(join(folder, "index.html"), "<p>page</p>");
    writeFileSync(join(folder, "page.js"), "export {};");
    const handle = pageHandler(folder, { contentType });

    const index = await handle(new Request("app://page/"));
    expect(index.status).toBe(200);
    expect(await index.text()).toBe("<p>page</p>");
    expect(index.headers.get("content-type")).toBe("text/html");
    expect(index.headers.get("content-security-policy")).toBe(CONTENT_SECURITY_POLICY);

    const script = await handle(new Request("app://page/page.js"));
    expect(script.headers.get("content-type")).toBe("text/javascript");
  });

  it("gives 404 for a path out of the folder and for a file that is not there", async () => {
    folder = mkdtempSync(join(tmpdir(), "desktop-page-"));
    // A file next to the folder of the page: the handler must not serve it
    mkdirSync(join(folder, "page"));
    writeFileSync(join(folder, "secret.txt"), "secret");
    const handle = pageHandler(join(folder, "page"), { contentType });
    expect((await handle(new Request("app://page/..%2Fsecret.txt"))).status).toBe(404);
    expect((await handle(new Request("app://page/missing.js"))).status).toBe(404);
  });

  it("uses the policy and the reader of the options", async () => {
    const reads: string[] = [];
    const handle = pageHandler(root, {
      contentType,
      contentSecurityPolicy: "default-src 'self'",
      readFile: (file) => {
        reads.push(file);
        return Promise.resolve(new TextEncoder().encode("fake"));
      },
    });
    const response = await handle(new Request("app://page/page.js"));
    expect(reads).toEqual([join(root, "page.js")]);
    expect(await response.text()).toBe("fake");
    expect(response.headers.get("content-security-policy")).toBe("default-src 'self'");
  });
});
