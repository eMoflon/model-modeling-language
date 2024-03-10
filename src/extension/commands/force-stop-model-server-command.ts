import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerStarter} from "../model-server-starter.js";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";

export class ForceStopModelServerCommand extends ExtensionCommand {
    readonly modelServerStarter: ModelServerStarter;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, modelServerStarter: ModelServerStarter) {
        super("model-modeling-language.forceStopModelServer", client, logger);
        this.modelServerStarter = modelServerStarter;
    }

    execute(...args: any[]): any {
        this.modelServerStarter.terminate(true).then(res => {
            if (res) {
                showUIMessage(MessageType.INFO, "Terminated ModelServer successfully!")
            } else {
                showUIMessage(MessageType.ERROR, "Could not terminate ModelServer!")
            }
        }).catch(reason => showUIMessage(MessageType.ERROR, `Could not terminate ModelServer! (Reason: ${reason})`));
    }
}