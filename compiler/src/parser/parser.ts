// Ring-lang Parser — recursive descent + Pratt parsing for expressions
import {
  Program, Decl, FnDecl, StructDecl, EnumDecl, ImplDecl, EffectDecl, TestDecl, TraitDecl, ExternFnDecl, ExternTypeDecl,
  UseDecl, UsePath, UseImport,
  Stmt, LetStmt, VarStmt, AssignStmt, ExprStmt, ReturnStmt, WhileStmt, BreakStmt, ContinueStmt,
  ForInStmt, LetDestructureStmt, IfLetStmt,
  Expr, IntLitExpr, FloatLitExpr, StrLitExpr, BoolLitExpr, IdentExpr,
  BinOpExpr, UnaryOpExpr, CallExpr, MethodCallExpr, FieldAccessExpr,
  StructLitExpr, MatchExpr, BlockExpr, IfExpr, StringInterpExpr,
  OrExpr, CatchExpr, HandleExpr, LambdaExpr, OptionUnwrapExpr, TryBlockExpr, RangeExpr, ListLitExpr, TupleLitExpr,
  BinOp, UnaryOp,
  TypeExpr, NamedTypeExpr, FnTypeExpr, OptionTypeExpr, RecordTypeExpr, RecordTypeField, TupleTypeExpr,
  Pattern, WildcardPattern, BindingPattern, ConstructorPattern, LiteralPattern, TuplePattern,
  MatchArm, EffectHandler, Param, TypeParam, TypeBound,
  StructField, EnumVariant, EffectOp, StructFieldInit,
  Span, Position,
} from "../ast/index.js";
import { Token, TokenKind, Lexer } from "./lexer.js";
import { DiagnosticSink, CollectingSink, make_diagnostic } from "../diagnostics/index.js";
import { E } from "../diagnostics/codes.js";
import { CompileError } from "../errors.js";

// ============================================================
// Operator Precedence (lower number = lower precedence = binds less tightly)
// ============================================================

const enum Prec {
  None = 0,
  Or = 1,         // or
  Catch = 2,      // catch
  LogicOr = 3,    // ||
  LogicAnd = 4,   // &&
  Equality = 5,   // == !=
  Compare = 6,    // < > <= >=
  Range = 7,      // ..
  AddSub = 8,     // + -
  MulDiv = 9,     // * / %
  Unary = 10,     // - !
  Postfix = 11,   // . () []
}

function infix_precedence(kind: TokenKind): Prec {
  switch (kind) {
    case TokenKind.Or: return Prec.Or;
    case TokenKind.Catch: return Prec.Catch;
    case TokenKind.PipePipe: return Prec.LogicOr;
    case TokenKind.AmpAmp: return Prec.LogicAnd;
    case TokenKind.EqEq:
    case TokenKind.BangEq: return Prec.Equality;
    case TokenKind.Lt:
    case TokenKind.Gt:
    case TokenKind.LtEq:
    case TokenKind.GtEq: return Prec.Compare;
    case TokenKind.DotDot:
    case TokenKind.DotDotEq: return Prec.Range;
    case TokenKind.Plus:
    case TokenKind.Minus: return Prec.AddSub;
    case TokenKind.Star:
    case TokenKind.Slash:
    case TokenKind.Percent: return Prec.MulDiv;
    case TokenKind.Dot:
    case TokenKind.LParen:
    case TokenKind.Question: return Prec.Postfix;
    default: return Prec.None;
  }
}

// ============================================================
// Parser
// ============================================================

export class Parser {
  private tokens: Token[];
  private pos: number = 0;
  private file: string;
  private sink: DiagnosticSink;
  private error_count: number = 0;
  private static MAX_ERRORS = 20;

  constructor(tokens: Token[], file: string = "<stdin>", sink?: DiagnosticSink) {
    this.tokens = tokens;
    this.file = file;
    this.sink = sink ?? new CollectingSink();
  }

  static parse(source: string, file: string = "<stdin>", sink?: DiagnosticSink): Program {
    const shared_sink = sink ?? new CollectingSink();
    const lexer = new Lexer(source, file, shared_sink);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, file, shared_sink);
    return parser.parse_program();
  }

  // ============================================================
  // Program
  // ============================================================

  parse_program(): Program {
    const start = this.current_span_start();
    const uses: UseDecl[] = [];
    const decls: Decl[] = [];
    let decls_started = false;

    while (!this.at_end()) {
      if (this.peek().kind === TokenKind.Error) { this.advance(); continue; }

      // Check for `use` or `pub use` before regular declarations
      if (this.check(TokenKind.Use)) {
        if (decls_started) {
          this.report_error(E.E0706, "Use declaration must appear before other declarations", this.peek().span);
        }
        try {
          uses.push(this.parse_use_decl(false));
        } catch (e) {
          if (e instanceof CompileError) throw e;
          this.synchronize();
        }
        continue;
      }

      if (this.check(TokenKind.Pub)) {
        // Speculatively check if this is `pub use`
        const save_pos = this.pos;
        const save_errors = this.error_count;
        const sink_checkpoint = this.sink.save?.();
        this.advance(); // consume `pub`
        if (this.check(TokenKind.Use)) {
          if (decls_started) {
            this.report_error(E.E0706, "Use declaration must appear before other declarations", this.tokens[save_pos].span);
          }
          try {
            uses.push(this.parse_use_decl(true));
          } catch (e) {
            if (e instanceof CompileError) throw e;
            this.synchronize();
          }
          continue;
        }
        // Not `pub use` — restore and fall through to regular decl parsing
        this.pos = save_pos;
        this.error_count = save_errors;
        if (sink_checkpoint !== undefined) this.sink.restore?.(sink_checkpoint);
      }

      // Regular declaration
      decls_started = true;
      try {
        decls.push(this.parse_decl());
      } catch (e) {
        if (e instanceof CompileError) throw e;
        // Recover: synchronize to next declaration boundary
        this.synchronize();
      }
    }
    if (this.sink.has_errors()) {
      throw new CompileError([...this.sink.diagnostics()]);
    }
    const end = this.current_span_start();
    return { uses, decls, span: this.make_span(start, end) };
  }

  // ============================================================
  // Use declarations
  // ============================================================

  private parse_use_decl(is_pub: boolean): UseDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Use);

    // Parse path segments: Ident (:: Ident)*
    // Stop before :: if next is LBrace (grouped import)
    const segments: string[] = [];
    const path_start = this.current_span_start();
    segments.push(this.expect(TokenKind.Ident).value);

    while (this.check(TokenKind.ColonColon)) {
      // Peek past :: to see what follows
      this.advance(); // consume ::

      if (this.check(TokenKind.LBrace)) {
        // `use path::{...}` — stop, parse grouped imports
        break;
      }

      // Must be another Ident path segment
      segments.push(this.expect(TokenKind.Ident).value);
    }

    const path_end = this.current_span_start();
    let path: UsePath;
    let imports: UseImport;
    let alias: string | undefined;

    if (this.check(TokenKind.LBrace)) {
      // Grouped import: `use path::{name [as alias], ...}`
      path = { segments, span: this.make_span(path_start, path_end) };
      this.advance(); // consume {
      const names: { name: string; alias?: string; span: Span }[] = [];
      while (!this.check(TokenKind.RBrace) && !this.at_end()) {
        const name_start = this.current_span_start();
        const name = this.expect(TokenKind.Ident).value;
        let name_alias: string | undefined;
        if (this.try_consume(TokenKind.As)) {
          name_alias = this.expect(TokenKind.Ident).value;
        }
        const name_end = this.current_span_start();
        names.push({ name, alias: name_alias, span: this.make_span(name_start, name_end) });
        if (!this.try_consume(TokenKind.Comma)) break;
      }
      this.expect(TokenKind.RBrace);
      imports = { kind: "named", names };
    } else if (this.check(TokenKind.As)) {
      // Module alias: `use path as alias`
      path = { segments, span: this.make_span(path_start, path_end) };
      this.advance(); // consume `as`
      alias = this.expect(TokenKind.Ident).value;
      imports = { kind: "module" };
    } else if (segments.length > 1) {
      // Multi-segment path: last segment is the imported name, rest is module path
      // e.g. `use checker::env::TypeEnv` → path=["checker","env"], name="TypeEnv"
      const name = segments.pop()!;
      path = { segments, span: this.make_span(path_start, path_end) };
      const name_span = this.make_span(path_start, path_end); // approximate
      imports = { kind: "named", names: [{ name, span: name_span }] };
    } else {
      // Single segment, no :: — whole module import: `use parser`
      path = { segments, span: this.make_span(path_start, path_end) };
      imports = { kind: "module" };
    }

    const end = this.current_span_start();
    return {
      kind: "use_decl",
      path,
      imports,
      alias,
      is_pub,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // Declarations
  // ============================================================

  private parse_decl(): Decl {
    const is_pub = this.try_consume(TokenKind.Pub);
    const tok = this.peek();

    switch (tok.kind) {
      case TokenKind.Fn: return this.parse_fn_decl(is_pub);
      case TokenKind.Struct: return this.parse_struct_decl(is_pub);
      case TokenKind.Enum: return this.parse_enum_decl(is_pub);
      case TokenKind.Impl: return this.parse_impl_decl();
      case TokenKind.Effect: return this.parse_effect_decl(is_pub);
      case TokenKind.Test: return this.parse_test_decl();
      case TokenKind.Trait: return this.parse_trait_decl(is_pub);
      case TokenKind.Extern: return this.parse_extern_decl(is_pub);
      default:
        this.report_error(E.E0101, `Expected declaration, got '${tok.value}' (${tok.kind})`, tok.span);
        throw new Error("parse_decl_failed");
    }
  }

  private parse_fn_decl(is_pub: boolean, body_optional: boolean = false): FnDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Fn);
    const name = this.expect(TokenKind.Ident).value;
    const type_params = this.parse_type_params();
    this.expect(TokenKind.LParen);
    const params = this.parse_params();
    this.expect(TokenKind.RParen);
    const return_type = this.try_consume(TokenKind.Arrow) ? this.parse_type_expr() : undefined;
    let body: BlockExpr;
    let is_abstract: boolean | undefined;
    if (body_optional && !this.check(TokenKind.LBrace)) {
      // Abstract method: no body
      const pos = this.current_span_start();
      body = { kind: "block", stmts: [], tail: undefined, span: this.make_span(pos, pos) };
      is_abstract = true;
    } else {
      body = this.parse_block_expr();
    }
    const end = this.current_span_start();
    return {
      kind: "fn_decl", name, type_params, params, return_type, body, is_pub, is_abstract,
      span: this.make_span(start, end),
    };
  }

  private parse_extern_decl(is_pub: boolean): ExternFnDecl | ExternTypeDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Extern);
    if (this.check(TokenKind.Ident) && this.peek().value === "type") {
      return this.parse_extern_type_decl_body(is_pub, start);
    }
    return this.parse_extern_fn_decl_body(is_pub, start);
  }

  private parse_extern_fn_decl_body(is_pub: boolean, start: Position): ExternFnDecl {
    this.expect(TokenKind.Fn);
    const name = this.expect(TokenKind.Ident).value;
    const type_params = this.parse_type_params();
    this.expect(TokenKind.LParen);
    const params = this.parse_params();
    this.expect(TokenKind.RParen);
    const return_type = this.try_consume(TokenKind.Arrow) ? this.parse_type_expr() : undefined;
    const end = this.current_span_start();
    return {
      kind: "extern_fn_decl", name, type_params, params, return_type, is_pub,
      span: this.make_span(start, end),
    };
  }

  private parse_extern_type_decl_body(is_pub: boolean, start: Position): ExternTypeDecl {
    this.advance(); // consume "type" ident
    const name = this.expect(TokenKind.Ident).value;
    const type_params = this.parse_type_params();
    const end = this.current_span_start();
    return {
      kind: "extern_type_decl", name, type_params, is_pub,
      span: this.make_span(start, end),
    };
  }

  private parse_struct_decl(is_pub: boolean): StructDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Struct);
    const name = this.expect(TokenKind.Ident).value;
    const type_params = this.parse_type_params();
    this.expect(TokenKind.LBrace);
    const fields: StructField[] = [];
    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      const field_start = this.current_span_start();
      const field_pub = this.try_consume(TokenKind.Pub);
      const field_name = this.expect(TokenKind.Ident).value;
      this.expect(TokenKind.Colon);
      const type_annotation = this.parse_type_expr();
      // Check for where clause on this field (refinement)
      if (this.check(TokenKind.Where)) {
        const where_span = this.peek().span;
        this.sink.report(make_diagnostic("W0001", "warning",
          "Refinement types are not yet implemented; 'where' clause is ignored",
          where_span, { kind: "other", detail: "where clause parsed but not enforced" }));
        this.advance(); // consume 'where'
        // Consume tokens until comma or closing brace (simplified: stop at , or })
        let depth = 0;
        while (!this.at_end()) {
          if (depth === 0 && (this.check(TokenKind.Comma) || this.check(TokenKind.RBrace))) break;
          if (this.check(TokenKind.LParen) || this.check(TokenKind.LBrace) || this.check(TokenKind.LBracket)) depth++;
          if (this.check(TokenKind.RParen) || this.check(TokenKind.RBrace) || this.check(TokenKind.RBracket)) depth--;
          if (depth < 0) break;
          this.advance();
        }
      }
      const field_end = this.current_span_start();
      fields.push({
        name: field_name, type_annotation, is_pub: field_pub,
        span: this.make_span(field_start, field_end),
      });
      this.try_consume(TokenKind.Comma);
    }
    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "struct_decl", name, type_params, fields, is_pub,
      span: this.make_span(start, end),
    };
  }

  private parse_enum_decl(is_pub: boolean): EnumDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Enum);
    const name = this.expect(TokenKind.Ident).value;
    const type_params = this.parse_type_params();
    this.expect(TokenKind.LBrace);
    const variants: EnumVariant[] = [];
    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      const v_start = this.current_span_start();
      const v_name = this.expect(TokenKind.Ident).value;
      let fields: TypeExpr[] = [];
      if (this.try_consume(TokenKind.LParen)) {
        if (!this.check(TokenKind.RParen)) {
          fields.push(this.parse_type_expr());
          while (this.try_consume(TokenKind.Comma)) {
            if (this.check(TokenKind.RParen)) break;
            fields.push(this.parse_type_expr());
          }
        }
        this.expect(TokenKind.RParen);
      }
      const v_end = this.current_span_start();
      variants.push({ name: v_name, fields, span: this.make_span(v_start, v_end) });
      this.try_consume(TokenKind.Comma);
    }
    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "enum_decl", name, type_params, variants, is_pub,
      span: this.make_span(start, end),
    };
  }

  private parse_impl_decl(): ImplDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Impl);
    const type_params = this.parse_type_params();
    const first_name = this.expect(TokenKind.Ident).value;

    // Check for trait impl: impl Trait for Type
    let target_type: string;
    let trait_name: string | undefined;
    if (this.check(TokenKind.For)) {
      this.advance(); // consume 'for'
      trait_name = first_name;
      target_type = this.expect(TokenKind.Ident).value;
    } else {
      target_type = first_name;
    }

    this.expect(TokenKind.LBrace);
    const methods: (FnDecl | ExternFnDecl)[] = [];
    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      const m_pub = this.try_consume(TokenKind.Pub);
      if (this.check(TokenKind.Extern)) {
        const m_start = this.current_span_start();
        this.expect(TokenKind.Extern);
        methods.push(this.parse_extern_fn_decl_body(m_pub, m_start));
      } else {
        methods.push(this.parse_fn_decl(m_pub));
      }
    }
    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "impl_decl", target_type, type_params, trait_name, methods,
      span: this.make_span(start, end),
    };
  }

  private parse_effect_decl(is_pub: boolean): EffectDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Effect);
    const name = this.expect(TokenKind.Ident).value;
    const type_params = this.parse_type_params();
    this.expect(TokenKind.LBrace);
    const ops: EffectOp[] = [];
    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      const op_start = this.current_span_start();
      this.expect(TokenKind.Fn);
      const op_name = this.expect(TokenKind.Ident).value;
      this.expect(TokenKind.LParen);
      const params = this.parse_params();
      this.expect(TokenKind.RParen);
      this.expect(TokenKind.Arrow);
      const return_type = this.parse_type_expr();
      const op_end = this.current_span_start();
      ops.push({ name: op_name, params, return_type, span: this.make_span(op_start, op_end) });
      this.try_consume(TokenKind.Comma);
      this.try_consume(TokenKind.Semi);
    }
    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "effect_decl", name, type_params, ops, is_pub,
      span: this.make_span(start, end),
    };
  }

  private parse_test_decl(): TestDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Test);
    const desc_tok = this.expect(TokenKind.StringLit);
    const description = desc_tok.value;
    const body = this.parse_block_expr();
    const end = this.current_span_start();
    return {
      kind: "test_decl", description, body,
      span: this.make_span(start, end),
    };
  }

  private parse_trait_decl(is_pub: boolean): TraitDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Trait);
    const name = this.expect(TokenKind.Ident).value;
    const type_params = this.parse_type_params();
    const supertraits: TypeBound[] = [];
    this.expect(TokenKind.LBrace);
    const methods: FnDecl[] = [];
    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      const m_pub = this.try_consume(TokenKind.Pub);
      methods.push(this.parse_fn_decl(m_pub, true));
    }
    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "trait_decl", name, type_params, supertraits, methods, is_pub,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // Type Expressions
  // ============================================================

  private try_parse_type_args(): TypeExpr[] {
    if (!this.check(TokenKind.Lt)) return [];
    const save_pos = this.pos;
    const save_errors = this.error_count;
    const sink_checkpoint = this.sink.save?.();
    this.advance();
    try {
      const args: TypeExpr[] = [];
      args.push(this.parse_type_expr());
      while (this.try_consume(TokenKind.Comma)) {
        args.push(this.parse_type_expr());
      }
      if (!this.check(TokenKind.Gt)) {
        this.pos = save_pos;
        this.error_count = save_errors;
        if (sink_checkpoint !== undefined) this.sink.restore?.(sink_checkpoint);
        return [];
      }
      this.advance();
      return args;
    } catch {
      this.pos = save_pos;
      this.error_count = save_errors;
      if (sink_checkpoint !== undefined) this.sink.restore?.(sink_checkpoint);
      return [];
    }
  }

  private parse_type_expr(): TypeExpr {
    const start = this.current_span_start();

    // Record type: {field: Type, ..rest}
    if (this.check(TokenKind.LBrace)) {
      return this.parse_record_type_expr();
    }

    // fn(...) -> ReturnType
    if (this.check(TokenKind.Fn)) {
      this.advance();
      this.expect(TokenKind.LParen);
      const params: TypeExpr[] = [];
      if (!this.check(TokenKind.RParen)) {
        params.push(this.parse_type_expr());
        while (this.try_consume(TokenKind.Comma)) {
          if (this.check(TokenKind.RParen)) break;
          params.push(this.parse_type_expr());
        }
      }
      this.expect(TokenKind.RParen);
      this.expect(TokenKind.Arrow);
      const return_type = this.parse_type_expr();
      const end = this.current_span_start();
      const result: FnTypeExpr = {
        kind: "fn_type", params, return_type,
        span: this.make_span(start, end),
      };
      return result;
    }

    // Tuple type: (Type, Type, ...)
    if (this.check(TokenKind.LParen)) {
      this.advance();
      const first = this.parse_type_expr();
      if (this.check(TokenKind.Comma)) {
        this.advance();
        const elements: TypeExpr[] = [first];
        if (!this.check(TokenKind.RParen)) {
          elements.push(this.parse_type_expr());
          while (this.check(TokenKind.Comma)) {
            this.advance();
            if (this.check(TokenKind.RParen)) break;
            elements.push(this.parse_type_expr());
          }
        }
        const end_tok = this.expect(TokenKind.RParen);
        return {
          kind: "tuple_type",
          elements,
          span: this.make_span(start, end_tok.span.end),
        } as TupleTypeExpr;
      }
      this.expect(TokenKind.RParen);
      return first;
    }

    // Named type
    const name = this.expect(TokenKind.Ident).value;
    const type_args = this.try_parse_type_args();

    const end = this.current_span_start();
    let result: TypeExpr = {
      kind: "named", name, type_args,
      span: this.make_span(start, end),
    } as NamedTypeExpr;

    // Check for ? (Option type)
    if (this.try_consume(TokenKind.Question)) {
      const opt_end = this.current_span_start();
      result = {
        kind: "option", inner: result,
        span: this.make_span(start, opt_end),
      } as OptionTypeExpr;
    }

    return result;
  }

  private parse_record_type_expr(): RecordTypeExpr {
    const start = this.current_span_start();
    this.expect(TokenKind.LBrace);
    const fields: RecordTypeField[] = [];
    let rest: string | undefined;

    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      if (this.check(TokenKind.DotDot)) {
        this.advance();
        rest = this.expect(TokenKind.Ident).value;
        this.try_consume(TokenKind.Comma);
        break;
      }

      const field_start = this.current_span_start();
      const field_name = this.expect(TokenKind.Ident).value;
      this.expect(TokenKind.Colon);
      const field_type = this.parse_type_expr();
      const field_end = this.current_span_start();
      fields.push({ name: field_name, type: field_type, span: this.make_span(field_start, field_end) });

      if (!this.try_consume(TokenKind.Comma)) break;
    }

    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "record_type",
      fields,
      rest,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // Type Params: <T, U: Constraint>
  // ============================================================

  private parse_type_params(): TypeParam[] {
    if (!this.check(TokenKind.Lt)) return [];
    this.advance(); // consume <
    const params: TypeParam[] = [];
    while (!this.check(TokenKind.Gt) && !this.at_end()) {
      const tp_start = this.current_span_start();
      const name = this.expect(TokenKind.Ident).value;
      const bounds: TypeBound[] = [];
      if (this.try_consume(TokenKind.Colon)) {
        bounds.push(this.parse_type_bound());
        while (this.check(TokenKind.Plus)) {
          this.advance();
          bounds.push(this.parse_type_bound());
        }
      }
      const tp_end = this.current_span_start();
      params.push({ name, bounds, span: this.make_span(tp_start, tp_end) });
      this.try_consume(TokenKind.Comma);
    }
    this.expect(TokenKind.Gt);
    return params;
  }

  private parse_type_bound(): TypeBound {
    const start = this.current_span_start();
    const trait_name = this.expect(TokenKind.Ident).value;
    const type_args = this.try_parse_type_args();
    const end = this.current_span_start();
    return { trait_name, type_args, span: this.make_span(start, end) };
  }

  // ============================================================
  // Parameters
  // ============================================================

  private parse_params(): Param[] {
    const params: Param[] = [];
    if (this.check(TokenKind.RParen)) return params;
    params.push(this.parse_param());
    while (this.try_consume(TokenKind.Comma)) {
      if (this.check(TokenKind.RParen)) break;
      params.push(this.parse_param());
    }
    return params;
  }

  private parse_param(): Param {
    const start = this.current_span_start();
    const name = this.expect(TokenKind.Ident).value;
    let type_annotation: TypeExpr | undefined;
    if (this.try_consume(TokenKind.Colon)) {
      type_annotation = this.parse_type_expr();
    }
    const end = this.current_span_start();
    return { name, type_annotation, span: this.make_span(start, end) };
  }

  // ============================================================
  // Statements
  // ============================================================

  private parse_stmt(): Stmt {
    const start = this.current_span_start();

    if (this.check(TokenKind.Let)) {
      // Look ahead: if next token after `let` is `(`, it's a destructuring statement
      const saved_pos = this.pos;
      this.advance(); // consume `let`
      if (this.check(TokenKind.LParen)) {
        const pattern = this.parse_pattern() as TuplePattern;
        this.expect(TokenKind.Eq);
        const init = this.parse_expr();
        this.try_consume(TokenKind.Semi);
        const end = this.current_span_start();
        return {
          kind: "let_destructure",
          pattern,
          init,
          span: this.make_span(start, end),
        } as LetDestructureStmt;
      }
      // Not a destructuring — backtrack and parse normally
      this.pos = saved_pos;
      return this.parse_binding_stmt(false);
    }
    if (this.check(TokenKind.Var)) {
      return this.parse_binding_stmt(true);
    }
    if (this.check(TokenKind.Return)) {
      return this.parse_return_stmt();
    }
    if (this.check(TokenKind.If)) {
      // Look ahead: if next token after `if` is `let`, parse as IfLetStmt
      const saved_pos = this.pos;
      this.advance(); // consume `if`
      if (this.check(TokenKind.Let)) {
        return this.parse_if_let_stmt(start);
      }
      // Not if-let — backtrack and fall through to expression statement
      this.pos = saved_pos;
    }
    if (this.check(TokenKind.While)) {
      return this.parse_while_stmt();
    }
    if (this.check(TokenKind.For)) {
      return this.parse_for_in_stmt();
    }
    if (this.check(TokenKind.Break)) {
      return this.parse_break_stmt();
    }
    if (this.check(TokenKind.Continue)) {
      return this.parse_continue_stmt();
    }

    // Expression statement (may turn into assignment)
    const expr = this.parse_expr();

    // Check for assignment: target = value or target += value or target -= value
    if (this.check(TokenKind.Eq) || this.check(TokenKind.PlusEq) || this.check(TokenKind.MinusEq)) {
      const op_tok = this.advance();
      const value_expr = this.parse_expr();
      this.try_consume(TokenKind.Semi);
      const end = this.current_span_start();

      let value: Expr = value_expr;
      // Desugar += and -=
      if (op_tok.kind === TokenKind.PlusEq) {
        value = { kind: "bin_op", op: "+", left: expr, right: value_expr, span: value_expr.span };
      } else if (op_tok.kind === TokenKind.MinusEq) {
        value = { kind: "bin_op", op: "-", left: expr, right: value_expr, span: value_expr.span };
      }

      return {
        kind: "assign_stmt", target: expr, value,
        span: this.make_span(start, end),
      } as AssignStmt;
    }

    const has_semi = this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    return {
      kind: "expr_stmt", expr, has_semi,
      span: this.make_span(start, end),
    } as ExprStmt;
  }

  private parse_while_stmt(): WhileStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.While);
    const condition = this.parse_expr();
    const body = this.parse_block_expr();
    const end = this.current_span_start();
    return {
      kind: "while_stmt",
      condition,
      body,
      span: this.make_span(start, end),
    };
  }

  private parse_for_in_stmt(): ForInStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.For);
    const name_tok = this.expect(TokenKind.Ident);
    const binding = name_tok.value;
    const binding_span = name_tok.span;
    this.expect(TokenKind.In);
    const iterable = this.parse_expr();
    const body = this.parse_block_expr();
    const end = this.current_span_start();
    return {
      kind: "for_in_stmt",
      binding,
      binding_span,
      iterable,
      body,
      span: this.make_span(start, end),
    };
  }

  private parse_break_stmt(): BreakStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.Break);
    this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    return { kind: "break_stmt", span: this.make_span(start, end) };
  }

  private parse_continue_stmt(): ContinueStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.Continue);
    this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    return { kind: "continue_stmt", span: this.make_span(start, end) };
  }

  // parse_if_let_stmt is called AFTER `if` has already been consumed.
  // start is the span start of the `if` token.
  private parse_if_let_stmt(start: Position): IfLetStmt {
    this.expect(TokenKind.Let); // consume `let`
    const pattern = this.parse_pattern();
    this.expect(TokenKind.Eq);
    const expr = this.parse_expr();
    const then_block = this.parse_block_expr();
    let else_block: BlockExpr | null = null;
    if (this.try_consume(TokenKind.Else)) {
      else_block = this.parse_block_expr();
    }
    const end = (else_block ?? then_block).span.end;
    return {
      kind: "if_let",
      pattern,
      expr,
      then_block,
      else_block,
      span: this.make_span(start, end),
    } as IfLetStmt;
  }

  private parse_binding_stmt(mutable: boolean): LetStmt | VarStmt {
    const start = this.current_span_start();
    this.expect(mutable ? TokenKind.Var : TokenKind.Let);
    const name_tok = this.expect(TokenKind.Ident);
    const name = name_tok.value;
    const name_span = name_tok.span;
    let type_annotation: TypeExpr | undefined;
    if (this.try_consume(TokenKind.Colon)) {
      type_annotation = this.parse_type_expr();
    }
    this.expect(TokenKind.Eq);
    const init = this.parse_expr();
    this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    const span = this.make_span(start, end);
    return mutable
      ? { kind: "var_stmt", name, name_span, type_annotation, init, span } as VarStmt
      : { kind: "let_stmt", name, name_span, type_annotation, init, span } as LetStmt;
  }

  private parse_return_stmt(): ReturnStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.Return);
    let value: Expr | undefined;
    if (!this.check(TokenKind.Semi) && !this.check(TokenKind.RBrace) && !this.at_end()) {
      value = this.parse_expr();
    }
    this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    return {
      kind: "return_stmt", value,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // Expressions — Pratt Parsing
  // ============================================================

  private parse_expr(): Expr {
    return this.parse_expr_bp(Prec.None);
  }

  private parse_expr_bp(min_prec: Prec): Expr {
    let left = this.parse_prefix();
    let last_was_comparison = false;

    while (true) {
      const tok = this.peek();
      const prec = infix_precedence(tok.kind);
      if (prec <= min_prec) break;

      if (tok.kind === TokenKind.Or) {
        left = this.parse_or_expr(left);
        last_was_comparison = false;
      } else if (tok.kind === TokenKind.Catch) {
        left = this.parse_catch_expr(left);
        last_was_comparison = false;
      } else if (tok.kind === TokenKind.Dot) {
        left = this.parse_dot_expr(left);
        last_was_comparison = false;
      } else if (tok.kind === TokenKind.LParen) {
        // Only treat '(' as a function call if it's on the same line as the
        // preceding expression.  A '(' on a new line starts a parenthesised
        // expression, not an argument list.  This prevents `let x = 42\n("y",1)`
        // from being parsed as the call `42("y", 1)`.
        if (tok.span.start.line > left.span.end.line) break;
        left = this.parse_call_expr(left);
        last_was_comparison = false;
      } else if (tok.kind === TokenKind.Question) {
        const q_tok = this.advance();
        left = { kind: "option_unwrap", expr: left, span: this.make_span(left.span.start, q_tok.span.end) } as OptionUnwrapExpr;
        last_was_comparison = false;
      } else if (tok.kind === TokenKind.DotDot || tok.kind === TokenKind.DotDotEq) {
        const inclusive = tok.kind === TokenKind.DotDotEq;
        this.advance();
        const right = this.parse_expr_bp(prec);
        const span = this.make_span(left.span.start, right.span.end);
        left = { kind: "range", start: left, end: right, inclusive, span } as RangeExpr;
        last_was_comparison = false;
      } else {
        const is_comparison = prec === Prec.Equality || prec === Prec.Compare;
        if (is_comparison && last_was_comparison) {
          throw this.error(`Comparison operators are non-associative: cannot chain '${tok.value}' after another comparison`);
        }
        // Binary operators
        this.advance();
        const right = this.parse_expr_bp(prec);
        const span = this.make_span(left.span.start, right.span.end);
        left = {
          kind: "bin_op", op: tok.value as BinOp, left, right, span,
        } as BinOpExpr;
        last_was_comparison = is_comparison;
      }
    }

    return left;
  }

  private parse_prefix(): Expr {
    const tok = this.peek();
    const start = this.current_span_start();

    // Unary operators
    if (tok.kind === TokenKind.Minus || tok.kind === TokenKind.Bang) {
      this.advance();
      const operand = this.parse_expr_bp(Prec.Unary);
      const end = this.current_span_start();
      return {
        kind: "unary_op", op: tok.value as UnaryOp, operand,
        span: this.make_span(start, end),
      } as UnaryOpExpr;
    }

    // Literals
    if (tok.kind === TokenKind.IntLit) {
      this.advance();
      return { kind: "int_lit", value: parseInt(tok.value, 10), span: tok.span } as IntLitExpr;
    }
    if (tok.kind === TokenKind.FloatLit) {
      this.advance();
      return { kind: "float_lit", value: parseFloat(tok.value), span: tok.span } as FloatLitExpr;
    }
    if (tok.kind === TokenKind.StringLit) {
      this.advance();
      return { kind: "str_lit", value: tok.value, span: tok.span } as StrLitExpr;
    }
    if (tok.kind === TokenKind.RawStringLit) {
      this.advance();
      return { kind: "str_lit", value: tok.value, span: tok.span } as StrLitExpr;
    }
    if (tok.kind === TokenKind.True) {
      this.advance();
      return { kind: "bool_lit", value: true, span: tok.span } as BoolLitExpr;
    }
    if (tok.kind === TokenKind.False) {
      this.advance();
      return { kind: "bool_lit", value: false, span: tok.span } as BoolLitExpr;
    }

    // String interpolation
    if (tok.kind === TokenKind.StringInterpStart) {
      return this.parse_string_interp();
    }

    // Block expression
    if (tok.kind === TokenKind.LBrace) {
      return this.parse_block_expr();
    }

    // If expression
    if (tok.kind === TokenKind.If) {
      return this.parse_if_expr();
    }

    // Match expression
    if (tok.kind === TokenKind.Match) {
      return this.parse_match_expr();
    }

    // Handle expression
    if (tok.kind === TokenKind.Handle) {
      return this.parse_handle_expr();
    }

    // Try block: try { body }
    if (tok.kind === TokenKind.Try) {
      this.advance();
      const body = this.parse_block_expr();
      return { kind: "try_block", body, span: this.make_span(start, body.span.end) } as TryBlockExpr;
    }

    // Lambda: fn(params) -> Type { body }
    if (tok.kind === TokenKind.Fn) {
      return this.parse_lambda_expr();
    }

    // List literal: [expr, expr, ...]
    if (tok.kind === TokenKind.LBracket) {
      this.advance();
      const elements: Expr[] = [];
      if (!this.check(TokenKind.RBracket)) {
        elements.push(this.parse_expr());
        while (this.check(TokenKind.Comma)) {
          this.advance();
          if (this.check(TokenKind.RBracket)) break; // trailing comma
          elements.push(this.parse_expr());
        }
      }
      const end_tok = this.expect(TokenKind.RBracket);
      return {
        kind: "list_lit",
        elements,
        span: this.make_span(start, end_tok.span.end),
      } as ListLitExpr;
    }

    // Parenthesized expression or tuple literal
    if (tok.kind === TokenKind.LParen) {
      this.advance();
      const first = this.parse_expr();
      if (this.check(TokenKind.Comma)) {
        this.advance();
        const elements: Expr[] = [first];
        if (!this.check(TokenKind.RParen)) {
          elements.push(this.parse_expr());
          while (this.check(TokenKind.Comma)) {
            this.advance();
            if (this.check(TokenKind.RParen)) break;
            elements.push(this.parse_expr());
          }
        }
        const end_tok = this.expect(TokenKind.RParen);
        return {
          kind: "tuple_lit",
          elements,
          span: this.make_span(start, end_tok.span.end),
        } as TupleLitExpr;
      }
      this.expect(TokenKind.RParen);
      return first;
    }

    // Identifier (may lead to struct literal)
    if (tok.kind === TokenKind.Ident) {
      this.advance();
      const name = tok.value;

      // Check for struct literal: Name { field: value }
      // Heuristic: starts with uppercase letter and followed by {
      if (this.is_uppercase(name[0]) && this.check(TokenKind.LBrace)) {
        return this.parse_struct_literal(name, start);
      }

      return { kind: "ident", name, span: tok.span } as IdentExpr;
    }

    throw this.error(`Unexpected token '${tok.value}' (${tok.kind}) in expression`);
  }

  // ============================================================
  // Postfix: dot (field access / method call)
  // ============================================================

  private parse_dot_expr(left: Expr): Expr {
    this.advance(); // consume '.'
    const name_tok = this.expect(TokenKind.Ident);
    const name = name_tok.value;

    // Check if it's a method call: expr.method(args)
    if (this.check(TokenKind.LParen)) {
      this.advance(); // consume '('
      const args = this.parse_arg_list();
      this.expect(TokenKind.RParen);
      const end = this.current_span_start();
      return {
        kind: "method_call", receiver: left, method: name, args, type_args: [],
        span: this.make_span(left.span.start, end),
      } as MethodCallExpr;
    }

    // Field access
    const end = this.current_span_start();
    return {
      kind: "field_access", receiver: left, field: name,
      span: this.make_span(left.span.start, end),
    } as FieldAccessExpr;
  }

  // ============================================================
  // Call expression: expr(args)
  // ============================================================

  private parse_call_expr(left: Expr): Expr {
    this.advance(); // consume '('
    const args = this.parse_arg_list();
    this.expect(TokenKind.RParen);
    const end = this.current_span_start();
    return {
      kind: "call", callee: left, args, type_args: [],
      span: this.make_span(left.span.start, end),
    } as CallExpr;
  }

  private parse_arg_list(): Expr[] {
    const args: Expr[] = [];
    if (this.check(TokenKind.RParen)) return args;
    args.push(this.parse_expr());
    while (this.try_consume(TokenKind.Comma)) {
      if (this.check(TokenKind.RParen)) break;
      args.push(this.parse_expr());
    }
    return args;
  }

  // ============================================================
  // Or expression: expr or default
  // ============================================================

  private parse_or_expr(left: Expr): OrExpr {
    this.advance(); // consume 'or'
    const default_value = this.parse_expr_bp(Prec.Or);
    const span = this.make_span(left.span.start, default_value.span.end);
    return { kind: "or_expr", expr: left, default_value, span };
  }

  // ============================================================
  // Catch expression: expr catch fn(e) { handler }
  // ============================================================

  private parse_catch_expr(left: Expr): CatchExpr {
    this.advance(); // consume 'catch'
    let error_type: string | undefined;
    if (this.peek().kind === TokenKind.Ident &&
        this.pos + 1 < this.tokens.length &&
        this.tokens[this.pos + 1].kind === TokenKind.Fn) {
      error_type = this.advance().value;
    }
    this.expect(TokenKind.Fn);
    this.expect(TokenKind.LParen);
    const error_binding = this.expect(TokenKind.Ident).value;
    this.expect(TokenKind.RParen);
    const handler = this.parse_block_expr();
    const span = this.make_span(left.span.start, handler.span.end);
    return { kind: "catch_expr", expr: left, error_type, error_binding, handler, span };
  }

  // ============================================================
  // String interpolation
  // ============================================================

  private parse_string_interp(): StringInterpExpr {
    const start_tok = this.advance(); // consume StringInterpStart
    const parts: (string | Expr)[] = [];

    if (start_tok.value.length > 0) {
      parts.push(start_tok.value);
    }

    // Parse expression inside ${}
    parts.push(this.parse_expr());

    // Continue with middle/end tokens
    while (true) {
      const tok = this.peek();
      if (tok.kind === TokenKind.StringInterpMiddle) {
        this.advance();
        if (tok.value.length > 0) {
          parts.push(tok.value);
        }
        parts.push(this.parse_expr());
      } else if (tok.kind === TokenKind.StringInterpEnd) {
        this.advance();
        if (tok.value.length > 0) {
          parts.push(tok.value);
        }
        break;
      } else {
        // Unexpected - treat as end
        break;
      }
    }

    const end = this.current_span_start();
    return {
      kind: "string_interp", parts,
      span: this.make_span(start_tok.span.start, end),
    };
  }

  // ============================================================
  // Block expression
  // ============================================================

  private parse_block_expr(): BlockExpr {
    const start = this.current_span_start();
    this.expect(TokenKind.LBrace);
    const stmts: Stmt[] = [];
    let tail: Expr | undefined;

    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      const stmt = this.parse_stmt();

      if (this.check(TokenKind.RBrace)) {
        if (stmt.kind === "expr_stmt" && !(stmt as ExprStmt).has_semi) {
          tail = (stmt as ExprStmt).expr;
        } else {
          stmts.push(stmt);
        }
      } else {
        stmts.push(stmt);
      }
    }

    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "block", stmts, tail,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // If expression
  // ============================================================

  private parse_if_expr(): IfExpr {
    const start = this.current_span_start();
    this.expect(TokenKind.If);
    const condition = this.parse_expr();
    const then_branch = this.parse_block_expr();
    let else_branch: BlockExpr | IfExpr | undefined;
    if (this.try_consume(TokenKind.Else)) {
      if (this.check(TokenKind.If)) {
        else_branch = this.parse_if_expr();
      } else {
        else_branch = this.parse_block_expr();
      }
    }
    const end = this.current_span_start();
    return {
      kind: "if_expr", condition, then_branch, else_branch,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // Match expression
  // ============================================================

  private parse_match_expr(): MatchExpr {
    const start = this.current_span_start();
    this.expect(TokenKind.Match);
    const scrutinee = this.parse_expr();
    this.expect(TokenKind.LBrace);
    const arms: MatchArm[] = [];
    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      arms.push(this.parse_match_arm());
      this.try_consume(TokenKind.Comma);
    }
    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "match_expr", scrutinee, arms,
      span: this.make_span(start, end),
    };
  }

  private parse_match_arm(): MatchArm {
    const start = this.current_span_start();
    const pattern = this.parse_pattern();
    let guard: Expr | undefined;
    if (this.check(TokenKind.If)) {
      this.advance();
      guard = this.parse_expr();
    }
    this.expect(TokenKind.FatArrow);
    const body = this.parse_expr();
    const end = this.current_span_start();
    return { pattern, guard, body, span: this.make_span(start, end) };
  }

  // ============================================================
  // Patterns
  // ============================================================

  private parse_pattern(): Pattern {
    const tok = this.peek();
    const start = this.current_span_start();

    // Wildcard
    if (tok.kind === TokenKind.Ident && tok.value === "_") {
      this.advance();
      return { kind: "wildcard", span: tok.span } as WildcardPattern;
    }

    // Literal patterns
    if (tok.kind === TokenKind.IntLit) {
      this.advance();
      return { kind: "literal", value: parseInt(tok.value, 10), span: tok.span } as LiteralPattern;
    }
    if (tok.kind === TokenKind.FloatLit) {
      this.advance();
      return { kind: "literal", value: parseFloat(tok.value), span: tok.span } as LiteralPattern;
    }
    if (tok.kind === TokenKind.StringLit) {
      this.advance();
      return { kind: "literal", value: tok.value, span: tok.span } as LiteralPattern;
    }
    if (tok.kind === TokenKind.True) {
      this.advance();
      return { kind: "literal", value: true, span: tok.span } as LiteralPattern;
    }
    if (tok.kind === TokenKind.False) {
      this.advance();
      return { kind: "literal", value: false, span: tok.span } as LiteralPattern;
    }

    // Constructor pattern or binding pattern
    if (tok.kind === TokenKind.Ident) {
      this.advance();
      const name = tok.value;

      // Constructor pattern: Name(pat, pat, ...)
      if (this.check(TokenKind.LParen)) {
        this.advance(); // consume '('
        const fields: Pattern[] = [];
        if (!this.check(TokenKind.RParen)) {
          fields.push(this.parse_pattern());
          while (this.try_consume(TokenKind.Comma)) {
            if (this.check(TokenKind.RParen)) break;
            fields.push(this.parse_pattern());
          }
        }
        this.expect(TokenKind.RParen);
        const end = this.current_span_start();
        return {
          kind: "constructor", name, fields,
          span: this.make_span(start, end),
        } as ConstructorPattern;
      }

      // Binding pattern
      return { kind: "binding", name, span: tok.span } as BindingPattern;
    }

    // Tuple pattern: (pat, pat, ...)
    if (tok.kind === TokenKind.LParen) {
      this.advance();
      const first = this.parse_pattern();
      if (!this.check(TokenKind.Comma)) {
        throw this.error("Expected ',' in tuple pattern — single-element tuple patterns not supported");
      }
      this.advance();
      const elements: Pattern[] = [first];
      if (!this.check(TokenKind.RParen)) {
        elements.push(this.parse_pattern());
        while (this.try_consume(TokenKind.Comma)) {
          if (this.check(TokenKind.RParen)) break;
          elements.push(this.parse_pattern());
        }
      }
      const end_tok = this.expect(TokenKind.RParen);
      return {
        kind: "tuple",
        elements,
        span: this.make_span(start, end_tok.span.end),
      } as TuplePattern;
    }

    throw this.error(`Unexpected token '${tok.value}' in pattern`);
  }

  // ============================================================
  // Handle expression
  // ============================================================

  private parse_handle_expr(): HandleExpr {
    const start = this.current_span_start();
    this.expect(TokenKind.Handle);
    const body = this.parse_block_expr();
    this.expect(TokenKind.With);
    this.expect(TokenKind.LBrace);
    const handlers: EffectHandler[] = [];
    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      handlers.push(this.parse_effect_handler());
      this.try_consume(TokenKind.Comma);
    }
    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "handle_expr", body, handlers,
      span: this.make_span(start, end),
    };
  }

  private parse_effect_handler(): EffectHandler {
    const start = this.current_span_start();
    // effect.op(params) => body
    const effect_name = this.expect(TokenKind.Ident).value;
    this.expect(TokenKind.Dot);
    const op_name = this.expect(TokenKind.Ident).value;
    this.expect(TokenKind.LParen);
    const params = this.parse_params();
    this.expect(TokenKind.RParen);
    // Optional resume name: not yet in syntax, could be added later
    this.expect(TokenKind.FatArrow);
    const body = this.parse_expr();
    const end = this.current_span_start();
    return {
      effect_name, op_name, params, body,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // Lambda expression
  // ============================================================

  private parse_lambda_expr(): LambdaExpr {
    const start = this.current_span_start();
    this.expect(TokenKind.Fn);
    this.expect(TokenKind.LParen);
    const params = this.parse_params();
    this.expect(TokenKind.RParen);
    const return_type = this.try_consume(TokenKind.Arrow) ? this.parse_type_expr() : undefined;
    const body = this.parse_block_expr() as Expr;
    const end = this.current_span_start();
    return {
      kind: "lambda", params, return_type, body,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // Struct literal
  // ============================================================

  private parse_struct_literal(name: string, start: Position): StructLitExpr {
    this.expect(TokenKind.LBrace);
    const fields: StructFieldInit[] = [];
    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      const f_start = this.current_span_start();
      const f_name = this.expect(TokenKind.Ident).value;
      this.expect(TokenKind.Colon);
      const f_value = this.parse_expr();
      const f_end = this.current_span_start();
      fields.push({ name: f_name, value: f_value, span: this.make_span(f_start, f_end) });
      this.try_consume(TokenKind.Comma);
    }
    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "struct_lit", name, type_args: [], fields,
      span: this.make_span(start, end),
    };
  }

  // ============================================================
  // Token helpers
  // ============================================================

  private peek(): Token {
    if (this.pos >= this.tokens.length) {
      const last = this.tokens[this.tokens.length - 1];
      return last; // should be EOF
    }
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  private check(kind: TokenKind): boolean {
    return this.peek().kind === kind;
  }

  private try_consume(kind: TokenKind): boolean {
    if (this.check(kind)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(kind: TokenKind): Token {
    const tok = this.peek();
    if (tok.kind !== kind) {
      throw this.error(`Expected '${kind}', got '${tok.value}' (${tok.kind})`);
    }
    return this.advance();
  }

  private at_end(): boolean {
    return this.peek().kind === TokenKind.Eof;
  }

  private current_span_start(): Position {
    const tok = this.peek();
    return tok.span.start;
  }

  private make_span(start: Position, end: Position): Span {
    return { file: this.file, start, end };
  }

  private is_uppercase(ch: string): boolean {
    return ch >= "A" && ch <= "Z";
  }

  private report_error(code: string, msg: string, span?: Span): void {
    const tok = this.peek();
    const error_span = span ?? tok.span;
    this.sink.report(make_diagnostic(
      code,
      "error",
      msg,
      error_span,
      { kind: "parse_error", token: tok.value },
    ));
    this.error_count++;
    if (this.error_count >= Parser.MAX_ERRORS) {
      throw new CompileError([...this.sink.diagnostics()]);
    }
  }

  private synchronize(): void {
    while (!this.at_end()) {
      const tok = this.peek();
      if (
        tok.kind === TokenKind.Fn ||
        tok.kind === TokenKind.Struct ||
        tok.kind === TokenKind.Enum ||
        tok.kind === TokenKind.Trait ||
        tok.kind === TokenKind.Impl ||
        tok.kind === TokenKind.Effect ||
        tok.kind === TokenKind.Pub ||
        tok.kind === TokenKind.Test ||
        tok.kind === TokenKind.Use
      ) {
        return;
      }
      this.advance();
    }
  }

  private error(msg: string): Error {
    const tok = this.peek();
    this.report_error(E.E0103, msg, tok.span);
    return new Error(`Parse error: ${msg}`);
  }
}
