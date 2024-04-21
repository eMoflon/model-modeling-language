import type {LanguageClientOptions, ServerOptions} from 'vscode-languageclient/node.js';
import {LanguageClient, TransportKind} from 'vscode-languageclient/node.js';
import * as vscode from 'vscode';
import {Uri} from 'vscode';
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
import {ForceStopModelServerCommand} from "./commands/force-stop-model-server-command.js";
import {ShowModelServerEvaluationViewCommand} from "./commands/show-model-server-evaluation-view-command.js";
import {WebviewPanelManager} from "sprotty-vscode/lib";
import {Messenger} from "vscode-messenger";
import {ModelServerVisualizationOpenCommand} from "./commands/model-server-visualization-open-command.js";
import {ModelServerVisualizationFitCommand} from "./commands/model-server-visualization-fit-command.js";
import {ModelServerVisualizationCenterCommand} from "./commands/model-server-visualization-center-command.js";
import {ModelServerVisualizationExportCommand} from "./commands/model-server-visualization-export-command.js";
import {ActionNotification} from "sprotty-vscode";
import {ModelServerVisualServer} from "./model-server-visual-server.js";
import {ModelServerVisualizationUpdateCommand} from "./commands/model-server-visualization-update-command.js";

let client: LanguageClient;
let logger: vscode.OutputChannel;
let modelServerLogger: vscode.OutputChannel;
let modelEvaluationLogger: vscode.OutputChannel;
let modelServerConnector: ModelServerConnector;
let modelServerGeneratorViewContainer: ModelServerGeneratorViewContainer;
let modelServerStarter: ModelServerStarter;
let webviewPanelManager: WebviewPanelManager;
let modelServerVisualServer: ModelServerVisualServer;


// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {
    client = startLanguageClient(context);
    logger = vscode.window.createOutputChannel("Model Modeling Language CLI")
    modelServerLogger = vscode.window.createOutputChannel("MML Model Server")
    modelEvaluationLogger = vscode.window.createOutputChannel("MML Constraint Evaluation")
    modelServerConnector = new ModelServerConnector(modelServerLogger);
    modelServerStarter = new ModelServerStarter(modelServerLogger, client, modelServerConnector);
    modelServerGeneratorViewContainer = new ModelServerGeneratorViewContainer();
    prepareModelServerVisualization(context);
    registerCommands(context);
    registerGMNotebook(context);
}

// This function is called when the extension is deactivated.
export async function deactivate(): Promise<void> {
    const promises: Promise<void>[] = []
    if (client) {
        promises.push(client.stop());
    }
    if (modelServerStarter) {
        promises.push(modelServerStarter.terminate(true).then(() => undefined));
    }
    return Promise.all(promises).then(() => undefined);
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
    new ForceStopModelServerCommand(client, logger, modelServerStarter).register(context);
    new RefreshProjectResourcesCommand(client, logger, modelServerGeneratorViewContainer).register(context);
    new RemoveSelectedResourceCommand(client, logger, modelServerGeneratorViewContainer).register(context);
    new ShowModelServerEvaluationViewCommand(client, logger, context, modelServerConnector, modelEvaluationLogger).register(context);
}

function registerGMNotebook(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.registerNotebookSerializer(
            'gm-notebook', new GMNotebookSerializer(), {transientOutputs: true}
        ),
        new GMNotebookKernel(modelServerConnector)
    );
}

function prepareModelServerVisualization(context: vscode.ExtensionContext) {
    const msg: Messenger = new Messenger();

    webviewPanelManager = new WebviewPanelManager({
        extensionUri: Uri.joinPath(context.extensionUri, "out", "extension"),
        defaultDiagramType: 'modelServerVisualizationView',
        messenger: msg,
        singleton: true
    });

    modelServerVisualServer = new ModelServerVisualServer(webviewPanelManager, logger);

    msg.onNotification(ActionNotification, (params, sender) => logger.appendLine(`[ReceivedNotification] ${params.action.kind}`));

    new ModelServerVisualizationOpenCommand(client, logger, webviewPanelManager).register(context);
    new ModelServerVisualizationFitCommand(client, logger, webviewPanelManager).register(context);
    new ModelServerVisualizationCenterCommand(client, logger, webviewPanelManager).register(context);
    new ModelServerVisualizationExportCommand(client, logger, webviewPanelManager).register(context);
    new ModelServerVisualizationUpdateCommand(client, logger, modelServerVisualServer).register(context);
}