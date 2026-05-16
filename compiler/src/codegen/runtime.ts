// Ring-lang runtime helpers — emitted as preamble in generated JS.

export const RUNTIME_CODE = `// === Ring-lang Runtime ===
function __run_handler(gen, handlers) {
  let result = gen.next();
  while (!result.done) {
    const effect = result.value;
    const key = effect.effect + "." + effect.op;
    const handler = handlers[key];
    if (!handler) {
      throw new Error("Unhandled effect: " + key);
    }
    let resumed = false;
    const resume = (v) => { resumed = true; result = gen.next(v); };
    const handled = handler(effect.args, resume);
    if (!resumed) {
      result = gen.next(handled);
    }
  }
  return result.value;
}

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
