export const E = {
  // Parser errors (E01xx)
  E0101: "E0101", // unexpected token
  E0102: "E0102", // unterminated string
  E0103: "E0103", // expected specific token

  // Checker general (E02xx)
  E0201: "E0201", // undefined variable
  E0202: "E0202", // reserved (originally arity mismatch, now caught via E0301)
  E0203: "E0203", // unknown struct / invalid constructor fields
  E0204: "E0204", // unknown type

  // Type errors (E03xx)
  E0301: "E0301", // type mismatch (unification)
  E0302: "E0302", // infinite type (occurs check)
  E0303: "E0303", // numeric type required
  E0304: "E0304", // field access on non-struct
  E0305: "E0305", // undefined method

  // Effect errors (E04xx)
  E0402: "E0402", // unknown effect operation
  E0403: "E0403", // unhandled effect

  // Trait errors (E05xx)
  E0501: "E0501", // unknown trait
  E0502: "E0502", // missing impl method
  E0503: "E0503", // unsatisfied trait bound

  // Pattern errors (E06xx)
  E0601: "E0601", // non-exhaustive match

  // Control flow errors (E02xx continued)
  E0205: "E0205", // assignment to immutable variable
  E0206: "E0206", // break/continue outside loop

  // Module errors (E07xx)
  E0701: "E0701", // reserved (non-pub imports produce E0703 instead)
  E0702: "E0702", // module not found
  E0703: "E0703", // symbol not found in module
  E0704: "E0704", // circular dependency
  E0705: "E0705", // reserved (duplicate imports currently allowed)
  E0706: "E0706", // use not at file top

  // Trait dispatch errors (E03xx continued)
  E0307: "E0307", // type does not implement Eq
  E0308: "E0308", // type does not implement Ord
  E0207: "E0207", // duplicate definition
} as const;

export const ERROR_DESCRIPTIONS: Record<string, string> = {
  [E.E0101]: "Unexpected token",
  [E.E0102]: "Unterminated string literal",
  [E.E0103]: "Expected token",
  [E.E0201]: "Undefined variable",
  [E.E0202]: "Arity mismatch",
  [E.E0203]: "Unknown struct or invalid constructor fields",
  [E.E0204]: "Unknown type",
  [E.E0301]: "Type mismatch",
  [E.E0302]: "Infinite type (occurs check)",
  [E.E0303]: "Numeric type required",
  [E.E0304]: "Invalid field access",
  [E.E0305]: "Undefined method",
  [E.E0402]: "Unknown effect operation",
  [E.E0403]: "Unhandled effect",
  [E.E0501]: "Unknown trait",
  [E.E0502]: "Missing trait method implementation",
  [E.E0503]: "Unsatisfied trait bound",
  [E.E0601]: "Non-exhaustive pattern match",
  [E.E0205]: "Assignment to immutable variable",
  [E.E0206]: "Break/continue outside loop",
  [E.E0701]: "Importing non-public symbol",
  [E.E0702]: "Module not found",
  [E.E0703]: "Symbol not found in module",
  [E.E0704]: "Circular dependency detected",
  [E.E0705]: "Duplicate import",
  [E.E0706]: "Use declaration must appear before other declarations",
  [E.E0307]: "Type does not implement Eq",
  [E.E0308]: "Type does not implement Ord",
  [E.E0207]: "Duplicate definition",
};
