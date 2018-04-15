/** --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Disposable } from "vscode-jsonrpc";
import { BaseLanguageClient, MessageTransports } from "vscode-languageclient";
import { DisposableCollection, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import { toSocket } from "vscode-ws-jsonrpc/src/connection";
import { MonacoLanguageClient } from "../../src/client";

const ReconnectingWebSocket = require('reconnecting-websocket');

// register Monaco languages
monaco.languages.register({
    id: 'json',
    extensions: ['.json', '.bowerrc', '.jshintrc', '.jscsrc', '.eslintrc', '.babelrc'],
    aliases: ['JSON', 'json'],
    mimetypes: ['application/json'],
});

// create Monaco editor
const value = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
monaco.editor.create(document.getElementById("container")!, {
    model: monaco.editor.createModel(value, 'json', monaco.Uri.parse('inmemory://model.json'))
});

// create the web socket
const url = createUrl('/sampleServer')
const webSocket = createWebSocket(url);


// TODO(gatesn): inline this back into the vscode-ws-jsonrpc fork
export function listen(options: {
    webSocket: WebSocket;
    onConnection: (transports: MessageTransports) => Disposable;
}) {
    const { webSocket, onConnection } = options;
    const disposables = new DisposableCollection();
    webSocket.onopen = () => {
        const socket = toSocket(webSocket);
        const transports: MessageTransports = {
            reader: new WebSocketMessageReader(socket),
            writer: new WebSocketMessageWriter(socket),
            // TODO(gatesn): implement detached by checking liveness of websocker
        };
        disposables.push(onConnection(transports));
    };
    webSocket.onclose = () => {
        disposables.dispose();
    }
}


// listen when the web socket is opened
listen({
    webSocket,
    onConnection: transports => {
        // create and start the language client
        const languageClient = createLanguageClient(transports);
        return languageClient.start();
    }
});

function createLanguageClient(transports: MessageTransports): BaseLanguageClient {
    return new MonacoLanguageClient({
            id: 'client',
            name: 'Sample Language Client',
            clientOptions: {
                documentSelector: ['json'],
            }
        },
        Promise.resolve(transports)
    );
}

function createUrl(path: string): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${location.host}${path}`;
}

function createWebSocket(url: string): WebSocket {
    const socketOptions = {
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        connectionTimeout: 10000,
        maxRetries: Infinity,
        debug: false
    };
    return new ReconnectingWebSocket(url, undefined, socketOptions);
}
