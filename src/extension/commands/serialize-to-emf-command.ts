import {ExtensionCommand, getSerializedWorkspace} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import * as vscode from "vscode";
import fs from "fs";
import {showInteractiveUIMessage, showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";
import {spawn} from "node:child_process";
import os from "os";

export class SerializeToEmfCommand extends ExtensionCommand {

    constructor(client: LanguageClient, logger: vscode.OutputChannel) {
        super("model-modeling-language.serializeToEMF", client, logger);
    }

    execute(...args: any[]): any {
        getSerializedWorkspace(this.client, ...args).then(value => {
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

            this.logger.appendLine("[INFO] " + "======== Model Modeling Language CLI ========");
            this.logger.appendLine("[INFO] " + connectorCommand);
            this.logger.appendLine("[INFO] ");

            const proc = spawn(connectorCommand, {shell: true});

            proc.stdin.setDefaultEncoding('utf8');
            proc.stdout.setEncoding('utf8');
            proc.stdin.write(connectorMessage + os.EOL);

            proc.stdout.on('data', (data) => {
                this.logger.appendLine("[INFO] " + data);
            });

            proc.stderr.on('data', (data) => {
                this.logger.appendLine("[ERROR] " + data);
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
    }


}