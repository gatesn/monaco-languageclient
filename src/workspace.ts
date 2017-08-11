/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from './converter';
import { Workspace, TextDocumentDidChangeEvent, TextDocument, Event, Emitter } from "vscode-base-languageclient/lib/services";
import { WorkspaceEdit, TextEdit } from 'vscode-base-languageclient/lib/base';
import IModel = monaco.editor.IModel;

export class MonacoWorkspace implements Workspace {

    protected readonly documents = new Map<string, TextDocument>();
    protected readonly onDidOpenTextDocumentEmitter = new Emitter<TextDocument>();
    protected readonly onDidCloseTextDocumentEmitter = new Emitter<TextDocument>();
    protected readonly onDidChangeTextDocumentEmitter = new Emitter<TextDocumentDidChangeEvent>();

    constructor(
        protected readonly p2m: ProtocolToMonacoConverter,
        protected readonly m2p: MonacoToProtocolConverter,
        public readonly rootUri: string | null = null) {
        for (const model of monaco.editor.getModels()) {
            this.addModel(model);
        }
        monaco.editor.onDidCreateModel(model => this.addModel(model));
        monaco.editor.onWillDisposeModel(model => this.removeModel(model));
    }

    protected removeModel(model: IModel): void {
        const uri = model.uri.toString();
        const document = this.documents.get(uri);
        if (document) {
            this.documents.delete(uri);
            this.onDidCloseTextDocumentEmitter.fire(document);
        }
    }

    protected addModel(model: IModel): void {
        const uri = model.uri.toString();
        const document = this.setModel(uri, model);
        this.onDidOpenTextDocumentEmitter.fire(document)
        model.onDidChangeContent(event =>
            this.onDidChangeContent(uri, model, event)
        );
    }

    protected onDidChangeContent(uri: string, model: IModel, event: monaco.editor.IModelContentChangedEvent) {
        const textDocument = this.setModel(uri, model);
        const contentChanges = [];
        for (const change of event.changes) {
            const range = this.m2p.asRange(change.range);
            const rangeLength = change.rangeLength;
            const text = change.text;
            contentChanges.push({ range, rangeLength, text });
        }
        this.onDidChangeTextDocumentEmitter.fire({
            textDocument,
            contentChanges
        });
    }

    protected setModel(uri: string, model: IModel): TextDocument {
        const document = TextDocument.create(uri, model.getModeId(), model.getVersionId(), model.getValue());
        this.documents.set(uri, document);
        return document;
    }

    get textDocuments(): TextDocument[] {
        return Array.from(this.documents.values());
    }

    get onDidOpenTextDocument(): Event<TextDocument> {
        return this.onDidOpenTextDocumentEmitter.event;
    }

    get onDidCloseTextDocument(): Event<TextDocument> {
        return this.onDidCloseTextDocumentEmitter.event;
    }

    get onDidChangeTextDocument(): Event<TextDocumentDidChangeEvent> {
        return this.onDidChangeTextDocumentEmitter.event;
    }

    public applyEdit(workspaceEdit: WorkspaceEdit): Thenable<boolean> {
        let applied = true;
        if (workspaceEdit.documentChanges) {
            for (const change of workspaceEdit.documentChanges) {
                if (change.textDocument.version && change.textDocument.version >= 0) {
                    const textDocument = this.documents.get(change.textDocument.uri);
                    if (textDocument && textDocument.version === change.textDocument.version) {
                        monaco.editor.getModel(monaco.Uri.parse(textDocument.uri)).pushEditOperations(
                            [],  // Do not try and preserve editor selections.
                            change.edits.map((edit: TextEdit) => {
                                return {
                                    identifier: {major: 1, minor: 0},
                                    range: this.p2m.asRange(edit.range),
                                    text: edit.newText,
                                    forceMoveMarkers: true,
                                };
                            }),
                            () => [],  // Do not try and preserve editor selections.
                        );
                    } else {
                        applied = false;
                    }
                } else {
                    applied = false;
                }
            }
        } else {
            applied = false;
        }
        return Promise.resolve(applied);
    }

}
