import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

// The Pages workflow sets SITE_BASE to "/desktop". A local build uses the root.
const site = process.env["SITE_BASE"];

const SHIM = fileURLToPath(new URL("./src/node-shim.ts", import.meta.url));
const SITE_FILE = fileURLToPath(new URL("./src/index.ts", import.meta.url));
// The modules of the package and of @mark1russell7/files. Only their imports of Node.js change.
const PACKAGE_CODE = /[\/](?:packages[\/]desktop[\/]src|@mark1russell7[\/]files)[\/]/;

/**
 * This plugin lets the demos run the package in the browser. In the code of the package, `node:path` is `pathe`, the
 * POSIX rules of Node.js. The modules `node:fs`, `node:fs/promises` and `node:os` are `src/node-shim.ts`, because the
 * demos do not use them. Vitest keeps the modules of Node.js, so the tests use the rules of the system.
 */
export function browserNode(): Plugin {
  return {
    name: "desktop-site:browser-node",
    enforce: "pre",
    async resolveId(source, importer) {
      if (importer === undefined || !PACKAGE_CODE.test(importer)) return null;
      if (source === "node:path") return this.resolve("pathe", SITE_FILE, { skipSelf: true });
      if (source === "node:fs" || source === "node:fs/promises" || source === "node:os") return SHIM;
      return null;
    },
  };
}

export default defineConfig({
  base: site ? `${site.replace(/\/$/, "")}/` : "/",
  build: { target: "es2022" },
  plugins: [browserNode()],
});
