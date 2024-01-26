import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import * as vscode from "vscode";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";
import {ModelServerConnector} from "../model-server-connector.js";

export class TestModelServerCommand extends ExtensionCommand {
    readonly modelServerConnector: ModelServerConnector;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, modelServerConnector: ModelServerConnector) {
        super("model-modeling-language.testModelServer", client, logger);
        this.modelServerConnector = modelServerConnector;
    }

    execute(...args: any[]): any {
        showUIMessage(MessageType.INFO, "Test Model Server...");
        this.modelServerConnector.log("GetState...")
        this.modelServerConnector.clients.managementClient.getState({}).then(() => {
            showUIMessage(MessageType.INFO, "GetState!");
        });
    }
}