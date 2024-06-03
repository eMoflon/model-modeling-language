import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerEvaluationPanel} from "../panels/model-server-evaluation-panel.js";
import {ModelServerConnector} from "../model-server-connector.js";
import {ModelServerVisualServer} from "../model-server-visual-server.js";

export class ShowModelServerEvaluationViewCommand extends ExtensionCommand {
    private readonly _extensionContext: vscode.ExtensionContext;
    private readonly _modelServerConnector: ModelServerConnector;
    private readonly _visualServer: ModelServerVisualServer;
    private readonly _modelEvaluationLogger: vscode.OutputChannel;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, extensionContext: vscode.ExtensionContext, modelServerConnector: ModelServerConnector, visualServer: ModelServerVisualServer, evalLogger: vscode.OutputChannel) {
        super("model-modeling-language.showModelServerEvaluationView", client, logger);
        this._extensionContext = extensionContext;
        this._modelServerConnector = modelServerConnector;
        this._visualServer = visualServer;
        this._modelEvaluationLogger = evalLogger;
    }

    execute(...args: any[]): any {
        ModelServerEvaluationPanel.createOrShow(this._extensionContext, this._modelServerConnector, this._visualServer, this._modelEvaluationLogger);
    }
}