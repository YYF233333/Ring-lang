import { describe, it, beforeEach, afterEach } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  module_key,
  module_prefix,
  resolve_module_file,
  build_module_graph,
  ModuleGraph,
} from "./resolver.js";

// ============================================================
// Helpers
// ============================================================

let tmp_dir: string;

function setup_tmp(): string {
  tmp_dir = fs.mkdtempSync(path.join(os.tmpdir(), "ring-resolver-"));
  return tmp_dir;
}

function cleanup_tmp(): void {
  if (tmp_dir && fs.existsSync(tmp_dir)) {
    fs.rmSync(tmp_dir, { recursive: true, force: true });
  }
}

function write_ring(dir: string, relative_path: string, content: string): string {
  const full = path.join(dir, relative_path);
  const parent = path.dirname(full);
  fs.mkdirSync(parent, { recursive: true });
  fs.writeFileSync(full, content, "utf-8");
  return full;
}

// ============================================================
// Utility function tests
// ============================================================

describe("module_key", () => {
  it("joins segments with ::", () => {
    assert.equal(module_key(["checker", "env"]), "checker::env");
  });

  it("single segment", () => {
    assert.equal(module_key(["main"]), "main");
  });

  it("three segments", () => {
    assert.equal(module_key(["a", "b", "c"]), "a::b::c");
  });
});

describe("module_prefix", () => {
  it("joins segments with $", () => {
    assert.equal(module_prefix(["checker", "env"]), "checker$env");
  });

  it("single segment", () => {
    assert.equal(module_prefix(["main"]), "main");
  });
});

describe("resolve_module_file", () => {
  beforeEach(() => { setup_tmp(); });
  afterEach(() => { cleanup_tmp(); });

  it("resolves single-segment use to .ring file", () => {
    write_ring(tmp_dir, "lib.ring", "fn greet() {}");
    const result = resolve_module_file(["lib"], tmp_dir);
    assert.ok(result !== null);
    assert.ok(result!.endsWith("lib.ring"));
  });

  it("resolves nested path to subdirectory", () => {
    write_ring(tmp_dir, "checker/env.ring", "fn env() {}");
    const result = resolve_module_file(["checker", "env"], tmp_dir);
    assert.ok(result !== null);
    assert.ok(result!.endsWith(path.join("checker", "env.ring")));
  });

  it("returns null for nonexistent module", () => {
    const result = resolve_module_file(["nonexistent"], tmp_dir);
    assert.equal(result, null);
  });
});

// ============================================================
// build_module_graph tests
// ============================================================

describe("build_module_graph", () => {
  beforeEach(() => { setup_tmp(); });
  afterEach(() => { cleanup_tmp(); });

  it("single file with no imports — trivial graph", () => {
    const entry = write_ring(tmp_dir, "main.ring", "fn main() {}");
    const result = build_module_graph(entry);

    assert.ok(!("error" in result), "should not be an error");
    const graph = result as ModuleGraph;

    assert.equal(graph.modules.size, 1);
    assert.equal(graph.topo_order.length, 1);
    assert.equal(graph.topo_order[0], "main");
    assert.equal(graph.entry.path_segments[0], "main");
  });

  it("two-file dependency — correct topo order", () => {
    write_ring(tmp_dir, "lib.ring", "pub fn greet() {}");
    const entry = write_ring(tmp_dir, "main.ring", [
      "use lib",
      "fn main() { greet() }",
    ].join("\n"));

    const result = build_module_graph(entry);
    assert.ok(!("error" in result), "should not be an error");
    const graph = result as ModuleGraph;

    assert.equal(graph.modules.size, 2);
    assert.equal(graph.topo_order.length, 2);

    const lib_idx = graph.topo_order.indexOf("lib");
    const main_idx = graph.topo_order.indexOf("main");
    assert.ok(lib_idx < main_idx, "lib should come before main in topo order");

    // Check dependencies
    const main_deps = graph.dependencies.get("main");
    assert.ok(main_deps !== undefined);
    assert.ok(main_deps!.includes("lib"));
  });

  it("missing module — returns error", () => {
    const entry = write_ring(tmp_dir, "main.ring", [
      "use nonexistent",
      "fn main() {}",
    ].join("\n"));

    const result = build_module_graph(entry);
    assert.ok("error" in result, "should be an error");
    assert.ok(result.error.includes("nonexistent"));
  });

  it("circular dependency — returns error with cycle info", () => {
    write_ring(tmp_dir, "a.ring", [
      "use b",
      "pub fn fa() {}",
    ].join("\n"));
    write_ring(tmp_dir, "b.ring", [
      "use a",
      "pub fn fb() {}",
    ].join("\n"));
    const entry = write_ring(tmp_dir, "main.ring", [
      "use a",
      "fn main() {}",
    ].join("\n"));

    const result = build_module_graph(entry);
    assert.ok("error" in result, "should be an error");
    assert.ok(
      result.error.toLowerCase().includes("circular"),
      `Error message should mention circular: ${result.error}`,
    );
    assert.ok(result.cycle !== undefined, "should have cycle info");
  });

  it("diamond dependency — no duplicates, correct order", () => {
    // A (main) → B, C; B → D; C → D
    write_ring(tmp_dir, "d.ring", "pub fn fd() {}");
    write_ring(tmp_dir, "b.ring", [
      "use d",
      "pub fn fb() {}",
    ].join("\n"));
    write_ring(tmp_dir, "c.ring", [
      "use d",
      "pub fn fc() {}",
    ].join("\n"));
    const entry = write_ring(tmp_dir, "main.ring", [
      "use b",
      "use c",
      "fn main() {}",
    ].join("\n"));

    const result = build_module_graph(entry);
    assert.ok(!("error" in result), "should not be an error");
    const graph = result as ModuleGraph;

    assert.equal(graph.modules.size, 4);
    assert.equal(graph.topo_order.length, 4);

    // No duplicates
    const unique = new Set(graph.topo_order);
    assert.equal(unique.size, 4, "no duplicates in topo_order");

    // D must come before B and C
    const d_idx = graph.topo_order.indexOf("d");
    const b_idx = graph.topo_order.indexOf("b");
    const c_idx = graph.topo_order.indexOf("c");
    const main_idx = graph.topo_order.indexOf("main");
    assert.ok(d_idx < b_idx, "d before b");
    assert.ok(d_idx < c_idx, "d before c");
    assert.ok(b_idx < main_idx, "b before main");
    assert.ok(c_idx < main_idx, "c before main");
  });

  it("nested path — resolves to subdirectory", () => {
    write_ring(tmp_dir, "checker/env.ring", "pub fn create_env() {}");
    // `use checker::env::create_env` → parser produces path.segments=["checker","env"]
    // (the parser pops the last segment "create_env" as the imported name)
    const entry = write_ring(tmp_dir, "main.ring", [
      "use checker::env::create_env",
      "fn main() {}",
    ].join("\n"));

    const result = build_module_graph(entry);
    assert.ok(!("error" in result), "should not be an error");
    const graph = result as ModuleGraph;

    assert.equal(graph.modules.size, 2);
    assert.ok(graph.modules.has("checker::env"));

    const mod = graph.modules.get("checker::env")!;
    assert.deepEqual(mod.path_segments, ["checker", "env"]);

    const main_deps = graph.dependencies.get("main");
    assert.ok(main_deps!.includes("checker::env"));

    // checker::env before main
    const env_idx = graph.topo_order.indexOf("checker::env");
    const main_idx = graph.topo_order.indexOf("main");
    assert.ok(env_idx < main_idx, "checker::env before main");
  });
});
