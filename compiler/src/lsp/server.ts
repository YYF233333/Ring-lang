import {
  createConnection,
  ProposedFeatures,
  TextDocumentSyncKind,
  InitializeResult,
} from "vscode-languageserver/node.js";
import { DocumentManager } from "./document-manager.js";
import { convert_diagnostics } from "./features/diagnostics.js";
import { get_hover } from "./features/hover.js";
import { get_completions } from "./features/completion.js";
import { get_definition } from "./features/definition.js";
import { get_references } from "./features/references.js";
import { get_rename_edits } from "./features/rename.js";
import { get_document_symbols } from "./features/symbols.js";
import { get_code_actions } from "./features/code-actions.js";

export function start_server(): void {
  const connection = createConnection(ProposedFeatures.all);
  const documents = new DocumentManager();
  const debounce_timers = new Map<string, ReturnType<typeof setTimeout>>();

  connection.onInitialize((): InitializeResult => {
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Full,
        hoverProvider: true,
        completionProvider: { triggerCharacters: [".", ":"] },
        definitionProvider: true,
        referencesProvider: true,
        renameProvider: true,
        documentSymbolProvider: true,
        codeActionProvider: true,
      },
    };
  });

  function publish_diagnostics(uri: string): void {
    const state = documents.get(uri);
    if (!state) return;
    connection.sendDiagnostics({ uri, diagnostics: convert_diagnostics(state.diagnostics) });
  }

  function compile_and_publish(uri: string, version: number, source: string): void {
    documents.update(uri, version, source);
    publish_diagnostics(uri);
  }

  function debounced_compile(uri: string, version: number, source: string): void {
    const existing = debounce_timers.get(uri);
    if (existing) clearTimeout(existing);
    debounce_timers.set(uri, setTimeout(() => {
      compile_and_publish(uri, version, source);
      debounce_timers.delete(uri);
    }, 150));
  }

  connection.onDidOpenTextDocument((params) => {
    documents.open(params.textDocument.uri, params.textDocument.version, params.textDocument.text);
    publish_diagnostics(params.textDocument.uri);
  });

  connection.onDidChangeTextDocument((params) => {
    const text = params.contentChanges[0]?.text;
    if (text !== undefined) {
      debounced_compile(params.textDocument.uri, params.textDocument.version, text);
    }
  });

  connection.onDidCloseTextDocument((params) => {
    const uri = params.textDocument.uri;
    documents.close(uri);
    const timer = debounce_timers.get(uri);
    if (timer) { clearTimeout(timer); debounce_timers.delete(uri); }
    connection.sendDiagnostics({ uri, diagnostics: [] });
  });

  connection.onDidSaveTextDocument((params) => {
    const state = documents.get(params.textDocument.uri);
    if (state) compile_and_publish(params.textDocument.uri, state.version, state.source);
  });

  connection.onHover((params) => {
    const state = documents.get(params.textDocument.uri);
    return state ? get_hover(state, params.position) : null;
  });

  connection.onCompletion((params) => {
    const state = documents.get(params.textDocument.uri);
    return state ? get_completions(state, params.position) : [];
  });

  connection.onDefinition((params) => {
    const state = documents.get(params.textDocument.uri);
    return state ? get_definition(state, params.position) : null;
  });

  connection.onReferences((params) => {
    const state = documents.get(params.textDocument.uri);
    return state ? get_references(state, params.position) : [];
  });

  connection.onRenameRequest((params) => {
    const state = documents.get(params.textDocument.uri);
    return state ? get_rename_edits(state, params.position, params.newName) : null;
  });

  connection.onDocumentSymbol((params) => {
    const state = documents.get(params.textDocument.uri);
    return state ? get_document_symbols(state) : [];
  });

  connection.onCodeAction((params) => {
    const state = documents.get(params.textDocument.uri);
    return state ? get_code_actions(state, params.range) : [];
  });

  connection.listen();
}
