import {
    ExtensionCommand,
    getSerializedConstraintDocument,
    writeSerializedConstraintDocToFile
} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import * as vscode from "vscode";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";
import {GclSerializerRequest} from "../../shared/GclConnectorTypes.js";

export class SerializeConstraintFileToFileCommand extends ExtensionCommand {
    constructor(client: LanguageClient, logger: vscode.OutputChannel) {
        super("model-modeling-language.serializeConstraintFileToFile", client, logger);
    }

    execute(...args: any[]): any {
        if (args.length == 0 || args.length > 2 || (args.length == 2 && !Array.isArray(args.at(1)))) {
            showUIMessage(MessageType.ERROR, `Unexpected file selection! Please try again or report a bug!`);
            showUIMessage(MessageType.INFO, JSON.stringify(args));
            return;
        } else if (args.length == 2 && args.at(1).length != 1) {
            showUIMessage(MessageType.ERROR, `You must select a single GC file! (You selected ${args.at(1).length})`);
            return;
        }
        const selection: vscode.Uri = args.at(0);
        if (selection.scheme != "file") {
            showUIMessage(MessageType.ERROR, `Invalid selection scheme: ${selection.scheme}`);
            return;
        }

        const request: GclSerializerRequest = {
            uri: selection
        };

        getSerializedConstraintDocument(this.client, request).then(value => {
            if (value.success) {
                writeSerializedConstraintDocToFile(value);
            } else {
                showUIMessage(MessageType.ERROR, value.data);
            }
        });
    }

}