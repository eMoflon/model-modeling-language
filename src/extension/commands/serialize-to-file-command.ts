import {ExtensionCommand, getSerializedWorkspace, writeToFile} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import * as vscode from "vscode";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";

export class SerializeToFileCommand extends ExtensionCommand {
    constructor(client: LanguageClient, logger: vscode.OutputChannel) {
        super("model-modeling-language.serializeToFile", client, logger);
    }

    execute(...args: any[]): any {
        //showUIMessage(MessageType.INFO, "Got command!");
        getSerializedWorkspace(this.client, ...args).then(value => {
            if (value.success) {
                writeToFile(value);
            } else {
                showUIMessage(MessageType.ERROR, value.data);
            }
        })
    }

}