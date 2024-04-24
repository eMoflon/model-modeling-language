import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerVisualServer} from "../model-server-visual-server.js";

export class ModelServerVisualizationOpenCommand extends ExtensionCommand {
    private readonly _visualServer: ModelServerVisualServer;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, visualServer: ModelServerVisualServer) {
        super("model-modeling-language.msvis.diagram.open", client, logger);
        this._visualServer = visualServer;
    }

    execute(...args: any[]): any {
        this._visualServer.openVisualization();
        this._visualServer.requestVisualizationData([], []);
    }
}