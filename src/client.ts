/** --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { BaseLanguageClient, LanguageClientOptions, MessageTransports } from "vscode-languageclient";

export interface IMonacoLanguageClientOptions {
    id: string;
    name: string;
    clientOptions: LanguageClientOptions;
}

export class MonacoLanguageClient extends BaseLanguageClient {

    constructor(options: IMonacoLanguageClientOptions, private _transports: Thenable<MessageTransports>) {
        super(options.id, options.name, options.clientOptions);
    }

    protected createMessageTransports(encoding: string): Thenable<MessageTransports> {
        return this._transports;
    }

}
