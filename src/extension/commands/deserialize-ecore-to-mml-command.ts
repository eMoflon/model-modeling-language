import {ExtensionCommand, writeGeneratedMmlFile} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import * as vscode from "vscode";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";
import {spawn} from "node:child_process";
import {deserializeSerializedCLIDoc} from "../../language/deserializer/mml-deserializer.js";

export class DeserializeEcoreToMmlCommand extends ExtensionCommand {
    constructor(client: LanguageClient, logger: vscode.OutputChannel) {
        super("model-modeling-language.deserializeEcoreToMML", client, logger);
    }

    execute(...args: any[]): any {
        if (args.length == 0 || args.length > 2 || (args.length == 2 && !Array.isArray(args.at(1)))) {
            showUIMessage(MessageType.ERROR, `Unexpected file selection Please try again or report a bug!`);
            showUIMessage(MessageType.INFO, JSON.stringify(args));
            return;
        } else if (args.length == 2 && args.at(1).length != 1) {
            showUIMessage(MessageType.ERROR, `You must select a single Ecore file! (You selected ${args.at(1).length})`);
            return;
        }
        const selection: vscode.Uri = args.at(0);
        if (selection.scheme != "file") {
            showUIMessage(MessageType.ERROR, `Invalid selection scheme: ${selection.scheme}`);
            return;
        }
        showUIMessage(MessageType.INFO, `Got command! Selection: ${selection.fsPath}`);

        const workspaceConfiguration = vscode.workspace.getConfiguration('model-modeling-language');
        const connectorPath: string | undefined = workspaceConfiguration.get('cli.path');

        const connectorCommand = `java -jar ${connectorPath} serialize ${selection.fsPath}`;

        let serializedEcore: string = "";
        let recordData: boolean = false;

        this.logger.appendLine("[INFO] " + "======== Model Modeling Language CLI ========");
        this.logger.appendLine("[INFO] " + connectorCommand);
        this.logger.appendLine("[INFO] ");

        const proc = spawn(connectorCommand, {shell: true});

        proc.stdin.setDefaultEncoding('utf8');
        proc.stdout.setEncoding('utf8');

        proc.stdout.on('data', (data) => {
            this.logger.appendLine("[INFO] " + data);

            if (typeof data === 'string') {
                if (recordData) {
                    serializedEcore += data;
                } else if (data.trim() == "=$MML-CONTENT-START$=") {
                    recordData = true;
                }
            }
        });

        proc.stderr.on('data', (data) => {
            this.logger.appendLine("[ERROR] " + data);
            showUIMessage(MessageType.ERROR, data);
        });

        proc.on('close', (code) => {
            if (code == 0) {
                this.logger.appendLine(`[COMPLETED] Received data!`);
                const trimmed: string = serializedEcore.trim();
                if (trimmed.startsWith("[{") && trimmed.endsWith("}]")) {
                    this.logger.appendLine(`[COMPLETED] Start deserializing...`);
                    const deserialized: {
                        modelName: string,
                        modelCode: string
                    } = deserializeSerializedCLIDoc(trimmed);
                    this.logger.appendLine(`[COMPLETED] ${deserialized.modelName}`);
                    this.logger.appendLine(`[COMPLETED] ${deserialized.modelCode}`);
                    writeGeneratedMmlFile(selection, deserialized.modelName, deserialized.modelCode);
                } else {
                    this.logger.appendLine("=== RECEIVED ===");
                    this.logger.appendLine(trimmed);
                    showUIMessage(MessageType.ERROR, "Failed to parse CLI output!")
                }
            } else if (code == 1) {
                showUIMessage(MessageType.ERROR, `Translation failed!`);
            } else if (code == 2) {
                showUIMessage(MessageType.ERROR, `Input failed!`);
            }
        });
    }

}