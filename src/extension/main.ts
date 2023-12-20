import type {LanguageClientOptions, ServerOptions} from 'vscode-languageclient/node.js';
import {LanguageClient, TransportKind} from 'vscode-languageclient/node.js';
import {EnhancedSerializedWorkspace, MmlGeneratorRequest, SerializedWorkspace} from "../shared/MmlConnectorTypes.js";
import * as vscode from 'vscode';
import {Uri} from 'vscode';
import * as path from 'node:path';
import {showInteractiveUIMessage, showUIMessage} from "../shared/NotificationUtil.js";
import {MessageType} from "../shared/MmlNotificationTypes.js";
import fs from "fs";
import {spawn} from "node:child_process";
import * as os from "os";

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

function getSerializedWorkspace(...args: any[]): Promise<EnhancedSerializedWorkspace> {
    return new Promise<EnhancedSerializedWorkspace>(resolve => {
        if (args.length == 0) {
            showUIMessage(MessageType.ERROR, "Could not determine workspace!");
            resolve({success: false, data: "Could not determine workspace!", documents: [], wsName: "", wsBasePath: ""})
            return;
        }

        const {fsPath}: { fsPath: string } = args[0]
        const fsPathUri: Uri = Uri.file(fsPath);

        const workspace = vscode.workspace.getWorkspaceFolder(fsPathUri);

        if (workspace == undefined) {
            showUIMessage(MessageType.ERROR, "Could not determine workspace!");
            resolve({success: false, data: "Could not determine workspace!", documents: [], wsName: "", wsBasePath: ""})
            return;
        }

        const workspaceName: string = workspace!.name;
        const workspacePath = workspace.uri.fsPath;

        const req: MmlGeneratorRequest = {
            wsBasePath: workspacePath,
            wsName: workspaceName
        }

        client.sendRequest("model-modeling-language-get-serialized-workspace", req, undefined)
            .then((uResponse) => {
                const res: SerializedWorkspace = uResponse as SerializedWorkspace;
                resolve({
                    success: res.success,
                    data: res.data,
                    documents: res.documents,
                    wsName: workspaceName,
                    wsBasePath: workspacePath
                });
            })
    });
}

function writeToFile(enhancedSerializedWorkspace: EnhancedSerializedWorkspace): void {
    let fd;
    try {
        fd = fs.openSync(path.join(enhancedSerializedWorkspace.wsBasePath, `${enhancedSerializedWorkspace.wsName}.json`), "w");
        fs.writeFileSync(fd, JSON.stringify(enhancedSerializedWorkspace.documents), {encoding: "utf-8"});
    } catch (err) {
        showUIMessage(MessageType.ERROR, err instanceof Error ? err.message : "Unknown Exception")
    } finally {
        if (fd !== undefined) {
            fs.closeSync(fd);
            showUIMessage(MessageType.INFO, `Stored serialized workspace in ${enhancedSerializedWorkspace.wsName}.json`)
            return;
        }
    }
}

function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand("model-modeling-language.serializeToFile", function (...args) {
        //showUIMessage(MessageType.INFO, "Got command!");
        getSerializedWorkspace(...args).then(value => {
            if (value.success) {
                writeToFile(value);
            } else {
                showUIMessage(MessageType.ERROR, value.data);
            }
        })
    }));

    context.subscriptions.push(vscode.commands.registerCommand("model-modeling-language.serializeToEMF", function (...args) {
        getSerializedWorkspace(...args).then(value => {
            const workspaceConfiguration = vscode.workspace.getConfiguration('model-modeling-language');
            const connectorPath: string | undefined = workspaceConfiguration.get('cli.path');

            if (connectorPath == undefined || connectorPath == "" || !fs.existsSync(connectorPath)) {
                showInteractiveUIMessage(MessageType.ERROR, "Could not find the model-modeling-language-cli! Check if the correct path is set!", ["Check settings"]).then((sel: string | undefined) => {
                    if (sel != undefined && sel == "Check settings") {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'model-modeling-language.cli.path');
                    }
                });
                return;
            }

            const connectorCommand = `java -jar ${connectorPath} generate ${value.wsName} ${value.wsBasePath}`;
            const connectorMessage = JSON.stringify(value.documents);

            logger.appendLine("[INFO] " + "======== Model Modeling Language CLI ========");
            logger.appendLine("[INFO] " + connectorCommand);
            logger.appendLine("[INFO] ");

            const proc = spawn(connectorCommand, {shell: true});

            proc.stdin.setDefaultEncoding('utf8');
            proc.stdout.setEncoding('utf8');
            proc.stdin.write(connectorMessage + os.EOL);

            proc.stdout.on('data', (data) => {
                logger.appendLine("[INFO] " + data);
            });

            proc.stderr.on('data', (data) => {
                logger.appendLine("[ERROR] " + data);
                showUIMessage(MessageType.ERROR, data);
            });

            proc.on('close', (code) => {
                if (code == 0) {
                    showUIMessage(MessageType.INFO, `Stored generated Ecore/XMI files in the model directory`);
                } else if (code == 1) {
                    showUIMessage(MessageType.ERROR, `Deserialization failed!`);
                } else if (code == 2) {
                    showUIMessage(MessageType.ERROR, `Input failed!`);
                }
            });
        })
    }));
}
