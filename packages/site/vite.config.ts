import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

// The Pages workflow sets SITE_BASE to "/desktop". A local build uses the root.
const site = process.env["SITE_BASE"];

const SITE_FILE = fileURLToPath(new URL("./src/index.ts", import.meta.url));
// The modules of the package and of @mark1russell7/files. Only their imports of Node.js change.
const PACKAGE_CODE = /[\/](?:packages[\/]desktop[\/]src|@mark1russell7[\/]files)[\/]/;
// The modules of Node.js that the demos do not use. The browser build replaces each one with a shim.
const SHIMMED: ReadonlySet<string> = new Set(["node:fs", "node:fs/promises", "node:os"]);
// The id of a shim starts with a NUL character, so that no other plugin reads it as a file.
const SHIM_ID = "\0desktop-site:node-shim:";
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * This function gives the code of the browser shim of a module of Node.js. The shim has each export of the real
 * module, so a new import in `@mark1russell7/files` does not stop the build. Each export is a function that throws.
 *
 * @param source - The name of the module of Node.js, for example `node:fs/promises`.
 */
export async function nodeShim(source: string): Promise<string> {
  const real = (await import(source)) as Record<string, unknown>;
  const names = Object.keys(real)
    .filter((name) => name !== "default" && IDENTIFIER.test(name))
    .sort();
  return [
    "function absent(name) {",
    '  return function () { throw new Error("The demo runs in a browser, so " + name + " is not available."); };',
    "}",
    ...names.map((name) => `export const ${name} = absent(${JSON.stringify(`${name} of ${source}`)});`),
    `export default { ${names.join(", ")} };`,
    "",
  ].join("\n");
}

/**
 * This plugin lets the demos run the package in the browser. In the code of the package, `node:path` is `pathe`, the
 * POSIX rules of Node.js. The modules `node:fs`, `node:fs/promises` and `node:os` are shims from `nodeShim`, because the
 * demos do not use them. Vitest keeps the modules of Node.js, so the tests use the rules of the system.
 */
export function browserNode(): Plugin {
  return {
    name: "desktop-site:browser-node",
    enforce: "pre",
    async resolveId(source, importer) {
      if (importer === undefined || !PACKAGE_CODE.test(importer)) return null;
      if (source === "node:path") return this.resolve("pathe", SITE_FILE, { skipSelf: true });
      if (SHIMMED.has(source)) return SHIM_ID + source;
      return null;
    },
    async load(id) {
      return id.startsWith(SHIM_ID) ? nodeShim(id.slice(SHIM_ID.length)) : null;
    },
  };
}

export default defineConfig({
  base: site ? `${site.replace(/\/$/, "")}/` : "/",
  build: { target: "es2022" },
  plugins: [browserNode()],
});
