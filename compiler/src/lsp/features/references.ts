import { Location, Position } from "vscode-languageserver";
import { DocumentState } from "../document-manager.js";
import { span_to_range } from "../utils.js";
import { walk_program } from "../hir-visitor.js";
import { find_ident_at_position } from "./definition.js";

type MatchFn = (name: string, def_id?: number) => boolean;

export function get_references(state: DocumentState, position: Position): Location[] {
  if (!state.checkResult) return [];

  const { program } = state.checkResult;

  const ident = find_ident_at_position(program.decls, position);
  if (ident === null) return [];

  const matches: MatchFn = ident.def_id !== undefined
    ? (_name, did) => did === ident.def_id
    : (name) => name === ident.name;

  const uri = state.uri;
  const out: Location[] = [];

  walk_program(program, {
    enter_expr(expr) {
      if (expr.kind === "ident" && matches(expr.name, expr.def_id)) {
        out.push({ uri, range: span_to_range(expr.span) });
      }
    },
    enter_stmt(stmt) {
      if ((stmt.kind === "let_stmt" || stmt.kind === "var_stmt") && matches(stmt.name, stmt.def_id)) {
        out.push({ uri, range: span_to_range(stmt.name_span) });
      }
      if (stmt.kind === "for_in_stmt" && matches(stmt.binding, stmt.def_id)) {
        out.push({ uri, range: span_to_range(stmt.binding_span) });
      }
      if (stmt.kind === "let_destructure") {
        for (const b of stmt.bindings) {
          if (b.name !== "_" && matches(b.name, b.def_id)) {
            const el = stmt.pattern.elements.find(e => e.kind === "binding" && e.name === b.name);
            if (el) out.push({ uri, range: span_to_range(el.span) });
          }
        }
      }
    },
    enter_fn(fn) {
      if (matches(fn.name, fn.def_id)) {
        out.push({ uri, range: span_to_range(fn.span) });
      }
    },
  });

  return out;
}
