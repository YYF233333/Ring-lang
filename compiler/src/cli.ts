#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { Parser } from "./parser/parser.js";
import { check } from "./checker/checker.js";
import { generate } from "./codegen/codegen.js";
import { CollectingSink, make_diagnostic } from "./diagnostics/index.js";
import { enrich } from "./diagnostics/suggestions.js";
import { format_human, format_llm } from "./diagnostics/formatter.js";
import { CompileError } from "./errors.js";

type ErrorFormat = "human" | "llm";

function parse_args(args: string[]): { command: string; file: string; debug: boolean; error_format: ErrorFormat } {
  let debug = false;
  let error_format: ErrorFormat = "human";
  const positional: string[] = [];

  for (const arg of args) {
    if (arg === "--debug") {
      debug = true;
    } else if (arg.startsWith("--error-format=")) {
      const fmt = arg.slice("--error-format=".length);
      if (fmt !== "human" && fmt !== "llm") {
        console.error(`Unknown error format: ${fmt}. Use 'human' or 'llm'.`);
        process.exit(1);
      }
      error_format = fmt;
    } else {
      positional.push(arg);
    }
  }

  return { command: positional[0] ?? "help", file: positional[1] ?? "", debug, error_format };
}

function usage(): void {
  console.log(`Ring-lang compiler v0.1.0

Usage:
  ring build <file.ring>    Compile to .js file
  ring run <file.ring>      Compile and execute with Node.js
  ring check <file.ring>    Type-check only
  ring lsp                 Start Language Server Protocol server
  ring help                 Show this help

Options:
  --debug                   Print intermediate AST/HIR/JS for debugging
  --error-format=human|llm  Error output format (default: human)
`);
  process.exit(0);
}

async function main(): Promise<void> {
  const { command, file, debug, error_format } = parse_args(process.argv.slice(2));

  if (!command || command === "help") {
    usage();
  }

  if (command === "lsp") {
    if (!process.argv.includes("--stdio")) {
      process.argv.push("--stdio");
    }
    const { start_server } = await import("./lsp/server.js");
    start_server();
    return;
  }

  if (!file) {
    console.error(`Error: no input file specified.`);
    console.error(`Usage: ring ${command} <file.ring>`);
    process.exit(1);
  }

  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, "utf-8");
  const sink = new CollectingSink();

  try {
    const ast = Parser.parse(source, filePath, sink);
    if (debug) {
      console.error("[DEBUG] AST:");
      console.error(JSON.stringify(ast, null, 2).slice(0, 2000));
      console.error("");
    }

    const { program: hir } = check(ast, sink);

    // With declaration-level error recovery, check() may return partial results
    // while sink has accumulated errors. Abort before codegen if any errors exist.
    if ([...sink.diagnostics()].some(d => d.severity === "error")) {
      throw new CompileError([]);
    }

    if (debug) {
      console.error("[DEBUG] HIR:");
      console.error(JSON.stringify(hir, null, 2).slice(0, 2000));
      console.error("");
    }

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
          if (execErr.stdout) process.stdout.write(execErr.stdout);
          if (execErr.stderr) process.stderr.write(execErr.stderr);
          process.exit(execErr.status ?? 1);
        } finally {
          try { fs.unlinkSync(tmpFile); } catch {}
        }
        break;
      }
      default: {
        console.error(`Unknown command: ${command}`);
        usage();
      }
    }
  } catch (err) {
    let diagnostics = [...sink.diagnostics()];

    if (err instanceof CompileError) {
      for (const d of err.diagnostics) {
        if (!diagnostics.includes(d)) {
          diagnostics.push(d);
        }
      }
    } else if (err instanceof Error) {
      diagnostics.push(make_diagnostic(
        "E0000", "error", err.message,
        { file: filePath, start: { line: 1, column: 0, offset: 0 }, end: { line: 1, column: 0, offset: 0 } },
        { kind: "other", detail: err.message },
      ));
    }

    diagnostics = enrich(diagnostics);

    if (error_format === "llm") {
      console.log(format_llm(diagnostics, filePath));
    } else {
      console.error(format_human(diagnostics, source));
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
