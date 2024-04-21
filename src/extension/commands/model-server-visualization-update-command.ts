import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerVisualServer} from "../model-server-visual-server.js";
import {getTestClass2} from "../example-diagram.js";

export class ModelServerVisualizationUpdateCommand extends ExtensionCommand {
    private readonly _visServer: ModelServerVisualServer;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, visServer: ModelServerVisualServer) {
        super("model-modeling-language.msvis.diagram.update", client, logger);
        this._visServer = visServer;
    }

    execute(...args: any[]): any {
        this._visServer.setModelAndUpdate(getTestClass2());
    }
}