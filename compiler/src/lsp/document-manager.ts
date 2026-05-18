import { Parser } from "../parser/parser.js";
import { check, CheckResult } from "../checker/checker.js";
import { CollectingSink, Diagnostic } from "../diagnostics/index.js";
import { Program } from "../ast/index.js";

export interface DocumentState {
  uri: string;
  version: number;
  source: string;
  ast: Program | null;
  checkResult: CheckResult | null;
  diagnostics: Diagnostic[];
}

export class DocumentManager {
  private documents = new Map<string, DocumentState>();

  open(uri: string, version: number, source: string): DocumentState {
    const state = this.compile(uri, version, source);
    this.documents.set(uri, state);
    return state;
  }

  update(uri: string, version: number, source: string): DocumentState {
    const state = this.compile(uri, version, source);
    this.documents.set(uri, state);
    return state;
  }

  close(uri: string): void {
    this.documents.delete(uri);
  }

  get(uri: string): DocumentState | undefined {
    return this.documents.get(uri);
  }

  private compile(uri: string, version: number, source: string): DocumentState {
    const sink = new CollectingSink();
    let ast: Program | null = null;
    let checkResult: CheckResult | null = null;

    try {
      ast = Parser.parse(source, uri, sink);
      checkResult = check(ast, sink);
    } catch {
      // Compilation may throw on severe errors; diagnostics are still in sink
    }

    return {
      uri,
      version,
      source,
      ast,
      checkResult,
      diagnostics: [...sink.diagnostics()],
    };
  }
}
