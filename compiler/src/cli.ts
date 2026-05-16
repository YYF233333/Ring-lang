#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { Parser } from "./parser/parser.js";
import { check } from "./checker/checker.js";
import { generate } from "./codegen/codegen.js";

const args = process.argv.slice(2);
const debug = args.includes("--debug");
const filteredArgs = args.filter(a => a !== "--debug");
const command = filteredArgs[0];
const file = filteredArgs[1];

function usage(): void {
  console.log(`Ring-lang compiler v0.1.0

Usage:
  ring build <file.ring>    Compile to .js file
  ring run <file.ring>      Compile and execute with Node.js
  ring check <file.ring>    Type-check only
  ring help                 Show this help

Options:
  --debug    Print intermediate AST/HIR/JS for debugging
`);
  process.exit(0);
}

if (!command || command === "help") {
  usage();
}

if (!file) {
  console.error(`Error: no input file specified.`);
  console.error(`Usage: ring ${command} <file.ring>`);
  process.exit(1);
}

// Resolve file path
const filePath = path.resolve(file);
if (!fs.existsSync(filePath)) {
  console.error(`Error: file not found: ${filePath}`);
  process.exit(1);
}

const source = fs.readFileSync(filePath, "utf-8");

try {
  // Parse
  const ast = Parser.parse(source, filePath);
  if (debug) {
    console.error("[DEBUG] AST:");
    console.error(JSON.stringify(ast, null, 2).slice(0, 2000));
    console.error("");
  }

  // Type-check
  const hir = check(ast);
  if (debug) {
    console.error("[DEBUG] HIR:");
    console.error(JSON.stringify(hir, null, 2).slice(0, 2000));
    console.error("");
  }

  // Generate JS
  const js = generate(hir);
  if (debug) {
    console.error("[DEBUG] Generated JS:");
    console.error(js);
    console.error("");
  }

  switch (command) {
    case "check": {
      console.log("OK");
      break;
    }
    case "build": {
      const outPath = filePath.replace(/\.ring$/, ".js");
      fs.writeFileSync(outPath, js, "utf-8");
      console.log(`Compiled: ${outPath}`);
      break;
    }
    case "run": {
      // Write to temp file and execute
      const tmpDir = path.dirname(filePath);
      const tmpFile = path.join(tmpDir, `.ring_tmp_${Date.now()}.js`);
      fs.writeFileSync(tmpFile, js, "utf-8");
      try {
        const output = execSync(`node "${tmpFile}"`, {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        if (output) {
          process.stdout.write(output);
        }
      } catch (execErr: any) {
        // Node execution error — print stdout+stderr from the child
        if (execErr.stdout) {
          process.stdout.write(execErr.stdout);
        }
        if (execErr.stderr) {
          process.stderr.write(execErr.stderr);
        }
        process.exit(execErr.status ?? 1);
      } finally {
        // Clean up temp file
        try { fs.unlinkSync(tmpFile); } catch {}
      }
      break;
    }
    default: {
      console.error(`Unknown command: ${command}`);
      usage();
    }
  }
} catch (err: any) {
  // Format error with location if available
  const msg = err.message ?? String(err);
  console.error(`Error: ${msg}`);
  if (debug && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
}
