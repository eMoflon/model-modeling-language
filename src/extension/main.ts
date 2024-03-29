import type {LanguageClientOptions, ServerOptions} from 'vscode-languageclient/node.js';
import {LanguageClient, TransportKind} from 'vscode-languageclient/node.js';
import * as vscode from 'vscode';
import * as path from 'node:path';
import {SerializeToFileCommand} from "./commands/serialize-to-file-command.js";
import {SerializeToEmfCommand} from "./commands/serialize-to-emf-command.js";
import {DeserializeEcoreToMmlCommand} from "./commands/deserialize-ecore-to-mml-command.js";

let client: LanguageClient;
let logger: vscode.OutputChannel;


// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {
    client = startLanguageClient(context);
    logger = vscode.window.createOutputChannel("Model Modeling Language CLI")
    registerCommands(context);
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}

function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
    const serverModule = context.asAbsolutePath(path.join('out', 'language', 'main.cjs'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = {execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`]};

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: {module: serverModule, transport: TransportKind.ipc},
        debug: {module: serverModule, transport: TransportKind.ipc, options: debugOptions}
    };

    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.mml');
    context.subscriptions.push(fileSystemWatcher);

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{scheme: 'file', language: 'model-modeling-language'}],
        synchronize: {
            // Notify the server about file changes to files contained in the workspace
            fileEvents: fileSystemWatcher
        }
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
        'model-modeling-language',
        'Model Modeling Language',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();
    return client;
}

function registerCommands(context: vscode.ExtensionContext) {
    new SerializeToFileCommand(client, logger).register(context);
    new SerializeToEmfCommand(client, logger).register(context);
    new DeserializeEcoreToMmlCommand(client, logger).register(context);
}
