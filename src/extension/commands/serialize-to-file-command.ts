import {ExtensionCommand, getSerializedWorkspace, writeSerializedWorkspaceToFile} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import * as vscode from "vscode";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";

export class SerializeToFileCommand extends ExtensionCommand {
    constructor(client: LanguageClient, logger: vscode.OutputChannel) {
        super("model-modeling-language.serializeToFile", client, logger);
    }

    execute(...args: any[]): any {
        getSerializedWorkspace(this.client, ...args).then(value => {
            if (value.success) {
                if (value.documents.filter(x => x.diagnostics.filter(y => y.severity == 1).length > 0).length > 0) {
                    showUIMessage(MessageType.WARNING, "Generation was carried out, although there are still some problems of the highest severity!");
                }
                writeSerializedWorkspaceToFile(value);
            } else {
                showUIMessage(MessageType.ERROR, value.data);
            }
        })
    }

}