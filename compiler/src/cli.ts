#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "help") {
  console.log(`Ring-lang compiler v0.1.0

Usage:
  ring build <file.ring>    Compile to JavaScript
  ring run <file.ring>      Compile and execute
  ring check <file.ring>    Type-check without emitting
  ring fmt <file.ring>      Format with annotation level
  ring help                 Show this help

Options:
  --error-format=llm        Output structured errors for LLM consumption
  --annotation-level=N      Set formatter annotation level (0-4)
`);
  process.exit(0);
}

console.log(`ring ${command}: not yet implemented`);
process.exit(1);
