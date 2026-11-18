import { describe, expect, it } from "vitest";
import { nodeShim } from "../vite.config.ts";

/** This function loads the code of a shim as a module. */
async function load(code: string): Promise<Record<string, unknown>> {
  return (await import(`data:text/javascript,${encodeURIComponent(code)}`)) as Record<string, unknown>;
}

describe("the browser shim of a module of Node.js", () => {
  it.each(["node:fs", "node:fs/promises", "node:os"])("has each named export of %s", async (source) => {
    const real = (await import(source)) as Record<string, unknown>;
    const shim = await load(await nodeShim(source));
    for (const name of Object.keys(real).filter((n) => n !== "default")) expect(shim, name).toHaveProperty(name);
  });

  it("has the functions that @mark1russell7/files imports", async () => {
    const shim = await load(await nodeShim("node:fs/promises"));
    for (const name of ["lstat", "readdir", "readFile", "stat"]) expect(typeof shim[name], name).toBe("function");
  });

  it("gives an export that throws with the name of the function", async () => {
    const shim = await load(await nodeShim("node:fs/promises"));
    const stat = shim["stat"] as () => unknown;
    expect(() => stat()).toThrow("The demo runs in a browser, so stat of node:fs/promises is not available.");
  });

  it("has a default export with the same functions", async () => {
    const shim = await load(await nodeShim("node:os"));
    expect((shim["default"] as Record<string, unknown>)["homedir"]).toBe(shim["homedir"]);
  });
});
