"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var services_1 = require("vscode-base-languageclient/lib/services");
var MonacoWorkspace = (function () {
    function MonacoWorkspace(p2m, m2p, rootUri) {
        if (rootUri === void 0) { rootUri = null; }
        var _this = this;
        this.p2m = p2m;
        this.m2p = m2p;
        this.rootUri = rootUri;
        this.documents = new Map();
        this.onDidOpenTextDocumentEmitter = new services_1.Emitter();
        this.onDidCloseTextDocumentEmitter = new services_1.Emitter();
        this.onDidChangeTextDocumentEmitter = new services_1.Emitter();
        for (var _i = 0, _a = monaco.editor.getModels(); _i < _a.length; _i++) {
            var model = _a[_i];
            this.addModel(model);
        }
        monaco.editor.onDidCreateModel(function (model) { return _this.addModel(model); });
        monaco.editor.onWillDisposeModel(function (model) { return _this.removeModel(model); });
    }
    MonacoWorkspace.prototype.removeModel = function (model) {
        var uri = model.uri.toString();
        var document = this.documents.get(uri);
        if (document) {
            this.documents.delete(uri);
            this.onDidCloseTextDocumentEmitter.fire(document);
        }
    };
    MonacoWorkspace.prototype.addModel = function (model) {
        var _this = this;
        var uri = model.uri.toString();
        var document = this.setModel(uri, model);
        this.onDidOpenTextDocumentEmitter.fire(document);
        model.onDidChangeContent(function (event) {
            return _this.onDidChangeContent(uri, model, event);
        });
    };
    MonacoWorkspace.prototype.onDidChangeContent = function (uri, model, event) {
        var textDocument = this.setModel(uri, model);
        var contentChanges = [];
        for (var _i = 0, _a = event.changes; _i < _a.length; _i++) {
            var change = _a[_i];
            var range = this.m2p.asRange(change.range);
            var rangeLength = change.rangeLength;
            var text = change.text;
            contentChanges.push({ range: range, rangeLength: rangeLength, text: text });
        }
        this.onDidChangeTextDocumentEmitter.fire({
            textDocument: textDocument,
            contentChanges: contentChanges
        });
    };
    MonacoWorkspace.prototype.setModel = function (uri, model) {
        var document = services_1.TextDocument.create(uri, model.getModeId(), model.getVersionId(), model.getValue());
        this.documents.set(uri, document);
        return document;
    };
    Object.defineProperty(MonacoWorkspace.prototype, "textDocuments", {
        get: function () {
            return Array.from(this.documents.values());
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MonacoWorkspace.prototype, "onDidOpenTextDocument", {
        get: function () {
            return this.onDidOpenTextDocumentEmitter.event;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MonacoWorkspace.prototype, "onDidCloseTextDocument", {
        get: function () {
            return this.onDidCloseTextDocumentEmitter.event;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MonacoWorkspace.prototype, "onDidChangeTextDocument", {
        get: function () {
            return this.onDidChangeTextDocumentEmitter.event;
        },
        enumerable: true,
        configurable: true
    });
    MonacoWorkspace.prototype.applyEdit = function (workspaceEdit) {
        var _this = this;
        var applied = true;
        if (workspaceEdit.documentChanges) {
            for (var _i = 0, _a = workspaceEdit.documentChanges; _i < _a.length; _i++) {
                var change = _a[_i];
                if (change.textDocument.version && change.textDocument.version >= 0) {
                    var textDocument = this.documents.get(change.textDocument.uri);
                    if (textDocument && textDocument.version === change.textDocument.version) {
                        monaco.editor.getModel(monaco.Uri.parse(textDocument.uri)).pushEditOperations([], // Do not try and preserve editor selections.
                        change.edits.map(function (edit) {
                            return {
                                identifier: { major: 1, minor: 0 },
                                range: _this.p2m.asRange(edit.range),
                                text: edit.newText,
                                forceMoveMarkers: true,
                            };
                        }), function () { return []; });
                    }
                    else {
                        applied = false;
                    }
                }
                else {
                    applied = false;
                }
            }
        }
        else {
            applied = false;
        }
        return Promise.resolve(applied);
    };
    return MonacoWorkspace;
}());
exports.MonacoWorkspace = MonacoWorkspace;
//# sourceMappingURL=workspace.js.map