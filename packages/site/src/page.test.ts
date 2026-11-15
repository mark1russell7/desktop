import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");

describe("the home page", () => {
  it("names the package and gives the install command", () => {
    expect(page).toContain("<title>desktop: safe defaults for Electron apps, live</title>");
    expect(page).toContain("pnpm add @mark1russell7/desktop");
  });

  it("links to the pages of site-pages and to the repository", () => {
    expect(page).toContain('href="./releases/"');
    expect(page).toContain('href="./status/"');
    expect(page).toContain('href="https://github.com/mark1russell7/desktop"');
  });

  it("has each element that the script and the probe use", () => {
    const script = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
    const probe = readFileSync(new URL("./check-probe.ts", import.meta.url), "utf8");
    const ids = new Set([...script.matchAll(/byId(?:<[^>]+>)?\("([^"]+)"\)/g), ...probe.matchAll(/"#([a-z-]+)/g)].map((match) => match[1]));
    for (const id of ids) expect(page, id).toContain(`id="${id}"`);
    expect(ids.size).toBeGreaterThan(15);
  });
});
