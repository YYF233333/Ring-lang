#!/usr/bin/env node
// Mechanical lint checks for Ring-lang compiler.
// Run via: npm run lint
// These supplement tsc --strict — they catch patterns the type system can't.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
let errors = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith(".ts")) {
      check_file(full);
    }
  }
}

function check_file(path) {
  const rel = relative(SRC, path);
  const lines = readFileSync(path, "utf-8").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;

    // Ban "as any" — use proper type narrowing instead
    if (/\bas any\b/.test(line) && !line.trimStart().startsWith("//")) {
      report(rel, ln, `"as any" cast — use type narrowing or fix the type signature`);
    }

    // Ban @ts-ignore / @ts-nocheck — fix the type error instead
    if (/@ts-(ignore|nocheck)/.test(line)) {
      report(rel, ln, `@ts-ignore/nocheck suppresses errors — fix the underlying type issue`);
    }

    // Warn on console.log in non-test, non-CLI, non-runtime files (likely debug leftover)
    if (/\bconsole\.log\b/.test(line) && !rel.includes(".test.") && !rel.includes("cli.ts") && !rel.includes("runtime.ts")) {
      report(rel, ln, `console.log in compiler source — likely debug leftover`);
    }
  }
}

function report(file, line, msg) {
  console.error(`  ${file}:${line}: ${msg}`);
  errors++;
}

walk(SRC);

if (errors > 0) {
  console.error(`\n${errors} lint error(s) found.`);
  process.exit(1);
} else {
  console.log("Lint: OK");
}
