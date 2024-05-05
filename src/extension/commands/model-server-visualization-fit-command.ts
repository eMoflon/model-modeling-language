import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerVisualServer} from "../model-server-visual-server.js";

export class ModelServerVisualizationFitCommand extends ExtensionCommand {
    private readonly _visualServer: ModelServerVisualServer;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, visualServer: ModelServerVisualServer) {
        super("model-modeling-language.msvis.diagram.fit", client, logger);
        this._visualServer = visualServer;
    }

    execute(...args: any[]): any {
        this._visualServer.fitVisualization();
    }
}