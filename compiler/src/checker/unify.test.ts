// Unit tests for the unification module
import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import {
  unify, unify_effect_rows, UnificationError,
  apply, empty_subst, compose, occurs_in,
  type Substitution,
} from "./unify.js";
import {
  Type, INT, STR, BOOL, FLOAT, NEVER, ANY, EMPTY_ROW,
  EffectRow, effect_row,
} from "../types/index.js";

// Helper: create a type variable with a given id
function tvar(id: number): Type { return { kind: "var", id }; }

// Helper: create a function type
function fn_type(params: Type[], ret: Type, effects: EffectRow = EMPTY_ROW): Type {
  return { kind: "fn", params, return_type: ret, effects };
}

// Helper: create a record type
function record(fields: Array<{ name: string; type: Type }>, tail?: number): Type {
  return tail !== undefined
    ? { kind: "record", fields, tail }
    : { kind: "record", fields };
}

// ============================================================
// 1. Basic Unification
// ============================================================

describe("unify — basic types", () => {
  it("unifies identical Int types", () => {
    const s = unify(INT, INT, empty_subst());
    assert.ok(s);
    assert.equal(s.size, 0);
  });

  it("unifies identical Str types", () => {
    const s = unify(STR, STR, empty_subst());
    assert.ok(s);
    assert.equal(s.size, 0);
  });

  it("unifies identical Bool types", () => {
    const s = unify(BOOL, BOOL, empty_subst());
    assert.equal(s.size, 0);
  });

  it("unifies a type variable with a concrete type", () => {
    const v = tvar(500);
    const s = unify(v, INT, empty_subst());
    assert.equal(s.get(500)?.kind, "int");
  });

  it("unifies a concrete type with a type variable (reversed)", () => {
    const v = tvar(501);
    const s = unify(STR, v, empty_subst());
    assert.equal(s.get(501)?.kind, "str");
  });

  it("unifies two identical type variables (same id)", () => {
    const v = tvar(502);
    const s = unify(v, v, empty_subst());
    assert.equal(s.size, 0);
  });

  it("unifies Never with any type (bottom)", () => {
    const s = unify(NEVER, INT, empty_subst());
    assert.equal(s.size, 0);
  });

  it("unifies Any with any type", () => {
    const s = unify(ANY, STR, empty_subst());
    assert.equal(s.size, 0);
  });

  it("throws when unifying two different concrete types", () => {
    assert.throws(() => unify(INT, STR, empty_subst()), UnificationError);
  });

  it("throws when unifying Int with Bool", () => {
    assert.throws(() => unify(INT, BOOL, empty_subst()), UnificationError);
  });
});

// ============================================================
// 2. Occurs Check
// ============================================================

describe("unify — occurs check", () => {
  it("throws on occurs check: var in fn param", () => {
    const v = tvar(510);
    const t = fn_type([v], INT);
    assert.throws(() => unify(v, t, empty_subst()), UnificationError);
  });

  it("throws on occurs check: var in fn return type", () => {
    const v = tvar(511);
    const t = fn_type([INT], v);
    assert.throws(() => unify(v, t, empty_subst()), UnificationError);
  });

  it("occurs_in detects var in nested structure", () => {
    const v = tvar(512);
    const nested = fn_type([fn_type([v], INT)], STR);
    assert.equal(occurs_in(512, nested, empty_subst()), true);
  });

  it("occurs_in returns false when var is absent", () => {
    const nested = fn_type([INT], STR);
    assert.equal(occurs_in(513, nested, empty_subst()), false);
  });
});

// ============================================================
// 3. Function Type Unification
// ============================================================

describe("unify — function types", () => {
  it("unifies identical function types", () => {
    const f1 = fn_type([INT], STR);
    const f2 = fn_type([INT], STR);
    const s = unify(f1, f2, empty_subst());
    assert.equal(s.size, 0);
  });

  it("unifies function types with type variables", () => {
    const f1 = fn_type([tvar(520)], tvar(521));
    const f2 = fn_type([INT], STR);
    const s = unify(f1, f2, empty_subst());
    assert.equal(apply(s, tvar(520)).kind, "int");
    assert.equal(apply(s, tvar(521)).kind, "str");
  });

  it("throws on param type mismatch fn(Int)->Str vs fn(Str)->Int", () => {
    const f1 = fn_type([INT], STR);
    const f2 = fn_type([STR], INT);
    assert.throws(() => unify(f1, f2, empty_subst()), UnificationError);
  });

  it("throws on parameter count mismatch", () => {
    const f1 = fn_type([INT, STR], BOOL);
    const f2 = fn_type([INT], BOOL);
    assert.throws(() => unify(f1, f2, empty_subst()), UnificationError);
  });

  it("unifies multi-param function types", () => {
    const f1 = fn_type([INT, tvar(530)], BOOL);
    const f2 = fn_type([INT, FLOAT], BOOL);
    const s = unify(f1, f2, empty_subst());
    assert.equal(apply(s, tvar(530)).kind, "float");
  });
});

// ============================================================
// 4. Record Row Unification
// ============================================================

describe("unify — record rows", () => {
  it("unifies two records with matching fields", () => {
    const r1 = record([{ name: "x", type: INT }, { name: "y", type: STR }]);
    const r2 = record([{ name: "x", type: INT }, { name: "y", type: STR }]);
    const s = unify(r1, r2, empty_subst());
    assert.equal(s.size, 0);
  });

  it("throws when closed record is missing a field", () => {
    const r1 = record([{ name: "x", type: INT }, { name: "y", type: STR }]);
    const r2 = record([{ name: "x", type: INT }]);
    assert.throws(() => unify(r1, r2, empty_subst()), UnificationError);
  });

  it("unifies open record with extra fields via tail var", () => {
    // r1 = {x: Int, ..?540}  and  r2 = {x: Int, y: Str}
    const r1 = record([{ name: "x", type: INT }], 540);
    const r2 = record([{ name: "x", type: INT }, { name: "y", type: STR }]);
    const s = unify(r1, r2, empty_subst());
    // tail var 540 should be bound to record containing field y
    const resolved = apply(s, tvar(540));
    assert.equal(resolved.kind, "record");
    if (resolved.kind === "record") {
      assert.equal(resolved.fields.length, 1);
      assert.equal(resolved.fields[0].name, "y");
      assert.equal(resolved.fields[0].type.kind, "str");
    }
  });

  it("unifies field types through type variables", () => {
    const r1 = record([{ name: "x", type: tvar(541) }]);
    const r2 = record([{ name: "x", type: INT }]);
    const s = unify(r1, r2, empty_subst());
    assert.equal(apply(s, tvar(541)).kind, "int");
  });
});

// ============================================================
// 5. Effect Row Basics
// ============================================================

describe("unify_effect_rows — basics", () => {
  it("unifies two empty effect rows", () => {
    const s = unify_effect_rows(EMPTY_ROW, EMPTY_ROW, empty_subst());
    assert.equal(s.size, 0);
  });

  it("unifies matching io effect rows", () => {
    const r1: EffectRow = effect_row({ kind: "io" });
    const r2: EffectRow = effect_row({ kind: "io" });
    const s = unify_effect_rows(r1, r2, empty_subst());
    assert.equal(s.size, 0);
  });

  it("unifies matching fail effect rows (same error type)", () => {
    const r1: EffectRow = effect_row({ kind: "fail", error_type: STR });
    const r2: EffectRow = effect_row({ kind: "fail", error_type: STR });
    const s = unify_effect_rows(r1, r2, empty_subst());
    assert.equal(s.size, 0);
  });

  it("unifies fail effect rows with type variable error type", () => {
    const r1: EffectRow = effect_row({ kind: "fail", error_type: tvar(550) });
    const r2: EffectRow = effect_row({ kind: "fail", error_type: STR });
    const s = unify_effect_rows(r1, r2, empty_subst());
    assert.equal(apply(s, tvar(550)).kind, "str");
  });

  it("throws when effect present in closed row that lacks it", () => {
    const r1: EffectRow = effect_row({ kind: "io" });
    const r2: EffectRow = EMPTY_ROW; // closed, no tail
    assert.throws(
      () => unify_effect_rows(r1, r2, empty_subst()),
      UnificationError,
    );
  });
});

describe("unify_effect_rows — dual tail with unmatched effects (C5 regression)", () => {
  it("preserves unmatched effects from both sides via fresh tail", () => {
    const r1: EffectRow = { effects: [{ kind: "io" }], tail: 900 };
    const r2: EffectRow = { effects: [{ kind: "fail", error_type: STR }], tail: 901 };
    const s = unify_effect_rows(r1, r2, empty_subst());
    const resolved_r1 = apply(s, { kind: "var", id: 900 } as Type);
    assert.equal(resolved_r1.kind, "effect_row");
    if (resolved_r1.kind === "effect_row") {
      assert.ok(resolved_r1.effects.some(e => e.kind === "fail"), "r1 tail should include fail from r2");
    }
    const resolved_r2 = apply(s, { kind: "var", id: 901 } as Type);
    assert.equal(resolved_r2.kind, "effect_row");
    if (resolved_r2.kind === "effect_row") {
      assert.ok(resolved_r2.effects.some(e => e.kind === "io"), "r2 tail should include io from r1");
    }
  });

  it("unifies dual tail with no unmatched effects (simple case)", () => {
    const r1: EffectRow = { effects: [{ kind: "io" }], tail: 910 };
    const r2: EffectRow = { effects: [{ kind: "io" }], tail: 911 };
    const s = unify_effect_rows(r1, r2, empty_subst());
    const resolved = apply(s, { kind: "var", id: 910 } as Type);
    assert.equal(resolved.kind, "var");
    if (resolved.kind === "var") assert.equal(resolved.id, 911);
  });
});

// ============================================================
// 6. Apply & Compose helpers
// ============================================================

describe("apply and compose", () => {
  it("apply resolves a chain of substitutions", () => {
    const s: Substitution = new Map();
    s.set(600, tvar(601));
    s.set(601, INT);
    const result = apply(s, tvar(600));
    assert.equal(result.kind, "int");
  });

  it("compose merges two substitutions correctly", () => {
    const s1: Substitution = new Map([[700, tvar(701)]]);
    const s2: Substitution = new Map([[701, STR]]);
    const merged = compose(s1, s2);
    // s1's mapping for 700 should have s2 applied: tvar(701) -> STR
    assert.equal(apply(merged, tvar(700)).kind, "str");
    // s2's mapping should also be present
    assert.equal(apply(merged, tvar(701)).kind, "str");
  });
});
