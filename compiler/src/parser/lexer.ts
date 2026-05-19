// Ring-lang Lexer — hand-written tokenizer
import { Position, Span } from "../ast/index.js";
import { DiagnosticSink, CollectingSink, make_diagnostic } from "../diagnostics/index.js";
import { E } from "../diagnostics/codes.js";

// ============================================================
// Token types
// ============================================================

export enum TokenKind {
  // Keywords
  Fn = "fn",
  Let = "let",
  Var = "var",
  Struct = "struct",
  Enum = "enum",
  Match = "match",
  Impl = "impl",
  Effect = "effect",
  Handle = "handle",
  With = "with",
  If = "if",
  Else = "else",
  Or = "or",
  Catch = "catch",
  Test = "test",
  Return = "return",
  For = "for",
  In = "in",
  Pub = "pub",
  Where = "where",
  True = "true",
  False = "false",
  Trait = "trait",
  Try = "try",
  While = "while",
  Break = "break",
  Continue = "continue",
  Use = "use",
  As = "as",

  // Literals
  IntLit = "int_lit",
  FloatLit = "float_lit",
  StringLit = "string_lit",
  StringInterpStart = "string_interp_start",   // "hello ${
  StringInterpMiddle = "string_interp_middle", // } middle ${
  StringInterpEnd = "string_interp_end",       // } end"
  RawStringLit = "raw_string_lit",

  // Identifier
  Ident = "ident",

  // Operators
  Plus = "+",
  Minus = "-",
  Star = "*",
  Slash = "/",
  Percent = "%",
  EqEq = "==",
  BangEq = "!=",
  Lt = "<",
  Gt = ">",
  LtEq = "<=",
  GtEq = ">=",
  AmpAmp = "&&",
  PipePipe = "||",
  Bang = "!",
  Eq = "=",
  PlusEq = "+=",
  MinusEq = "-=",

  // Delimiters
  LParen = "(",
  RParen = ")",
  LBrace = "{",
  RBrace = "}",
  LBracket = "[",
  RBracket = "]",
  Comma = ",",
  Colon = ":",
  ColonColon = "::",
  Dot = ".",
  DotDot = "..",
  DotDotEq = "..=",
  FatArrow = "=>",
  Arrow = "->",
  Question = "?",

  // Semicolons
  Semi = ";",

  // Special
  Eof = "eof",
  Error = "error_token",
}

const KEYWORDS: Record<string, TokenKind> = {
  fn: TokenKind.Fn,
  let: TokenKind.Let,
  var: TokenKind.Var,
  struct: TokenKind.Struct,
  enum: TokenKind.Enum,
  match: TokenKind.Match,
  impl: TokenKind.Impl,
  effect: TokenKind.Effect,
  handle: TokenKind.Handle,
  with: TokenKind.With,
  if: TokenKind.If,
  else: TokenKind.Else,
  or: TokenKind.Or,
  catch: TokenKind.Catch,
  test: TokenKind.Test,
  return: TokenKind.Return,
  for: TokenKind.For,
  in: TokenKind.In,
  pub: TokenKind.Pub,
  where: TokenKind.Where,
  true: TokenKind.True,
  false: TokenKind.False,
  trait: TokenKind.Trait,
  try: TokenKind.Try,
  while: TokenKind.While,
  break: TokenKind.Break,
  continue: TokenKind.Continue,
  use: TokenKind.Use,
  as: TokenKind.As,
};

export interface Token {
  kind: TokenKind;
  value: string;   // raw text of the token
  span: Span;
}

// ============================================================
// Lexer
// ============================================================

export class Lexer {
  private source: string;
  private file: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 0;
  private sink: DiagnosticSink;

  // For string interpolation: brace depth tracking
  private interp_brace_depth: number[] = [];

  constructor(source: string, file: string = "<stdin>", sink?: DiagnosticSink) {
    this.source = source;
    this.sink = sink ?? new CollectingSink();
    this.file = file;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (true) {
      const tok = this.next_token();
      tokens.push(tok);
      if (tok.kind === TokenKind.Eof) break;
    }
    return tokens;
  }

  next_token(): Token {
    this.skip_whitespace_and_comments();

    if (this.pos >= this.source.length) {
      return this.make_token(TokenKind.Eof, "", this.current_position());
    }

    // Check if we're inside a string interpolation and hit '}'
    if (this.interp_brace_depth.length > 0) {
      const top = this.interp_brace_depth[this.interp_brace_depth.length - 1];
      if (top === 0 && this.peek() === "}") {
        // End of interpolation expression — continue string
        this.advance(); // consume '}'
        return this.lex_string_continuation();
      }
    }

    const start = this.current_position();
    const ch = this.peek();

    // Raw strings: r#"..."#
    if (ch === "r" && this.pos + 1 < this.source.length && this.source[this.pos + 1] === "#") {
      return this.lex_raw_string(start);
    }

    // String literals
    if (ch === '"') {
      return this.lex_string(start);
    }

    // Numbers
    if (this.is_digit(ch)) {
      return this.lex_number(start);
    }

    // Identifiers and keywords
    if (this.is_ident_start(ch)) {
      return this.lex_ident(start);
    }

    // Operators and delimiters
    return this.lex_punctuation(start);
  }

  // ============================================================
  // String lexing
  // ============================================================

  private lex_string(start: Position): Token {
    this.advance(); // consume opening "
    return this.lex_string_body(start, "new");
  }

  private lex_string_continuation(): Token {
    const start = this.current_position();
    // We already consumed the closing } of the interpolation
    return this.lex_string_body(start, "continuation");
  }

  private lex_string_body(start: Position, mode: "new" | "continuation"): Token {
    let value = "";
    while (this.pos < this.source.length) {
      const ch = this.peek();
      if (ch === '"') {
        this.advance(); // consume closing "
        const end = this.current_position();
        if (mode === "new") {
          // A freshly opened string — always returns StringLit or StringInterpStart
          // (Never pops interp depth — we're a nested string inside interpolation)
          return this.make_token(TokenKind.StringLit, value, start, end);
        } else {
          // Continuation after interpolation — this closes the outer interp string
          this.interp_brace_depth.pop();
          return this.make_token(TokenKind.StringInterpEnd, value, start, end);
        }
      }
      if (ch === "$" && this.pos + 1 < this.source.length && this.source[this.pos + 1] === "{") {
        // String interpolation start
        this.advance(); // consume $
        this.advance(); // consume {
        const end = this.current_position();
        if (mode === "new") {
          this.interp_brace_depth.push(0); // push new brace depth tracker
          return this.make_token(TokenKind.StringInterpStart, value, start, end);
        } else {
          // Continuation: reuse the existing stack entry (reset depth to 0)
          this.interp_brace_depth[this.interp_brace_depth.length - 1] = 0;
          return this.make_token(TokenKind.StringInterpMiddle, value, start, end);
        }
      }
      if (ch === "\\") {
        this.advance(); // consume backslash
        if (this.pos >= this.source.length) {
          value += "\\";
          break;
        }
        const esc = this.peek();
        this.advance();
        switch (esc) {
          case "n": value += "\n"; break;
          case "t": value += "\t"; break;
          case "r": value += "\r"; break;
          case "\\": value += "\\"; break;
          case '"': value += '"'; break;
          case "$": value += "$"; break;
          default: value += esc; break;
        }
      } else {
        value += ch;
        this.advance();
      }
    }
    const end = this.current_position();
    const span: Span = { file: this.file, start, end };
    this.sink.report(make_diagnostic(E.E0102, "error", "Unterminated string literal", span, { kind: "parse_error", token: value }));
    return this.make_token(TokenKind.Error, value, start, end);
  }

  private lex_raw_string(start: Position): Token {
    this.advance(); // consume 'r'
    if (this.peek() !== '#') {
      const end = this.current_position();
      return this.make_token(TokenKind.Ident, "r", start, end);
    }
    this.advance(); // consume '#'
    if (this.peek() !== '"') {
      // Not a raw string — backtrack: emit 'r' and let '#' be re-lexed next call
      this.pos--;
      this.column--;
      const end = this.current_position();
      return this.make_token(TokenKind.Ident, "r", start, end);
    }
    this.advance(); // consume opening "
    let value = "";
    while (this.pos < this.source.length) {
      const ch = this.peek();
      if (ch === '"' && this.pos + 1 < this.source.length && this.source[this.pos + 1] === "#") {
        this.advance(); // consume "
        this.advance(); // consume #
        const end = this.current_position();
        return this.make_token(TokenKind.RawStringLit, value, start, end);
      }
      value += ch;
      this.advance();
    }
    const span: Span = { file: this.file, start, end: this.current_position() };
    this.sink.report(make_diagnostic(E.E0102, "error", "Unterminated raw string literal", span, { kind: "parse_error", token: value }));
    const end = this.current_position();
    return this.make_token(TokenKind.Error, value, start, end);
  }

  // ============================================================
  // Number lexing
  // ============================================================

  private lex_number(start: Position): Token {
    let value = "";
    let is_float = false;

    while (this.pos < this.source.length && this.is_digit(this.peek())) {
      value += this.peek();
      this.advance();
    }

    if (this.pos < this.source.length && this.peek() === "." &&
        this.pos + 1 < this.source.length && this.is_digit(this.source[this.pos + 1])) {
      is_float = true;
      value += ".";
      this.advance(); // consume '.'
      while (this.pos < this.source.length && this.is_digit(this.peek())) {
        value += this.peek();
        this.advance();
      }
    }

    const end = this.current_position();
    return this.make_token(
      is_float ? TokenKind.FloatLit : TokenKind.IntLit,
      value,
      start,
      end
    );
  }

  // ============================================================
  // Identifier / Keyword lexing
  // ============================================================

  private lex_ident(start: Position): Token {
    let value = "";
    while (this.pos < this.source.length && this.is_ident_continue(this.peek())) {
      value += this.peek();
      this.advance();
    }
    const end = this.current_position();
    const kind = KEYWORDS[value] ?? TokenKind.Ident;
    return this.make_token(kind, value, start, end);
  }

  // ============================================================
  // Punctuation / Operators
  // ============================================================

  private lex_punctuation(start: Position): Token {
    const ch = this.peek();
    this.advance();

    switch (ch) {
      case "(": return this.make_token(TokenKind.LParen, "(", start);
      case ")": return this.make_token(TokenKind.RParen, ")", start);
      case "{":
        // Track brace depth for interpolation
        if (this.interp_brace_depth.length > 0) {
          this.interp_brace_depth[this.interp_brace_depth.length - 1]++;
        }
        return this.make_token(TokenKind.LBrace, "{", start);
      case "}":
        // Track brace depth for interpolation
        if (this.interp_brace_depth.length > 0) {
          this.interp_brace_depth[this.interp_brace_depth.length - 1]--;
          // If depth goes below zero, it means this } closes the interpolation
          // but we handle that above in next_token, so this shouldn't happen normally
        }
        return this.make_token(TokenKind.RBrace, "}", start);
      case "[": return this.make_token(TokenKind.LBracket, "[", start);
      case "]": return this.make_token(TokenKind.RBracket, "]", start);
      case ",": return this.make_token(TokenKind.Comma, ",", start);
      case ":":
        if (this.peek() === ":") { this.advance(); return this.make_token(TokenKind.ColonColon, "::", start); }
        return this.make_token(TokenKind.Colon, ":", start);
      case ";": return this.make_token(TokenKind.Semi, ";", start);
      case "?": return this.make_token(TokenKind.Question, "?", start);
      case ".":
        if (this.peek() === ".") {
          this.advance();
          if (this.peek() === "=") { this.advance(); return this.make_token(TokenKind.DotDotEq, "..=", start); }
          return this.make_token(TokenKind.DotDot, "..", start);
        }
        return this.make_token(TokenKind.Dot, ".", start);
      case "+":
        if (this.peek() === "=") { this.advance(); return this.make_token(TokenKind.PlusEq, "+=", start); }
        return this.make_token(TokenKind.Plus, "+", start);
      case "-":
        if (this.peek() === ">") { this.advance(); return this.make_token(TokenKind.Arrow, "->", start); }
        if (this.peek() === "=") { this.advance(); return this.make_token(TokenKind.MinusEq, "-=", start); }
        return this.make_token(TokenKind.Minus, "-", start);
      case "*": return this.make_token(TokenKind.Star, "*", start);
      case "/": return this.make_token(TokenKind.Slash, "/", start);
      case "%": return this.make_token(TokenKind.Percent, "%", start);
      case "=":
        if (this.peek() === "=") { this.advance(); return this.make_token(TokenKind.EqEq, "==", start); }
        if (this.peek() === ">") { this.advance(); return this.make_token(TokenKind.FatArrow, "=>", start); }
        return this.make_token(TokenKind.Eq, "=", start);
      case "!":
        if (this.peek() === "=") { this.advance(); return this.make_token(TokenKind.BangEq, "!=", start); }
        return this.make_token(TokenKind.Bang, "!", start);
      case "<":
        if (this.peek() === "=") { this.advance(); return this.make_token(TokenKind.LtEq, "<=", start); }
        return this.make_token(TokenKind.Lt, "<", start);
      case ">":
        if (this.peek() === "=") { this.advance(); return this.make_token(TokenKind.GtEq, ">=", start); }
        return this.make_token(TokenKind.Gt, ">", start);
      case "&":
        if (this.peek() === "&") { this.advance(); return this.make_token(TokenKind.AmpAmp, "&&", start); }
        { const tok = this.make_token(TokenKind.Error, "&", start);
          this.sink.report(make_diagnostic(E.E0101, "error", "Unexpected character '&' (use '&&' for logical AND)", tok.span, { kind: "parse_error", token: "&" }));
          return tok; }
      case "|":
        if (this.peek() === "|") { this.advance(); return this.make_token(TokenKind.PipePipe, "||", start); }
        { const tok = this.make_token(TokenKind.Error, "|", start);
          this.sink.report(make_diagnostic(E.E0101, "error", "Unexpected character '|' (use '||' for logical OR)", tok.span, { kind: "parse_error", token: "|" }));
          return tok; }
      default:
        { const tok = this.make_token(TokenKind.Error, ch, start);
          this.sink.report(make_diagnostic(E.E0101, "error", `Unexpected character '${ch}'`, tok.span, { kind: "parse_error", token: ch }));
          return tok; }
    }
  }

  // ============================================================
  // Helpers
  // ============================================================

  private skip_whitespace_and_comments(): void {
    while (this.pos < this.source.length) {
      const ch = this.peek();
      if (ch === " " || ch === "\t" || ch === "\r") {
        this.advance();
      } else if (ch === "\n") {
        this.advance();
      } else if (ch === "/" && this.pos + 1 < this.source.length && this.source[this.pos + 1] === "/") {
        // Line comment
        while (this.pos < this.source.length && this.peek() !== "\n") {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  private peek(): string {
    return this.source[this.pos];
  }

  private advance(): void {
    if (this.pos < this.source.length) {
      if (this.source[this.pos] === "\n") {
        this.line++;
        this.column = 0;
      } else {
        this.column++;
      }
      this.pos++;
    }
  }

  private current_position(): Position {
    return { line: this.line, column: this.column, offset: this.pos };
  }

  private make_token(kind: TokenKind, value: string, start: Position, end?: Position): Token {
    return {
      kind,
      value,
      span: { file: this.file, start, end: end ?? this.current_position() },
    };
  }

  private is_digit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  }

  private is_ident_start(ch: string): boolean {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
  }

  private is_ident_continue(ch: string): boolean {
    return this.is_ident_start(ch) || this.is_digit(ch);
  }
}
