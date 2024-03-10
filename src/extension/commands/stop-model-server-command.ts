import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerStarter} from "../model-server-starter.js";
import {ModelServerConnector} from "../model-server-connector.js";

export class StopModelServerCommand extends ExtensionCommand {
    readonly modelServerStarter: ModelServerStarter;
    readonly modelServerConnector: ModelServerConnector;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, modelServerStarter: ModelServerStarter, modelServerConnector: ModelServerConnector) {
        super("model-modeling-language.stopModelServer", client, logger);
        this.modelServerStarter = modelServerStarter;
        this.modelServerConnector = modelServerConnector;
    }

    execute(...args: any[]): any {
        //TODO: Fix process termination -> should be able to terminate process in general, not just model server!
        this.modelServerConnector.clients;
        this.modelServerConnector.terminate();
        /*if (this.modelServerStarter.terminate()) {
            showUIMessage(MessageType.INFO, "Terminated ModelServer successfully!")
        } else {
            showUIMessage(MessageType.ERROR, "Could not terminate ModelServer!")
        }*/
    }
}