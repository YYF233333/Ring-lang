// Ring-lang runtime helpers — emitted as preamble in generated JS.

export const RUNTIME_CODE = `// === Ring-lang Runtime ===
class __EffectAbort {
  constructor(effect, value) {
    this.effect = effect;
    this.value = value;
  }
}

function Cell(value) { return { value }; }
function Cell_get(self, __ring_ev_mut) { return self.value; }
function Cell_set(self, val, __ring_ev_mut) { self.value = val; }
function Cell_update(self, f, __ring_ev_mut) { self.value = f(self.value); }

function __match_fail(value) {
  throw new Error("Non-exhaustive match: " + JSON.stringify(value));
}

function print(...args) {
  console.log(...args);
}

function assert(cond, msg) {
  if (!cond) {
    throw new Error("Assertion failed" + (msg ? ": " + msg : ""));
  }
}

function panic(msg) {
  throw new Error("panic: " + msg);
}

function exit(code) {
  process.exit(code);
}
`;
