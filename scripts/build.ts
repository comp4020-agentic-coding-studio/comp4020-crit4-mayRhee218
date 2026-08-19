#!/usr/bin/env node
// Bare stack: no bundler, so the "build" is a copy of the site source into
// dist/ --- everything at the repo root except this project's own scaffolding
// (config, docs, tooling). Add pages, link them, ship: nothing here parses
// HTML for entry points the way the old Vite config did, because a bare site
// has no separate entry points to discover --- the whole tree it doesn't skip
// *is* the site.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const SKIP = new Set([
  "node_modules",
  "dist",
  ".git",
  ".github",
  ".githooks",
  "spec",
  "scripts",
  "reflections",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "mise.toml",
  ".gitignore",
  ".gitattributes",
  ".oxlintrc.json",
  ".stylelintrc.json",
  "README.md",
  "CLAUDE.md",
  "AGENTS.md",
  "PROCESS.md",
  "PLAN.md",
]);

const DIST = "dist";

function main(): void {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST);

  for (const entry of readdirSync(".", { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    cpSync(join(".", entry.name), join(DIST, entry.name), { recursive: true });
  }

  if (!existsSync(join(DIST, "index.html"))) {
    console.error("dist/index.html missing after build --- check the SKIP list in scripts/build.ts");
    process.exit(1);
  }
}

main();
