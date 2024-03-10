import type {LanguageClientOptions, ServerOptions} from 'vscode-languageclient/node.js';
import {LanguageClient, TransportKind} from 'vscode-languageclient/node.js';
import * as vscode from 'vscode';
import * as path from 'node:path';
import {SerializeToFileCommand} from "./commands/serialize-to-file-command.js";
import {SerializeToEmfCommand} from "./commands/serialize-to-emf-command.js";
import {DeserializeEcoreToMmlCommand} from "./commands/deserialize-ecore-to-mml-command.js";
import {SerializeConstraintFileToFileCommand} from "./commands/serialize-constraint-file-to-file-command.js";
import {TestModelServerCommand} from "./commands/test-model-server-command.js";
import {ModelServerConnector} from "./model-server-connector.js";
import {GMNotebookSerializer} from "./gmnotebook/GMNotebookSerializer.js";
import {GMNotebookKernel} from "./gmnotebook/GMNotebookKernel.js";
import {ModelServerGeneratorViewContainer} from "./views/model-server-generator-view-container.js";
import {StartModelServerCommand} from "./commands/start-model-server-command.js";
import {RefreshProjectResourcesCommand} from "./commands/refresh-project-resources-command.js";
import {RemoveSelectedResourceCommand} from "./commands/remove-selected-resource-command.js";
import {ModelServerStarter} from "./model-server-starter.js";
import {StopModelServerCommand} from "./commands/stop-model-server-command.js";

let client: LanguageClient;
let logger: vscode.OutputChannel;
let modelServerLogger: vscode.OutputChannel;
let modelServerConnector: ModelServerConnector;
let modelServerGeneratorViewContainer: ModelServerGeneratorViewContainer;
let modelServerStarter: ModelServerStarter;


// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {
    client = startLanguageClient(context);
    logger = vscode.window.createOutputChannel("Model Modeling Language CLI")
    modelServerLogger = vscode.window.createOutputChannel("MML Model Server")
    modelServerConnector = new ModelServerConnector(modelServerLogger);
    modelServerStarter = new ModelServerStarter(modelServerLogger, client);
    modelServerGeneratorViewContainer = new ModelServerGeneratorViewContainer();
    registerCommands(context);
    registerGMNotebook(context);
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

    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.(mml|gc|gm)');
    context.subscriptions.push(fileSystemWatcher);

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            {
                scheme: 'file',
                language: 'model-modeling-language'
            },
            {
                scheme: 'file',
                language: 'graph-constraint-language'
            },
            {
                scheme: 'file',
                language: 'graph-manipulation-language'
            },
            {
                scheme: 'vscode-notebook-cell',
                language: 'graph-manipulation-language'
            }],
        synchronize: {
            // Notify the server about file changes to files contained in the workspace
            fileEvents: fileSystemWatcher
        }
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
        'model-modeling-and-constraint-language',
        'Model Modeling and Constraint Language',
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
    new SerializeConstraintFileToFileCommand(client, logger).register(context);
    new TestModelServerCommand(client, logger, modelServerConnector).register(context);
    new StartModelServerCommand(client, logger, modelServerGeneratorViewContainer, modelServerStarter).register(context);
    new StopModelServerCommand(client, logger, modelServerStarter).register(context);
    new RefreshProjectResourcesCommand(client, logger, modelServerGeneratorViewContainer).register(context);
    new RemoveSelectedResourceCommand(client, logger, modelServerGeneratorViewContainer).register(context);
}

function registerGMNotebook(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.registerNotebookSerializer(
            'gm-notebook', new GMNotebookSerializer(), {transientOutputs: true}
        ),
        new GMNotebookKernel(modelServerConnector)
    );
}