import { Commands, Disposable } from 'vscode-base-languageclient/lib/services';
export declare class MonacoCommands implements Commands {
    private _editor;
    constructor(_editor: monaco.editor.IStandaloneCodeEditor);
    registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable;
}
