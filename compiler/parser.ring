use ast::{
    Position, Span, span_zero,
    TypeExpr, RecordTypeField,
    Pattern, NamedPatternField, LiteralValue,
    BinOp, UnaryOp,
    Param, MatchArm, StructFieldInit, EffectHandler, StringInterpPart,
    Expr, Stmt, DestructureBinding,
    UsePath, NamedImport, UseImport, UseDecl,
    TypeBound, TypeParam, StructFieldDecl, NamedEnumField, EnumVariantDecl, EffectOpDecl,
    Decl, Program
}
use lexer::{TokenKind, Token, Lexer, new_lexer, token_kind_value}
use diagnostics::{CollectingSink, Severity, DiagnosticContext, new_collecting_sink, make_diag, make_diagnostic}
use codes::{E0101, E0103, E0104, E0706}

extern fn __ring_raise_fail(msg: Str) -> Never

// ============================================================
// Operator Precedence
// ============================================================

pub const PREC_NONE: Int = 0
pub const PREC_CATCH: Int = 1
pub const PREC_LOGIC_OR: Int = 2
pub const PREC_LOGIC_AND: Int = 3
pub const PREC_EQUALITY: Int = 4
pub const PREC_COMPARE: Int = 5
pub const PREC_RANGE: Int = 6
pub const PREC_ADD_SUB: Int = 7
pub const PREC_MUL_DIV: Int = 8
pub const PREC_UNARY: Int = 9
pub const PREC_POSTFIX: Int = 10

pub fn infix_precedence(kind: TokenKind) -> Int {
    match kind {
        TkCatch => PREC_CATCH,
        TkPipePipe => PREC_LOGIC_OR,
        TkAmpAmp => PREC_LOGIC_AND,
        TkEqEq => PREC_EQUALITY,
        TkBangEq => PREC_EQUALITY,
        TkLt => PREC_COMPARE,
        TkGt => PREC_COMPARE,
        TkLtEq => PREC_COMPARE,
        TkGtEq => PREC_COMPARE,
        TkDotDot => PREC_RANGE,
        TkDotDotEq => PREC_RANGE,
        TkPlus => PREC_ADD_SUB,
        TkMinus => PREC_ADD_SUB,
        TkStar => PREC_MUL_DIV,
        TkSlash => PREC_MUL_DIV,
        TkPercent => PREC_MUL_DIV,
        TkDot => PREC_POSTFIX,
        TkLParen => PREC_POSTFIX,
        _ => PREC_NONE
    }
}

// ============================================================
// BinOp / UnaryOp string conversion
// ============================================================

fn str_to_binop(s: Str) -> BinOp {
    if s == "+" { return BinOp::Add }
    if s == "-" { return BinOp::Sub }
    if s == "*" { return BinOp::Mul }
    if s == "/" { return BinOp::Div }
    if s == "%" { return BinOp::Mod }
    if s == "==" { return BinOp::Eq }
    if s == "!=" { return BinOp::Neq }
    if s == "<" { return BinOp::Lt }
    if s == "<=" { return BinOp::Lte }
    if s == ">" { return BinOp::Gt }
    if s == ">=" { return BinOp::Gte }
    if s == "&&" { return BinOp::And }
    if s == "||" { return BinOp::Or }
    panic("Unknown binary operator: ${s}")
}

fn str_to_unaryop(s: Str) -> UnaryOp {
    if s == "-" { return UnaryOp::Neg }
    if s == "!" { return UnaryOp::Not }
    panic("Unknown unary operator: ${s}")
}

fn dummy_type_expr() -> TypeExpr {
    TypeExpr::Named { name: "", type_args: [], span: span_zero() }
}

fn is_decl_start(k: TokenKind) -> Bool {
    match k {
        TkFn => true, TkStruct => true, TkEnum => true,
        TkEffect => true, TkTrait => true, TkImpl => true,
        TkExtern => true, TkUse => true, TkPub => true, TkTest => true,
        TkConst => true,
        _ => false
    }
}

fn is_uppercase(ch: Str) -> Bool {
    let c = ch.char_code_at(0).unwrap_or(0)
    c >= 65 && c <= 90
}

pub fn expr_span(e: Expr) -> Span {
    match e {
        IntLit { span, .. } => span,
        FloatLit { span, .. } => span,
        StrLit { span, .. } => span,
        BoolLit { span, .. } => span,
        Ident { span, .. } => span,
        BinOp { span, .. } => span,
        UnaryOp { span, .. } => span,
        Call { span, .. } => span,
        MethodCall { span, .. } => span,
        FieldAccess { span, .. } => span,
        StructLit { span, .. } => span,
        MatchExpr { span, .. } => span,
        Block { span, .. } => span,
        IfExpr { span, .. } => span,
        StringInterp { span, .. } => span,
        CatchExpr { span, .. } => span,
        HandleExpr { span, .. } => span,
        Lambda { span, .. } => span,
        Range { span, .. } => span,
        ListLit { span, .. } => span,
        TupleLit { span, .. } => span
    }
}

// ============================================================
// Parser struct
// ============================================================

pub struct Parser {
    pub tokens: List<Token>,
    pub pos: Int,
    pub file: Str,
    pub sink: CollectingSink,
    pub error_count: Int
}

const MAX_ERRORS: Int = 20

pub fn new_parser(tokens: List<Token>, file: Str, sink: CollectingSink) -> Parser {
    Parser { tokens: tokens, pos: 0, file: file, sink: sink, error_count: 0 }
}

pub fn parse(source: Str, file: Str, sink: CollectingSink) -> Program {
    var lexer = new_lexer(source, file, sink)
    let tokens = lexer.tokenize()
    var parser = new_parser(tokens, file, sink)
    parser.parse_program()
}

impl Parser {

    // ============================================================
    // Token helpers
    // ============================================================

    pub fn peek(self) -> Token {
        if self.pos >= self.tokens.len() {
            return self.tokens.get(self.tokens.len() - 1).unwrap_or(Token {
                kind: TokenKind::TkEof,
                value: "",
                span: Span { file: self.file, start: Position { line: 1, column: 0, offset: 0 }, end: Position { line: 1, column: 0, offset: 0 } }
            })
        }
        self.tokens.get(self.pos).unwrap_or(Token {
            kind: TokenKind::TkEof,
            value: "",
            span: Span { file: self.file, start: Position { line: 1, column: 0, offset: 0 }, end: Position { line: 1, column: 0, offset: 0 } }
        })
    }

    pub fn advance(var self) -> Token {
        let tok = self.peek()
        self.pos = self.pos + 1
        tok
    }

    pub fn check(self, kind: TokenKind) -> Bool {
        token_kind_value(self.peek().kind) == token_kind_value(kind)
    }

    pub fn try_consume(var self, kind: TokenKind) -> Bool {
        if self.check(kind) {
            self.advance()
            return true
        }
        false
    }

    pub fn expect(var self, kind: TokenKind) -> Token {
        let tok = self.peek()
        if token_kind_value(tok.kind) != token_kind_value(kind) {
            self.error("Expected '${token_kind_value(kind)}', got '${tok.value}' (${token_kind_value(tok.kind)})")
        }
        self.advance()
    }

    pub fn at_end(self) -> Bool {
        self.check(TokenKind::TkEof)
    }

    // ============================================================
    // Span helpers
    // ============================================================

    pub fn current_span_start(self) -> Position {
        self.peek().span.start
    }

    pub fn make_span(self, start: Position, end: Position) -> Span {
        Span { file: self.file, start: start, end: end }
    }

    // ============================================================
    // Error helpers
    // ============================================================

    pub fn report_error(var self, code: Str, msg: Str, span: Span?) {
        let tok = self.peek()
        let error_span = span.unwrap_or(tok.span)
        self.sink.report(make_diag(
            code,
            Severity::SevError,
            msg,
            error_span,
            DiagnosticContext::ParseError { token: tok.value, expected: none }
        ))
        self.error_count = self.error_count + 1
        if (self.error_count >= MAX_ERRORS) {
            panic("Too many parse errors")
        }
    }

    fn error(var self, msg: Str) -> Never {
        let tok = self.peek()
        self.report_error(E0103, msg, some(tok.span))
        __ring_raise_fail(msg)
    }

    // ============================================================
    // Program
    // ============================================================

    pub fn parse_program(var self) -> Program {
        let start = self.current_span_start()
        var uses: List<UseDecl> = []
        var decls: List<Decl> = []
        var decls_started = false

        while !self.at_end() {
            if self.check(TokenKind::TkError) { self.advance(); continue }

            if self.check(TokenKind::TkUse) {
                if decls_started {
                    self.report_error(E0706, "Use declaration must appear before other declarations", some(self.peek().span))
                }
                let use_result: UseDecl? = some(self.parse_use_decl(false)) catch { _ => none }
                match use_result {
                    some(ud) => uses.push(ud),
                    none => {
                        while !self.at_end() {
                            if is_decl_start(self.peek().kind) { break }
                            self.advance()
                        }
                    }
                }
                continue
            }

            if self.check(TokenKind::TkPub) {
                let save_pos = self.pos
                let save_errors = self.error_count
                let sink_checkpoint = self.sink.save()
                self.advance()
                if self.check(TokenKind::TkUse) {
                    if decls_started {
                        self.report_error(E0706, "Use declaration must appear before other declarations", some(self.tokens.get(save_pos).unwrap_or(self.peek()).span))
                    }
                    let pub_use_result: UseDecl? = some(self.parse_use_decl(true)) catch { _ => none }
                    match pub_use_result {
                        some(ud) => uses.push(ud),
                        none => {
                            while !self.at_end() {
                                if is_decl_start(self.peek().kind) { break }
                                self.advance()
                            }
                        }
                    }
                    continue
                }
                self.pos = save_pos
                self.error_count = save_errors
                self.sink.restore(sink_checkpoint)
            }

            decls_started = true
            let maybe_decl: Decl? = self.parse_decl() catch { _ => none }
            match maybe_decl {
                some(decl) => decls.push(decl),
                none => {
                    while !self.at_end() {
                        if is_decl_start(self.peek().kind) { break }
                        self.advance()
                    }
                }
            }
        }
        let end = self.current_span_start()
        Program { uses: uses, decls: decls, span: self.make_span(start, end) }
    }

    // ============================================================
    // Statements
    // ============================================================

    pub fn parse_stmt(var self) -> Stmt {
        let start = self.current_span_start()

        if self.check(TokenKind::TkLet) {
            let saved_pos = self.pos
            self.advance()
            if self.check(TokenKind::TkLParen) {
                let pattern = self.parse_pattern()
                self.expect(TokenKind::TkEq)
                let init = self.parse_expr()
                self.try_consume(TokenKind::TkSemi)
                let end = self.current_span_start()
                return Stmt::LetDestructure { pattern: pattern, init: init, span: self.make_span(start, end) }
            }
            self.pos = saved_pos
            return self.parse_binding_stmt(false)
        }
        if self.check(TokenKind::TkVar) {
            return self.parse_binding_stmt(true)
        }
        if self.check(TokenKind::TkReturn) {
            return self.parse_return_stmt()
        }
        if self.check(TokenKind::TkIf) {
            let saved_pos = self.pos
            self.advance()
            if self.check(TokenKind::TkLet) {
                return self.parse_if_let_stmt(start)
            }
            self.pos = saved_pos
        }
        if self.check(TokenKind::TkWhile) {
            return self.parse_while_stmt()
        }
        if self.check(TokenKind::TkLoop) {
            return self.parse_loop_stmt()
        }
        if self.check(TokenKind::TkFor) {
            return self.parse_for_in_stmt()
        }
        if self.check(TokenKind::TkBreak) {
            return self.parse_break_stmt()
        }
        if self.check(TokenKind::TkContinue) {
            return self.parse_continue_stmt()
        }

        let expr = self.parse_expr()

        if self.check(TokenKind::TkEq) || self.check(TokenKind::TkPlusEq) || self.check(TokenKind::TkMinusEq) {
            let op_tok = self.advance()
            let value_expr = self.parse_expr()
            self.try_consume(TokenKind::TkSemi)
            let end = self.current_span_start()

            var value = value_expr
            if token_kind_value(op_tok.kind) == "+=" {
                value = Expr::BinOp { op: BinOp::Add, left: expr, right: value_expr, span: expr_span(value_expr) }
            } else if token_kind_value(op_tok.kind) == "-=" {
                value = Expr::BinOp { op: BinOp::Sub, left: expr, right: value_expr, span: expr_span(value_expr) }
            }

            return Stmt::Assign { target: expr, value: value, span: self.make_span(start, end) }
        }

        let has_semi = self.try_consume(TokenKind::TkSemi)
        let end = self.current_span_start()
        Stmt::ExprStmt { expr: expr, has_semi: has_semi, span: self.make_span(start, end) }
    }

    fn parse_while_stmt(var self) -> Stmt {
        let start = self.current_span_start()
        self.expect(TokenKind::TkWhile)
        let condition = self.parse_expr_no_struct()
        let body = self.parse_block_expr()
        let end = self.current_span_start()
        Stmt::While { condition: condition, body: body, span: self.make_span(start, end) }
    }

    fn parse_loop_stmt(var self) -> Stmt {
        let start = self.current_span_start()
        self.expect(TokenKind::TkLoop)
        let body = self.parse_block_expr()
        let end = self.current_span_start()
        let condition = Expr::BoolLit { value: true, span: self.make_span(start, start) }
        Stmt::While { condition: condition, body: body, span: self.make_span(start, end) }
    }

    fn parse_for_in_stmt(var self) -> Stmt {
        let start = self.current_span_start()
        self.expect(TokenKind::TkFor)

        var binding = ""
        var binding_span = span_zero()
        var destructure: DestructureBinding? = none

        if self.check(TokenKind::TkLParen) {
            self.advance()
            var names: List<Str> = []
            var spans: List<Span> = []
            let first = self.expect(TokenKind::TkIdent)
            names.push(first.value)
            spans.push(first.span)
            while self.try_consume(TokenKind::TkComma) {
                if self.check(TokenKind::TkRParen) { break }
                let tok = self.expect(TokenKind::TkIdent)
                names.push(tok.value)
                spans.push(tok.span)
            }
            self.expect(TokenKind::TkRParen)
            binding = names.first().unwrap_or("")
            binding_span = spans.first().unwrap_or(span_zero())
            if names.len() > 1 {
                destructure = some(DestructureBinding { names: names, spans: spans })
            }
        } else {
            let name_tok = self.expect(TokenKind::TkIdent)
            binding = name_tok.value
            binding_span = name_tok.span
        }

        self.expect(TokenKind::TkIn)
        let iterable = self.parse_expr_no_struct()
        let body = self.parse_block_expr()
        let end = self.current_span_start()
        Stmt::ForIn {
            binding: binding,
            binding_span: binding_span,
            destructure: destructure,
            iterable: iterable,
            body: body,
            span: self.make_span(start, end)
        }
    }

    fn parse_break_stmt(var self) -> Stmt {
        let start = self.current_span_start()
        self.expect(TokenKind::TkBreak)
        self.try_consume(TokenKind::TkSemi)
        let end = self.current_span_start()
        Stmt::Break { span: self.make_span(start, end) }
    }

    fn parse_continue_stmt(var self) -> Stmt {
        let start = self.current_span_start()
        self.expect(TokenKind::TkContinue)
        self.try_consume(TokenKind::TkSemi)
        let end = self.current_span_start()
        Stmt::Continue { span: self.make_span(start, end) }
    }

    fn parse_if_let_stmt(var self, start: Position) -> Stmt {
        self.expect(TokenKind::TkLet)
        let pattern = self.parse_pattern()
        self.expect(TokenKind::TkEq)
        let expr = self.parse_expr()
        let then_block = self.parse_block_expr()
        var else_block: Expr? = none
        if self.try_consume(TokenKind::TkElse) {
            else_block = some(self.parse_block_expr())
        }
        let end_pos = match else_block {
            some(eb) => expr_span(eb).end,
            none => expr_span(then_block).end
        }
        Stmt::IfLet {
            pattern: pattern,
            expr: expr,
            then_block: then_block,
            else_block: else_block,
            span: self.make_span(start, end_pos)
        }
    }

    fn parse_binding_stmt(var self, mutable: Bool) -> Stmt {
        let start = self.current_span_start()
        if mutable { self.expect(TokenKind::TkVar) } else { self.expect(TokenKind::TkLet) }
        let name_tok = self.expect(TokenKind::TkIdent)
        let name = name_tok.value
        let name_span = name_tok.span
        var type_annotation: TypeExpr? = none
        if self.try_consume(TokenKind::TkColon) {
            type_annotation = some(self.parse_type_expr())
        }
        self.expect(TokenKind::TkEq)
        let init = self.parse_expr()
        self.try_consume(TokenKind::TkSemi)
        let end = self.current_span_start()
        let span = self.make_span(start, end)
        if mutable {
            Stmt::Var { name: name, name_span: name_span, type_annotation: type_annotation, init: init, span: span }
        } else {
            Stmt::Let { name: name, name_span: name_span, type_annotation: type_annotation, init: init, span: span }
        }
    }

    fn parse_return_stmt(var self) -> Stmt {
        let start = self.current_span_start()
        self.expect(TokenKind::TkReturn)
        var value: Expr? = none
        if !self.check(TokenKind::TkSemi) && !self.check(TokenKind::TkRBrace) && !self.at_end() {
            value = some(self.parse_expr())
        }
        self.try_consume(TokenKind::TkSemi)
        let end = self.current_span_start()
        Stmt::Return { value: value, span: self.make_span(start, end) }
    }

    // ============================================================
    // Block expression
    // ============================================================

    pub fn parse_block_expr(var self) -> Expr {
        let start = self.current_span_start()
        self.expect(TokenKind::TkLBrace)
        var stmts: List<Stmt> = []
        var tail: Expr? = none

        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            let stmt = self.parse_stmt()

            if self.check(TokenKind::TkRBrace) {
                match stmt {
                    ExprStmt { expr: e, has_semi: hs, .. } => {
                        if !hs { tail = some(e) }
                        else { stmts.push(stmt) }
                    },
                    _ => stmts.push(stmt)
                }
            } else {
                stmts.push(stmt)
            }
        }

        self.expect(TokenKind::TkRBrace)
        let end = self.current_span_start()
        Expr::Block { stmts: stmts, tail: tail, span: self.make_span(start, end) }
    }

    // ============================================================
    // Declarations
    // ============================================================

    fn parse_use_decl(var self, is_pub: Bool) -> UseDecl {
        let start = self.current_span_start()
        self.expect(TokenKind::TkUse)

        var segments: List<Str> = []
        let path_start = self.current_span_start()
        segments.push(self.expect(TokenKind::TkIdent).value)

        while self.check(TokenKind::TkColonColon) {
            self.advance()
            if self.check(TokenKind::TkLBrace) { break }
            segments.push(self.expect(TokenKind::TkIdent).value)
        }

        let path_end = self.current_span_start()
        var path = UsePath { segments: segments, span: self.make_span(path_start, path_end) }
        var imports = UseImport::Module
        var alias: Str? = none

        if self.check(TokenKind::TkLBrace) {
            self.advance()
            var names: List<NamedImport> = []
            while !self.check(TokenKind::TkRBrace) && !self.at_end() {
                let name_start = self.current_span_start()
                let name = self.expect(TokenKind::TkIdent).value
                var name_alias: Str? = none
                if self.try_consume(TokenKind::TkAs) {
                    name_alias = some(self.expect(TokenKind::TkIdent).value)
                }
                let name_end = self.current_span_start()
                names.push(NamedImport { name: name, alias: name_alias, span: self.make_span(name_start, name_end) })
                if !self.try_consume(TokenKind::TkComma) { break }
            }
            self.expect(TokenKind::TkRBrace)
            imports = UseImport::NamedItems { names: names }
        } else if self.check(TokenKind::TkAs) {
            self.advance()
            alias = some(self.expect(TokenKind::TkIdent).value)
            imports = UseImport::Module
        } else if segments.len() > 1 {
            let imported_name = segments.pop().unwrap_or("")
            path = UsePath { segments: segments, span: self.make_span(path_start, path_end) }
            let name_span = self.make_span(path_start, path_end)
            imports = UseImport::NamedItems { names: [NamedImport { name: imported_name, alias: none, span: name_span }] }
        }

        let end = self.current_span_start()
        UseDecl {
            path: path,
            imports: imports,
            alias: alias,
            is_pub: is_pub,
            span: self.make_span(start, end)
        }
    }

    fn parse_decl(var self) -> Decl? {
        let is_pub = self.try_consume(TokenKind::TkPub)
        let tok = self.peek()

        match tok.kind {
            TkFn => some(self.parse_fn_decl(is_pub, false)),
            TkStruct => some(self.parse_struct_decl(is_pub)),
            TkEnum => some(self.parse_enum_decl(is_pub)),
            TkImpl => some(self.parse_impl_decl()),
            TkEffect => some(self.parse_effect_decl(is_pub)),
            TkTest => some(self.parse_test_decl()),
            TkTrait => some(self.parse_trait_decl(is_pub)),
            TkExtern => some(self.parse_extern_decl(is_pub)),
            TkConst => some(self.parse_const_decl(is_pub)),
            TkIdent => {
                if tok.value == "type" { return some(self.parse_type_alias_decl(is_pub)) }
                self.report_error(E0101, "Expected declaration, got '${tok.value}' (${token_kind_value(tok.kind)})", some(tok.span))
                none
            },
            _ => {
                self.report_error(E0101, "Expected declaration, got '${tok.value}' (${token_kind_value(tok.kind)})", some(tok.span))
                none
            }
        }
    }

    fn parse_fn_decl(var self, is_pub: Bool, body_optional: Bool) -> Decl {
        let start = self.current_span_start()
        self.expect(TokenKind::TkFn)
        let name = self.expect(TokenKind::TkIdent).value
        let type_params = self.parse_type_params()
        self.expect(TokenKind::TkLParen)
        let params = self.parse_params()
        self.expect(TokenKind::TkRParen)
        var return_type: TypeExpr? = none
        if self.try_consume(TokenKind::TkArrow) {
            return_type = some(self.parse_type_expr())
        }
        var body = Expr::Block { stmts: [], tail: none, span: span_zero() }
        var is_abstract_val = false
        if body_optional && !self.check(TokenKind::TkLBrace) {
            let pos = self.current_span_start()
            body = Expr::Block { stmts: [], tail: none, span: self.make_span(pos, pos) }
            is_abstract_val = true
        } else {
            body = self.parse_block_expr()
        }
        let end = self.current_span_start()
        Decl::Fn {
            name: name,
            type_params: type_params,
            params: params,
            return_type: return_type,
            body: body,
            is_pub: is_pub,
            is_abstract: is_abstract_val,
            span: self.make_span(start, end)
        }
    }

    fn parse_const_decl(var self, is_pub: Bool) -> Decl {
        let start = self.current_span_start()
        self.expect(TokenKind::TkConst)
        let name = self.expect(TokenKind::TkIdent).value
        var type_annotation: TypeExpr? = none
        if self.try_consume(TokenKind::TkColon) {
            type_annotation = some(self.parse_type_expr())
        }
        self.expect(TokenKind::TkEq)
        let init = self.parse_expr()
        let end = self.current_span_start()
        Decl::Const { name: name, type_annotation: type_annotation, init: init, is_pub: is_pub, span: self.make_span(start, end) }
    }

    fn parse_extern_decl(var self, is_pub: Bool) -> Decl {
        let start = self.current_span_start()
        self.expect(TokenKind::TkExtern)
        if self.check(TokenKind::TkIdent) && self.peek().value == "type" {
            return self.parse_extern_type_decl_body(is_pub, start)
        }
        self.parse_extern_fn_decl_body(is_pub, start)
    }

    fn parse_extern_fn_decl_body(var self, is_pub: Bool, start: Position) -> Decl {
        self.expect(TokenKind::TkFn)
        let name = self.expect(TokenKind::TkIdent).value
        let type_params = self.parse_type_params()
        self.expect(TokenKind::TkLParen)
        let params = self.parse_params()
        self.expect(TokenKind::TkRParen)
        var return_type: TypeExpr? = none
        if self.try_consume(TokenKind::TkArrow) {
            return_type = some(self.parse_type_expr())
        }
        let end = self.current_span_start()
        Decl::ExternFn {
            name: name,
            type_params: type_params,
            params: params,
            return_type: return_type,
            is_pub: is_pub,
            span: self.make_span(start, end)
        }
    }

    fn parse_extern_type_decl_body(var self, is_pub: Bool, start: Position) -> Decl {
        self.advance()
        let name = self.expect(TokenKind::TkIdent).value
        let type_params = self.parse_type_params()
        let end = self.current_span_start()
        Decl::ExternType {
            name: name,
            type_params: type_params,
            is_pub: is_pub,
            span: self.make_span(start, end)
        }
    }

    fn parse_type_alias_decl(var self, is_pub: Bool) -> Decl {
        let start = self.current_span_start()
        self.advance()
        let name = self.expect(TokenKind::TkIdent).value
        let type_params = self.parse_type_params()
        self.expect(TokenKind::TkEq)
        let type_expr = self.parse_type_expr()
        let end = self.current_span_start()
        Decl::TypeAlias {
            name: name,
            type_params: type_params,
            type_expr: type_expr,
            is_pub: is_pub,
            span: self.make_span(start, end)
        }
    }

    fn parse_struct_decl(var self, is_pub: Bool) -> Decl {
        let start = self.current_span_start()
        self.expect(TokenKind::TkStruct)
        let name = self.expect(TokenKind::TkIdent).value
        let type_params = self.parse_type_params()
        self.expect(TokenKind::TkLBrace)
        var fields: List<StructFieldDecl> = []
        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            let field_start = self.current_span_start()
            let field_pub = self.try_consume(TokenKind::TkPub)
            let field_name = self.expect(TokenKind::TkIdent).value
            self.expect(TokenKind::TkColon)
            let type_annotation = self.parse_type_expr()
            if self.check(TokenKind::TkWhere) {
                let where_span = self.peek().span
                self.sink.report(make_diag("W0001", Severity::SevWarning,
                    "Refinement types are not yet implemented; 'where' clause is ignored",
                    where_span,
                    DiagnosticContext::OtherContext { detail: some("where clause parsed but not enforced") }))
                self.advance()
                var depth = 0
                while !self.at_end() {
                    if depth == 0 && (self.check(TokenKind::TkComma) || self.check(TokenKind::TkRBrace)) { break }
                    if self.check(TokenKind::TkLParen) || self.check(TokenKind::TkLBrace) || self.check(TokenKind::TkLBracket) {
                        depth = depth + 1
                    }
                    if self.check(TokenKind::TkRParen) || self.check(TokenKind::TkRBrace) || self.check(TokenKind::TkRBracket) {
                        depth = depth - 1
                    }
                    if depth < 0 { break }
                    self.advance()
                }
            }
            let field_end = self.current_span_start()
            fields.push(StructFieldDecl {
                name: field_name,
                type_annotation: type_annotation,
                is_pub: field_pub,
                span: self.make_span(field_start, field_end)
            })
            self.try_consume(TokenKind::TkComma)
        }
        self.expect(TokenKind::TkRBrace)
        let end = self.current_span_start()
        Decl::Struct {
            name: name,
            type_params: type_params,
            fields: fields,
            is_pub: is_pub,
            span: self.make_span(start, end)
        }
    }

    fn parse_enum_decl(var self, is_pub: Bool) -> Decl {
        let start = self.current_span_start()
        self.expect(TokenKind::TkEnum)
        let name = self.expect(TokenKind::TkIdent).value
        let type_params = self.parse_type_params()
        self.expect(TokenKind::TkLBrace)
        var variants: List<EnumVariantDecl> = []
        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            let v_start = self.current_span_start()
            let v_name = self.expect(TokenKind::TkIdent).value
            var v_fields: List<TypeExpr> = []
            var named_fields: List<NamedEnumField>? = none
            if self.try_consume(TokenKind::TkLParen) {
                if self.check(TokenKind::TkRParen) {
                    // Reject empty parentheses — use bare name instead
                    let rp_span = self.peek().span
                    self.report_error(E0104, "empty parentheses on enum variant '${v_name}' — use bare name instead", some(rp_span))
                    let _rp = self.advance()  // consume ')'
                } else {
                    v_fields.push(self.parse_type_expr())
                    while self.try_consume(TokenKind::TkComma) {
                        if self.check(TokenKind::TkRParen) { break }
                        v_fields.push(self.parse_type_expr())
                    }
                    let _rp = self.expect(TokenKind::TkRParen)
                }
            } else if self.check(TokenKind::TkLBrace) {
                self.advance()
                var nf: List<NamedEnumField> = []
                while !self.check(TokenKind::TkRBrace) && !self.at_end() {
                    let f_start = self.current_span_start()
                    let f_name = self.expect(TokenKind::TkIdent).value
                    self.expect(TokenKind::TkColon)
                    let f_type = self.parse_type_expr()
                    let f_end = self.current_span_start()
                    nf.push(NamedEnumField { name: f_name, type_expr: f_type, span: self.make_span(f_start, f_end) })
                    self.try_consume(TokenKind::TkComma)
                }
                self.expect(TokenKind::TkRBrace)
                named_fields = some(nf)
            }
            let v_end = self.current_span_start()
            variants.push(EnumVariantDecl { name: v_name, fields: v_fields, named_fields: named_fields, span: self.make_span(v_start, v_end) })
            self.try_consume(TokenKind::TkComma)
        }
        self.expect(TokenKind::TkRBrace)
        let end = self.current_span_start()
        Decl::Enum {
            name: name,
            type_params: type_params,
            variants: variants,
            is_pub: is_pub,
            span: self.make_span(start, end)
        }
    }

    fn parse_impl_decl(var self) -> Decl {
        let start = self.current_span_start()
        self.expect(TokenKind::TkImpl)
        let type_params = self.parse_type_params()
        let first_name = self.expect(TokenKind::TkIdent).value

        var target_type = first_name
        var trait_name: Str? = none
        if self.check(TokenKind::TkFor) {
            self.advance()
            trait_name = some(first_name)
            target_type = self.expect(TokenKind::TkIdent).value
        }

        self.expect(TokenKind::TkLBrace)
        var methods: List<Decl> = []
        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            let m_pub = self.try_consume(TokenKind::TkPub)
            if self.check(TokenKind::TkExtern) {
                let m_start = self.current_span_start()
                self.expect(TokenKind::TkExtern)
                methods.push(self.parse_extern_fn_decl_body(m_pub, m_start))
            } else {
                methods.push(self.parse_fn_decl(m_pub, false))
            }
        }
        self.expect(TokenKind::TkRBrace)
        let end = self.current_span_start()
        Decl::Impl {
            target_type: target_type,
            type_params: type_params,
            trait_name: trait_name,
            methods: methods,
            span: self.make_span(start, end)
        }
    }

    fn parse_effect_decl(var self, is_pub: Bool) -> Decl {
        let start = self.current_span_start()
        self.expect(TokenKind::TkEffect)
        let name = self.expect(TokenKind::TkIdent).value
        let type_params = self.parse_type_params()
        self.expect(TokenKind::TkLBrace)
        var ops: List<EffectOpDecl> = []
        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            let op_start = self.current_span_start()
            self.expect(TokenKind::TkFn)
            let op_name = self.expect(TokenKind::TkIdent).value
            self.expect(TokenKind::TkLParen)
            let params = self.parse_params()
            self.expect(TokenKind::TkRParen)
            self.expect(TokenKind::TkArrow)
            let return_type = self.parse_type_expr()
            let op_end = self.current_span_start()
            ops.push(EffectOpDecl { name: op_name, params: params, return_type: return_type, span: self.make_span(op_start, op_end) })
            self.try_consume(TokenKind::TkComma)
            self.try_consume(TokenKind::TkSemi)
        }
        self.expect(TokenKind::TkRBrace)
        let end = self.current_span_start()
        Decl::Effect {
            name: name,
            type_params: type_params,
            ops: ops,
            is_pub: is_pub,
            span: self.make_span(start, end)
        }
    }

    fn parse_test_decl(var self) -> Decl {
        let start = self.current_span_start()
        self.expect(TokenKind::TkTest)
        let desc_tok = self.expect(TokenKind::TkStringLit)
        let body = self.parse_block_expr()
        let end = self.current_span_start()
        Decl::Test { description: desc_tok.value, body: body, span: self.make_span(start, end) }
    }

    fn parse_trait_decl(var self, is_pub: Bool) -> Decl {
        let start = self.current_span_start()
        self.expect(TokenKind::TkTrait)
        let name = self.expect(TokenKind::TkIdent).value
        let type_params = self.parse_type_params()
        let supertraits: List<TypeBound> = []
        self.expect(TokenKind::TkLBrace)
        var methods: List<Decl> = []
        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            let m_pub = self.try_consume(TokenKind::TkPub)
            methods.push(self.parse_fn_decl(m_pub, true))
        }
        self.expect(TokenKind::TkRBrace)
        let end = self.current_span_start()
        Decl::Trait {
            name: name,
            type_params: type_params,
            supertraits: supertraits,
            methods: methods,
            is_pub: is_pub,
            span: self.make_span(start, end)
        }
    }

    // ============================================================
    // Expressions — Pratt Parsing
    // ============================================================

    pub fn parse_expr(var self) -> Expr {
        self.parse_expr_bp(PREC_NONE, true)
    }

    fn parse_expr_no_struct(var self) -> Expr {
        self.parse_expr_bp(PREC_NONE, false)
    }

    pub fn parse_expr_bp(var self, min_prec: Int, allow_struct_lit: Bool) -> Expr {
        var left = self.parse_prefix(allow_struct_lit)
        var last_was_comparison = false

        while true {
            let tok = self.peek()
            let prec = infix_precedence(tok.kind)
            if prec <= min_prec { break }

            if self.check(TokenKind::TkCatch) {
                left = self.parse_catch_expr(left)
                last_was_comparison = false
            } else if self.check(TokenKind::TkDot) {
                left = self.parse_dot_expr(left)
                last_was_comparison = false
            } else if self.check(TokenKind::TkLParen) {
                if tok.span.start.line > expr_span(left).end.line { break }
                left = self.parse_call_expr(left)
                last_was_comparison = false
            } else if self.check(TokenKind::TkDotDot) || self.check(TokenKind::TkDotDotEq) {
                let inclusive = self.check(TokenKind::TkDotDotEq)
                self.advance()
                let right = self.parse_expr_bp(prec, allow_struct_lit)
                let span = self.make_span(expr_span(left).start, expr_span(right).end)
                left = Expr::Range { start: left, end: right, inclusive: inclusive, span: span }
                last_was_comparison = false
            } else {
                let is_comparison = prec == PREC_EQUALITY || prec == PREC_COMPARE
                if is_comparison && last_was_comparison {
                    self.error("Comparison operators are non-associative: cannot chain '${tok.value}' after another comparison")
                }
                self.advance()
                let right = self.parse_expr_bp(prec, allow_struct_lit)
                let span = self.make_span(expr_span(left).start, expr_span(right).end)
                left = Expr::BinOp { op: str_to_binop(tok.value), left: left, right: right, span: span }
                last_was_comparison = is_comparison
            }
        }

        left
    }

    fn parse_prefix(var self, allow_struct_lit: Bool) -> Expr {
        let tok = self.peek()
        let start = self.current_span_start()

        if self.check(TokenKind::TkMinus) || self.check(TokenKind::TkBang) {
            self.advance()
            let operand = self.parse_expr_bp(PREC_UNARY, allow_struct_lit)
            let end = self.current_span_start()
            return Expr::UnaryOp { op: str_to_unaryop(tok.value), operand: operand, span: self.make_span(start, end) }
        }

        if self.check(TokenKind::TkIntLit) {
            self.advance()
            return Expr::IntLit { value: parse_int(tok.value).unwrap_or(0), span: tok.span }
        }
        if self.check(TokenKind::TkFloatLit) {
            self.advance()
            return Expr::FloatLit { value: parse_float(tok.value).unwrap_or(0.0), span: tok.span }
        }
        if self.check(TokenKind::TkStringLit) {
            self.advance()
            return Expr::StrLit { value: tok.value, span: tok.span }
        }
        if self.check(TokenKind::TkRawStringLit) {
            self.advance()
            return Expr::StrLit { value: tok.value, span: tok.span }
        }
        if self.check(TokenKind::TkTrue) {
            self.advance()
            return Expr::BoolLit { value: true, span: tok.span }
        }
        if self.check(TokenKind::TkFalse) {
            self.advance()
            return Expr::BoolLit { value: false, span: tok.span }
        }

        if self.check(TokenKind::TkStringInterpStart) {
            return self.parse_string_interp()
        }

        if self.check(TokenKind::TkLBrace) {
            return self.parse_block_expr()
        }

        if self.check(TokenKind::TkIf) {
            return self.parse_if_expr()
        }

        if self.check(TokenKind::TkMatch) {
            return self.parse_match_expr()
        }

        if self.check(TokenKind::TkHandle) {
            return self.parse_handle_expr()
        }

        if self.check(TokenKind::TkFn) {
            return self.parse_lambda_expr()
        }

        if self.check(TokenKind::TkLBracket) {
            self.advance()
            var elements: List<Expr> = []
            if !self.check(TokenKind::TkRBracket) {
                elements.push(self.parse_expr())
                while self.check(TokenKind::TkComma) {
                    self.advance()
                    if self.check(TokenKind::TkRBracket) { break }
                    elements.push(self.parse_expr())
                }
            }
            let end_tok = self.expect(TokenKind::TkRBracket)
            return Expr::ListLit { elements: elements, span: self.make_span(start, end_tok.span.end) }
        }

        if self.check(TokenKind::TkLParen) {
            self.advance()
            let first = self.parse_expr()
            if self.check(TokenKind::TkComma) {
                self.advance()
                var elements = [first]
                if !self.check(TokenKind::TkRParen) {
                    elements.push(self.parse_expr())
                    while self.check(TokenKind::TkComma) {
                        self.advance()
                        if self.check(TokenKind::TkRParen) { break }
                        elements.push(self.parse_expr())
                    }
                }
                let end_tok = self.expect(TokenKind::TkRParen)
                return Expr::TupleLit { elements: elements, span: self.make_span(start, end_tok.span.end) }
            }
            self.expect(TokenKind::TkRParen)
            return first
        }

        if self.check(TokenKind::TkIdent) {
            self.advance()
            let name = tok.value

            if is_uppercase(name.char_at(0).unwrap_or("")) && self.check(TokenKind::TkColonColon) {
                self.advance()
                let variant_tok = self.expect(TokenKind::TkIdent)
                let variant_name = variant_tok.value

                if allow_struct_lit && is_uppercase(variant_name.char_at(0).unwrap_or("")) && self.check(TokenKind::TkLBrace) {
                    return self.parse_struct_literal(variant_name, start, some(name))
                }

                return Expr::Ident { name: variant_name, qualifier: some(name), span: self.make_span(start, variant_tok.span.end) }
            }

            if allow_struct_lit && is_uppercase(name.char_at(0).unwrap_or("")) && self.check(TokenKind::TkLBrace) {
                return self.parse_struct_literal(name, start, none)
            }

            return Expr::Ident { name: name, qualifier: none, span: tok.span }
        }

        self.error("Unexpected token '${tok.value}' (${token_kind_value(tok.kind)}) in expression")
    }

    // ============================================================
    // Postfix: dot (field access / method call)
    // ============================================================

    fn parse_dot_expr(var self, left: Expr) -> Expr {
        self.advance()
        var name = ""
        // Handle float literal after dot: e.g. `t.0.1` lexes as dot + float "0.1"
        // Split into chained tuple field accesses
        if self.check(TokenKind::TkFloatLit) {
            let tok = self.advance()
            let parts = tok.value.split(".")
            var result = left
            for part in parts {
                let end = self.current_span_start()
                result = Expr::FieldAccess { receiver: result, field: part, span: self.make_span(expr_span(left).start, end) }
            }
            return result
        }
        if self.check(TokenKind::TkIntLit) {
            let tok = self.advance()
            name = tok.value
        } else {
            let tok = self.expect(TokenKind::TkIdent)
            name = tok.value
        }

        if self.check(TokenKind::TkLParen) {
            self.advance()
            let args = self.parse_arg_list()
            self.expect(TokenKind::TkRParen)
            let end = self.current_span_start()
            return Expr::MethodCall {
                receiver: left,
                method: name,
                args: args,
                type_args: [],
                span: self.make_span(expr_span(left).start, end)
            }
        }

        let end = self.current_span_start()
        Expr::FieldAccess { receiver: left, field: name, span: self.make_span(expr_span(left).start, end) }
    }

    // ============================================================
    // Call expression
    // ============================================================

    fn parse_call_expr(var self, left: Expr) -> Expr {
        self.advance()
        let args = self.parse_arg_list()
        self.expect(TokenKind::TkRParen)
        let end = self.current_span_start()
        Expr::Call { callee: left, args: args, type_args: [], span: self.make_span(expr_span(left).start, end) }
    }

    fn parse_arg_list(var self) -> List<Expr> {
        var args: List<Expr> = []
        if self.check(TokenKind::TkRParen) { return args }
        args.push(self.parse_expr())
        while self.try_consume(TokenKind::TkComma) {
            if self.check(TokenKind::TkRParen) { break }
            args.push(self.parse_expr())
        }
        args
    }

    // ============================================================
    // Catch expression
    // ============================================================

    fn parse_catch_expr(var self, left: Expr) -> Expr {
        self.advance()
        self.expect(TokenKind::TkLBrace)
        var arms: List<MatchArm> = []
        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            arms.push(self.parse_match_arm())
            self.try_consume(TokenKind::TkComma)
        }
        let end_tok = self.expect(TokenKind::TkRBrace)
        let span = self.make_span(expr_span(left).start, end_tok.span.end)
        Expr::CatchExpr { expr: left, arms: arms, span: span }
    }

    // ============================================================
    // String interpolation
    // ============================================================

    fn parse_string_interp(var self) -> Expr {
        let start_tok = self.advance()
        var parts: List<StringInterpPart> = []

        if start_tok.value.len() > 0 {
            parts.push(StringInterpPart::LitPart(start_tok.value))
        }

        parts.push(StringInterpPart::ExprPart(self.parse_expr()))

        while true {
            let tok = self.peek()
            if self.check(TokenKind::TkStringInterpMiddle) {
                self.advance()
                if tok.value.len() > 0 {
                    parts.push(StringInterpPart::LitPart(tok.value))
                }
                parts.push(StringInterpPart::ExprPart(self.parse_expr()))
            } else if self.check(TokenKind::TkStringInterpEnd) {
                self.advance()
                if tok.value.len() > 0 {
                    parts.push(StringInterpPart::LitPart(tok.value))
                }
                break
            } else {
                break
            }
        }

        let end = self.current_span_start()
        Expr::StringInterp { parts: parts, span: self.make_span(start_tok.span.start, end) }
    }

    // ============================================================
    // If expression
    // ============================================================

    pub fn parse_if_expr(var self) -> Expr {
        let start = self.current_span_start()
        self.expect(TokenKind::TkIf)
        let condition = self.parse_expr_no_struct()
        let then_branch = self.parse_block_expr()
        var else_branch: Expr? = none
        if self.try_consume(TokenKind::TkElse) {
            if self.check(TokenKind::TkIf) {
                else_branch = some(self.parse_if_expr())
            } else {
                else_branch = some(self.parse_block_expr())
            }
        }
        let end = self.current_span_start()
        Expr::IfExpr { condition: condition, then_branch: then_branch, else_branch: else_branch, span: self.make_span(start, end) }
    }

    // ============================================================
    // Match expression
    // ============================================================

    fn parse_match_expr(var self) -> Expr {
        let start = self.current_span_start()
        self.expect(TokenKind::TkMatch)
        let scrutinee = self.parse_expr_no_struct()
        self.expect(TokenKind::TkLBrace)
        var arms: List<MatchArm> = []
        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            arms.push(self.parse_match_arm())
            self.try_consume(TokenKind::TkComma)
        }
        self.expect(TokenKind::TkRBrace)
        let end = self.current_span_start()
        Expr::MatchExpr { scrutinee: scrutinee, arms: arms, span: self.make_span(start, end) }
    }

    fn parse_match_arm(var self) -> MatchArm {
        let start = self.current_span_start()
        let pattern = self.parse_pattern()
        var guard: Expr? = none
        if self.check(TokenKind::TkIf) {
            self.advance()
            guard = some(self.parse_expr())
        }
        self.expect(TokenKind::TkFatArrow)
        let body = self.parse_expr()
        let end = self.current_span_start()
        MatchArm { pattern: pattern, guard: guard, body: body, span: self.make_span(start, end) }
    }

    // ============================================================
    // Patterns
    // ============================================================

    pub fn parse_pattern(var self) -> Pattern {
        let tok = self.peek()
        let start = self.current_span_start()

        if self.check(TokenKind::TkIdent) && tok.value == "_" {
            self.advance()
            return Pattern::Wildcard { span: tok.span }
        }

        if self.check(TokenKind::TkIntLit) {
            self.advance()
            return Pattern::Literal { value: LiteralValue::IntVal(parse_int(tok.value).unwrap_or(0)), span: tok.span }
        }
        if self.check(TokenKind::TkFloatLit) {
            self.advance()
            return Pattern::Literal { value: LiteralValue::FloatVal(parse_float(tok.value).unwrap_or(0.0)), span: tok.span }
        }
        if self.check(TokenKind::TkStringLit) {
            self.advance()
            return Pattern::Literal { value: LiteralValue::StrVal(tok.value), span: tok.span }
        }
        if self.check(TokenKind::TkTrue) {
            self.advance()
            return Pattern::Literal { value: LiteralValue::BoolVal(true), span: tok.span }
        }
        if self.check(TokenKind::TkFalse) {
            self.advance()
            return Pattern::Literal { value: LiteralValue::BoolVal(false), span: tok.span }
        }

        if self.check(TokenKind::TkIdent) {
            self.advance()
            var name = tok.value
            var qualifier: Str? = none

            if is_uppercase(name.char_at(0).unwrap_or("")) && self.check(TokenKind::TkColonColon) {
                self.advance()
                let variant_tok = self.expect(TokenKind::TkIdent)
                qualifier = some(name)
                name = variant_tok.value
            }

            if self.check(TokenKind::TkLParen) {
                self.advance()
                var fields: List<Pattern> = []
                if !self.check(TokenKind::TkRParen) {
                    fields.push(self.parse_pattern())
                    while self.try_consume(TokenKind::TkComma) {
                        if self.check(TokenKind::TkRParen) { break }
                        fields.push(self.parse_pattern())
                    }
                }
                self.expect(TokenKind::TkRParen)
                let end = self.current_span_start()
                return Pattern::Constructor { name: name, qualifier: qualifier, fields: fields, span: self.make_span(start, end) }
            }

            if self.check(TokenKind::TkLBrace) && is_uppercase(name.char_at(0).unwrap_or("")) {
                self.advance()
                var named_fields: List<NamedPatternField> = []
                var rest = false
                while !self.check(TokenKind::TkRBrace) && !self.at_end() {
                    if self.check(TokenKind::TkDotDot) {
                        self.advance()
                        rest = true
                        self.try_consume(TokenKind::TkComma)
                        break
                    }
                    let f_start = self.current_span_start()
                    let f_name = self.expect(TokenKind::TkIdent).value
                    var pat = Pattern::Binding { name: f_name, span: self.make_span(f_start, self.current_span_start()) }
                    if self.try_consume(TokenKind::TkColon) {
                        pat = self.parse_pattern()
                    }
                    let f_end = self.current_span_start()
                    named_fields.push(NamedPatternField { name: f_name, pattern: pat, span: self.make_span(f_start, f_end) })
                    self.try_consume(TokenKind::TkComma)
                }
                self.expect(TokenKind::TkRBrace)
                let end = self.current_span_start()
                return Pattern::NamedConstructor { name: name, qualifier: qualifier, fields: named_fields, rest: rest, span: self.make_span(start, end) }
            }

            if qualifier.is_some() {
                return Pattern::Constructor { name: name, qualifier: qualifier, fields: [], span: self.make_span(start, self.current_span_start()) }
            }

            return Pattern::Binding { name: name, span: tok.span }
        }

        if self.check(TokenKind::TkLParen) {
            self.advance()
            let first = self.parse_pattern()
            if !self.check(TokenKind::TkComma) {
                self.error("Expected ',' in tuple pattern - single-element tuple patterns not supported")
            }
            self.advance()
            var elements = [first]
            if !self.check(TokenKind::TkRParen) {
                elements.push(self.parse_pattern())
                while self.try_consume(TokenKind::TkComma) {
                    if self.check(TokenKind::TkRParen) { break }
                    elements.push(self.parse_pattern())
                }
            }
            let end_tok = self.expect(TokenKind::TkRParen)
            return Pattern::TuplePattern { elements: elements, span: self.make_span(start, end_tok.span.end) }
        }

        self.error("Unexpected token '${tok.value}' in pattern")
    }

    // ============================================================
    // Handle expression
    // ============================================================

    fn parse_handle_expr(var self) -> Expr {
        let start = self.current_span_start()
        self.expect(TokenKind::TkHandle)
        let body = self.parse_block_expr()
        self.expect(TokenKind::TkWith)
        self.expect(TokenKind::TkLBrace)
        var handlers: List<EffectHandler> = []
        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            handlers.push(self.parse_effect_handler())
            self.try_consume(TokenKind::TkComma)
        }
        self.expect(TokenKind::TkRBrace)
        let end = self.current_span_start()
        Expr::HandleExpr { body: body, handlers: handlers, span: self.make_span(start, end) }
    }

    fn parse_effect_handler(var self) -> EffectHandler {
        let start = self.current_span_start()
        let effect_name = self.expect(TokenKind::TkIdent).value
        self.expect(TokenKind::TkDot)
        let op_name = self.expect(TokenKind::TkIdent).value
        self.expect(TokenKind::TkLParen)
        let params = self.parse_params()
        self.expect(TokenKind::TkRParen)
        self.expect(TokenKind::TkFatArrow)
        let body = self.parse_expr()
        let end = self.current_span_start()
        EffectHandler { effect_name: effect_name, op_name: op_name, params: params, resume_name: none, body: body, span: self.make_span(start, end) }
    }

    // ============================================================
    // Lambda expression
    // ============================================================

    fn parse_lambda_expr(var self) -> Expr {
        let start = self.current_span_start()
        self.expect(TokenKind::TkFn)
        self.expect(TokenKind::TkLParen)
        let params = self.parse_params()
        self.expect(TokenKind::TkRParen)
        var return_type: TypeExpr? = none
        if self.try_consume(TokenKind::TkArrow) {
            return_type = some(self.parse_type_expr())
        }
        let body = self.parse_block_expr()
        let end = self.current_span_start()
        Expr::Lambda { params: params, return_type: return_type, body: body, span: self.make_span(start, end) }
    }

    // ============================================================
    // Struct literal
    // ============================================================

    fn parse_struct_literal(var self, name: Str, start: Position, qualifier: Str?) -> Expr {
        self.expect(TokenKind::TkLBrace)
        var fields: List<StructFieldInit> = []
        var spread: Expr? = none
        if self.check(TokenKind::TkDotDot) {
            self.advance()
            spread = some(self.parse_expr())
            self.try_consume(TokenKind::TkComma)
        }
        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            let f_start = self.current_span_start()
            let f_name = self.expect(TokenKind::TkIdent).value
            var f_value = Expr::Ident { name: f_name, qualifier: none, span: self.make_span(f_start, self.current_span_start()) }
            if self.try_consume(TokenKind::TkColon) {
                f_value = self.parse_expr()
            }
            let f_end = self.current_span_start()
            fields.push(StructFieldInit { name: f_name, value: f_value, span: self.make_span(f_start, f_end) })
            self.try_consume(TokenKind::TkComma)
        }
        self.expect(TokenKind::TkRBrace)
        let end = self.current_span_start()
        Expr::StructLit {
            name: name,
            qualifier: qualifier,
            type_args: [],
            fields: fields,
            spread: spread,
            span: self.make_span(start, end)
        }
    }

    // ============================================================
    // Type Expressions
    // ============================================================

    pub fn try_parse_type_args(var self) -> List<TypeExpr> {
        if !self.check(TokenKind::TkLt) { return [] }
        let save_pos = self.pos
        let save_errors = self.error_count
        let sink_checkpoint = self.sink.save()
        self.advance()
        var args: List<TypeExpr> = []
        args.push(self.parse_type_expr())
        while self.try_consume(TokenKind::TkComma) {
            args.push(self.parse_type_expr())
        }
        if !self.check(TokenKind::TkGt) {
            self.pos = save_pos
            self.error_count = save_errors
            self.sink.restore(sink_checkpoint)
            return []
        }
        self.advance()
        args
    }

    pub fn parse_type_expr(var self) -> TypeExpr {
        let start = self.current_span_start()

        if self.check(TokenKind::TkLBrace) {
            return self.parse_record_type_expr()
        }

        if self.check(TokenKind::TkFn) {
            self.advance()
            self.expect(TokenKind::TkLParen)
            var params: List<TypeExpr> = []
            if !self.check(TokenKind::TkRParen) {
                params.push(self.parse_type_expr())
                while self.try_consume(TokenKind::TkComma) {
                    if self.check(TokenKind::TkRParen) { break }
                    params.push(self.parse_type_expr())
                }
            }
            self.expect(TokenKind::TkRParen)
            self.expect(TokenKind::TkArrow)
            let return_type = self.parse_type_expr()
            let end = self.current_span_start()
            return TypeExpr::FnType { params: params, return_type: return_type, span: self.make_span(start, end) }
        }

        if self.check(TokenKind::TkLParen) {
            self.advance()
            let first = self.parse_type_expr()
            if self.check(TokenKind::TkComma) {
                self.advance()
                var elements = [first]
                if !self.check(TokenKind::TkRParen) {
                    elements.push(self.parse_type_expr())
                    while self.check(TokenKind::TkComma) {
                        self.advance()
                        if self.check(TokenKind::TkRParen) { break }
                        elements.push(self.parse_type_expr())
                    }
                }
                let end_tok = self.expect(TokenKind::TkRParen)
                return TypeExpr::TupleType { elements: elements, span: self.make_span(start, end_tok.span.end) }
            }
            self.expect(TokenKind::TkRParen)
            return first
        }

        let name = self.expect(TokenKind::TkIdent).value
        let type_args = self.try_parse_type_args()

        let end = self.current_span_start()
        var result: TypeExpr = TypeExpr::Named { name: name, type_args: type_args, span: self.make_span(start, end) }

        if self.try_consume(TokenKind::TkQuestion) {
            let opt_end = self.current_span_start()
            result = TypeExpr::OptionType { inner: result, span: self.make_span(start, opt_end) }
        }

        result
    }

    fn parse_record_type_expr(var self) -> TypeExpr {
        let start = self.current_span_start()
        self.expect(TokenKind::TkLBrace)
        var fields: List<RecordTypeField> = []
        var rest: Str? = none

        while !self.check(TokenKind::TkRBrace) && !self.at_end() {
            if self.check(TokenKind::TkDotDot) {
                self.advance()
                rest = some(self.expect(TokenKind::TkIdent).value)
                self.try_consume(TokenKind::TkComma)
                break
            }

            let field_start = self.current_span_start()
            let field_name = self.expect(TokenKind::TkIdent).value
            self.expect(TokenKind::TkColon)
            let field_type = self.parse_type_expr()
            let field_end = self.current_span_start()
            fields.push(RecordTypeField { name: field_name, ty: field_type, span: self.make_span(field_start, field_end) })

            if !self.try_consume(TokenKind::TkComma) { break }
        }

        self.expect(TokenKind::TkRBrace)
        let end = self.current_span_start()
        TypeExpr::RecordType { fields: fields, rest: rest, span: self.make_span(start, end) }
    }

    // ============================================================
    // Type Params: <T, U: Constraint>
    // ============================================================

    pub fn parse_type_params(var self) -> List<TypeParam> {
        if !self.check(TokenKind::TkLt) { return [] }
        self.advance()
        var params: List<TypeParam> = []
        while !self.check(TokenKind::TkGt) && !self.at_end() {
            let tp_start = self.current_span_start()
            let name = self.expect(TokenKind::TkIdent).value
            var bounds: List<TypeBound> = []
            if self.try_consume(TokenKind::TkColon) {
                bounds.push(self.parse_type_bound())
                while self.check(TokenKind::TkPlus) {
                    self.advance()
                    bounds.push(self.parse_type_bound())
                }
            }
            let tp_end = self.current_span_start()
            params.push(TypeParam { name: name, bounds: bounds, span: self.make_span(tp_start, tp_end) })
            self.try_consume(TokenKind::TkComma)
        }
        self.expect(TokenKind::TkGt)
        params
    }

    pub fn parse_type_bound(var self) -> TypeBound {
        let start = self.current_span_start()
        let trait_name = self.expect(TokenKind::TkIdent).value
        let type_args = self.try_parse_type_args()
        let end = self.current_span_start()
        TypeBound { trait_name: trait_name, type_args: type_args, span: self.make_span(start, end) }
    }

    // ============================================================
    // Parameters
    // ============================================================

    pub fn parse_params(var self) -> List<Param> {
        var params: List<Param> = []
        if self.check(TokenKind::TkRParen) { return params }
        params.push(self.parse_param())
        while self.try_consume(TokenKind::TkComma) {
            if self.check(TokenKind::TkRParen) { break }
            params.push(self.parse_param())
        }
        params
    }

    pub fn parse_param(var self) -> Param {
        let start = self.current_span_start()
        let is_mutable = self.try_consume(TokenKind::TkVar)
        let name = self.expect(TokenKind::TkIdent).value
        var type_annotation: TypeExpr? = none
        if self.try_consume(TokenKind::TkColon) {
            type_annotation = some(self.parse_type_expr())
        }
        let end = self.current_span_start()
        Param { name: name, is_mutable: is_mutable, type_annotation: type_annotation, span: self.make_span(start, end) }
    }
}
